import * as crypto from 'crypto';

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { EmailService } from '../../common/services/email.service';
import { UserService } from '../../common/services/user.service';
import { UserStatus, RoleName, type UserWithRoles } from '../../common/types/user.types';
import { AuthResponseDto, UserResponseDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: UserResponseDto; message: string }> {
    const { email, firstName, lastName, password, roles = [] } = registerDto;

    // Check if user already exists
    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate email verification token
    const emailVerificationToken = this.generateToken();

    // Create user
    const savedUser = await this.userService.createUser({
      email,
      firstName,
      lastName,
      password,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
      emailVerificationToken,
    });

    // Assign roles if provided
    if (roles.length > 0) {
      await this.userService.assignRolesToUser(savedUser.id, roles);
    }

    // Send verification email
    await this.emailService.sendEmailVerification(email, emailVerificationToken);

    this.logger.log(`User registered: ${email}`);

    return {
      user: this.mapUserToResponseDto(savedUser, roles),
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user with roles
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Validate password
    const isPasswordValid = await this.userService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userService.updateUser(user.id, { lastLoginAt: new Date() });

    // Get active roles
    const activeRoles = await this.userService.getActiveRoles(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, activeRoles);

    this.logger.log(`User logged in: ${email}`);

    return {
      ...tokens,
      user: this.mapUserToResponseDto(user, activeRoles),
    };
  }

  async refreshTokens(userId: string, email: string): Promise<AuthResponseDto> {
    const user = await this.userService.findUserById(userId);

    if (!user || user.email !== email || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const activeRoles = await this.userService.getActiveRoles(user.id);
    const tokens = await this.generateTokens(user.id, user.email, activeRoles);

    return {
      ...tokens,
      user: this.mapUserToResponseDto(user, activeRoles),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.userService.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires,
    });

    // Send reset email
    await this.emailService.sendPasswordReset(email, resetToken);

    this.logger.log(`Password reset requested for: ${email}`);

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    const user = await this.userService.findUserByPasswordResetToken(token);

    if (!user?.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    await this.userService.updateUser(user.id, {
      password,
      passwordResetToken: null,
      passwordResetExpires: null,
      status: UserStatus.ACTIVE, // Activate account if it was pending
    });

    this.logger.log(`Password reset successful for: ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { token } = verifyEmailDto;

    const user = await this.userService.findUserByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Verify email
    await this.userService.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      status: UserStatus.ACTIVE,
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    this.logger.log(`Email verified for: ${user.email}`);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const emailVerificationToken = this.generateToken();
    await this.userService.updateUser(user.id, { emailVerificationToken });

    // Send verification email
    await this.emailService.sendEmailVerification(email, emailVerificationToken);

    this.logger.log(`Verification email resent to: ${email}`);

    return { message: 'Verification email has been sent' };
  }

  async assignRolesToUser(userId: string, roleNames: RoleName[]): Promise<void> {
    await this.userService.assignRolesToUser(userId, roleNames);
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: RoleName[]
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('auth.jwt.secret') ?? 'fallback-secret',
        expiresIn: this.configService.get<string>('auth.jwt.expiresIn', '1h'),
      }),
      this.jwtService.signAsync(
        { sub: userId, email, tokenVersion: 1 },
        {
          secret:
            this.configService.get<string>('auth.jwtRefresh.secret') ?? 'fallback-refresh-secret',
          expiresIn: this.configService.get<string>('auth.jwtRefresh.expiresIn', '7d'),
        }
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 3600),
    };
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private mapUserToResponseDto(user: UserWithRoles, roles: RoleName[]): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: this.userService.getFullName(user.firstName, user.lastName),
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

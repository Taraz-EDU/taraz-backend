import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleName, UserStatus } from '@prisma/client';

import { PrismaService } from '../../common/services/prisma.service';
import { UserService } from '../../common/services/user.service';
import { type UserWithRoles } from '../../common/types/user.types';
import { type CreateUserDto } from '../dto/create-user.dto';
import { type LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async validateUser(loginDto: LoginDto): Promise<UserWithRoles> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userService.validatePassword(
      loginDto.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: UserWithRoles): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.getTokens(user.id, user.email);
    await this.userService.update(user.id, {
      lastLoginAt: new Date(),
      ...tokens,
    });
    return tokens;
  }

  async register(createUserDto: CreateUserDto): Promise<void> {
    const newUser = await this.userService.create(createUserDto, [RoleName.STUDENT]);
    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.userService.update(newUser.id, {
      status: UserStatus.PENDING_VERIFICATION,
      ...tokens,
    });
  }

  async logout(userId: string): Promise<void> {
    await this.userService.update(userId, {
      refreshToken: null,
    });
  }

  async refreshTokens(
    userId: string,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.getTokens(userId, email);
  }

  private async getTokens(
    userId: string,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('auth.accessTokenSecret'),
          expiresIn: this.configService.get<string>('auth.accessTokenExpires'),
        }
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('auth.refreshTokenSecret'),
          expiresIn: this.configService.get<string>('auth.refreshTokenExpires'),
        }
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(verificationToken: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: verificationToken },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    await this.userService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      status: UserStatus.ACTIVE,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const passwordResetToken = (await import('crypto')).randomBytes(32).toString('hex');
    await this.userService.update(user.id, {
      passwordResetToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });
  }

  async resetPassword(passwordResetToken: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired password reset token');
    }

    await this.userService.update(user.id, {
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      status: UserStatus.ACTIVE,
    });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    if (user.isEmailVerified) {
      throw new NotFoundException('Email is already verified');
    }

    const verificationToken = (await import('crypto')).randomBytes(32).toString('hex');
    await this.userService.update(user.id, {
      emailVerificationToken: verificationToken,
    });
  }
}

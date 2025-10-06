import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { AuthResponseDto, UserResponseDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email verification',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          $ref: '#/components/schemas/UserResponseDto',
        },
        message: {
          type: 'string',
          example: 'Registration successful. Please check your email to verify your account.',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'User with this email already exists',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiBody({ type: RegisterDto })
  async register(
    @Body() registerDto: RegisterDto
  ): Promise<{ user: UserResponseDto; message: string }> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @ApiBearerAuth()
  async refresh(@CurrentUser() user: CurrentUserData): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(user.id, user.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If the email exists, a password reset link has been sent.',
        },
      },
    },
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using token from email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password has been reset successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify user email using token from email',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email verified successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification token or email already verified',
  })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Resend email verification token to user',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Verification email has been sent',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Email is already verified',
  })
  async resendVerification(@Query('email') email: string): Promise<{ message: string }> {
    return this.authService.resendVerification(email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get current authenticated user information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  getProfile(@CurrentUser() user: CurrentUserData): UserResponseDto {
    return user as UserResponseDto;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user (client should discard tokens)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logout successful',
        },
      },
    },
  })
  @ApiBearerAuth()
  logout(): { message: string } {
    // In a more sophisticated implementation, you might want to:
    // 1. Add the token to a blacklist
    // 2. Invalidate the refresh token
    // 3. Log the logout event

    return { message: 'Logout successful' };
  }
}

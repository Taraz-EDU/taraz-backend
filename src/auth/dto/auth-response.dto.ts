import { ApiProperty } from '@nestjs/swagger';

import { UserStatus, RoleName } from '../../common/types/user.types';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    description: 'Whether email is verified',
    example: true,
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'User roles',
    type: [String],
    enum: RoleName,
    example: ['student', 'teacher'],
  })
  roles!: RoleName[];

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn!: number;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user!: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success!: boolean;
}

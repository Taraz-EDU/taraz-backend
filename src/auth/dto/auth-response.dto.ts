import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, type RoleName } from '@prisma/client';
import { type UserWithRoles } from 'src/common/types/user.types';

class UserAuthResponseDto {
  @ApiProperty({
    description: "The user's ID.",
    example: 'clx......',
  })
  id: string;

  @ApiProperty({
    description: "The user's email address.",
    example: 'email@example.com',
  })
  email: string;

  @ApiProperty({
    description: "The user's first name.",
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: "The user's last name.",
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: "The user's status.",
    example: UserStatus.ACTIVE,
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Whether the user has verified their email.',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: "The user's roles.",
    example: ['STUDENT'],
  })
  roles: RoleName[];

  constructor(user: UserWithRoles, roles: RoleName[]) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.status = user.status;
    this.isEmailVerified = user.isEmailVerified;
    this.roles = roles;
  }
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'The JWT access token.',
    example: 'ey...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'The JWT refresh token.',
    example: 'ey...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'The user information.',
    type: UserAuthResponseDto,
  })
  user: UserAuthResponseDto;

  constructor(user: UserWithRoles, accessToken: string, refreshToken: string) {
    const roles = user.userRoles?.map(userRole => userRole.role.name) ?? [];
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = new UserAuthResponseDto(user, roles);
  }
}

export class UserResponseDto {
  @ApiProperty({
    description: "The user's ID.",
    example: 'clx......',
  })
  id: string;

  @ApiProperty({
    description: "The user's email address.",
    example: 'email@example.com',
  })
  email: string;

  @ApiProperty({
    description: "The user's first name.",
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: "The user's last name.",
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: "The user's status.",
    example: UserStatus.ACTIVE,
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Whether the user has verified their email.',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: "The user's roles.",
    example: ['STUDENT'],
  })
  roles: RoleName[];

  constructor(user: UserWithRoles) {
    const roles = user.userRoles?.map(userRole => userRole.role.name) ?? [];
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.status = user.status;
    this.isEmailVerified = user.isEmailVerified;
    this.roles = roles;
  }
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

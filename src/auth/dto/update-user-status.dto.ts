import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'User status',
    example: UserStatus.ACTIVE,
    enum: UserStatus,
  })
  @IsEnum(UserStatus, { message: 'Invalid user status' })
  @IsNotEmpty({ message: 'Status is required' })
  status!: UserStatus;
}

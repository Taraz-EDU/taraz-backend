import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Array of role names to assign to the user',
    example: [RoleName.STUDENT],
    enum: RoleName,
    isArray: true,
  })
  @IsArray({ message: 'Roles must be an array' })
  @IsEnum(RoleName, { each: true, message: 'Each role must be a valid RoleName' })
  @IsNotEmpty({ message: 'Roles array cannot be empty' })
  roles!: RoleName[];
}

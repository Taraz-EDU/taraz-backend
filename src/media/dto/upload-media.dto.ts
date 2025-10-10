import { ApiPropertyOptional } from '@nestjs/swagger';
import type { EntityType } from '@prisma/client';
import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UploadMediaDto {
  @ApiPropertyOptional({
    description: 'Entity type this media belongs to',
    enum: ['USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER'],
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  entityType?: EntityType;

  @ApiPropertyOptional({
    description: 'Entity ID this media belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Description of the media',
    example: 'Profile picture for user',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Alt text for images (accessibility)',
    example: 'User profile picture showing a smiling person',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt?: string;

  @ApiPropertyOptional({
    description: 'Whether the media is publicly accessible',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

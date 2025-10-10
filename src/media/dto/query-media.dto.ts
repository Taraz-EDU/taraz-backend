import { ApiPropertyOptional } from '@nestjs/swagger';
import type { MediaType, MediaStatus, EntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';

export class QueryMediaDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by media type',
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER'],
    example: 'IMAGE',
  })
  @IsOptional()
  @IsString()
  @IsIn(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER'])
  type?: MediaType;

  @ApiPropertyOptional({
    description: 'Filter by media status',
    enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'],
    example: 'READY',
  })
  @IsOptional()
  @IsString()
  @IsIn(['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'])
  status?: MediaStatus;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: ['USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER'],
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  @IsIn(['USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER'])
  entityType?: EntityType;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'fileName', 'fileSize', 'type'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'fileName', 'fileSize', 'type'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MediaType, MediaStatus, EntityType } from '@prisma/client';

export class MediaResponseDto {
  @ApiProperty({
    description: 'Media ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'File name',
    example: 'avatar-123.jpg',
  })
  fileName!: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'my-profile-pic.jpg',
  })
  originalName!: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  fileSize!: number;

  @ApiProperty({
    description: 'Media type',
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER'],
    example: 'IMAGE',
  })
  type!: MediaType;

  @ApiProperty({
    description: 'Media status',
    enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'],
    example: 'READY',
  })
  status!: MediaStatus;

  @ApiProperty({
    description: 'S3 URL',
    example: 'https://tarazedu-media.s3.ap-southeast-1.amazonaws.com/users/123.jpg',
  })
  s3Url!: string;

  @ApiPropertyOptional({
    description: 'Entity type',
    enum: ['USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER'],
    example: 'USER',
  })
  entityType?: EntityType | null;

  @ApiPropertyOptional({
    description: 'Entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  entityId?: string | null;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Profile picture',
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Alt text for images',
    example: 'User profile picture',
  })
  alt?: string | null;

  @ApiPropertyOptional({
    description: 'Duration in seconds (for video/audio)',
    example: 120,
  })
  duration?: number | null;

  @ApiPropertyOptional({
    description: 'Width in pixels (for images/videos)',
    example: 1920,
  })
  width?: number | null;

  @ApiPropertyOptional({
    description: 'Height in pixels (for images/videos)',
    example: 1080,
  })
  height?: number | null;

  @ApiPropertyOptional({
    description: 'Thumbnail URL',
    example: 'https://tarazedu-media.s3.ap-southeast-1.amazonaws.com/thumbnails/123.jpg',
  })
  thumbnailUrl?: string | null;

  @ApiProperty({
    description: 'Whether the media is publicly accessible',
    example: false,
  })
  isPublic!: boolean;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

export class MediaListResponseDto {
  @ApiProperty({
    description: 'Array of media items',
    type: [MediaResponseDto],
  })
  data!: MediaResponseDto[];

  @ApiProperty({
    description: 'Total count of media items',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit!: number;
}

export class SignedUrlResponseDto {
  @ApiProperty({
    description: 'Signed URL for accessing the media',
    example:
      'https://tarazedu-media.s3.ap-southeast-1.amazonaws.com/users/123.jpg?X-Amz-Algorithm=...',
  })
  url!: string;

  @ApiProperty({
    description: 'Expiration time in seconds',
    example: 3600,
  })
  expiresIn!: number;
}

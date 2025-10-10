import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Media } from '@prisma/client';
import { MediaType, MediaStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import type { MediaListResponseDto } from '../dto/media-response.dto';
import type { QueryMediaDto } from '../dto/query-media.dto';
import type { UploadMediaDto } from '../dto/upload-media.dto';
import type { ValidatedFile, FileUploadResult } from '../types/media.types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZES } from '../types/media.types';

import { S3Service } from './s3.service';

import { PrismaService } from '@/common/services/prisma.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service
  ) {}

  /**
   * Upload media file
   * @param file - File to upload
   * @param uploadDto - Upload metadata
   * @param userId - User ID uploading the file
   * @param userIp - User IP address
   * @returns Created media record
   */
  async uploadMedia(
    file: Express.Multer.File,
    uploadDto: UploadMediaDto,
    userId: string,
    userIp?: string
  ): Promise<Media> {
    // Validate file
    const validatedFile = this.validateFile(file);

    try {
      // Generate folder path based on entity type
      const folder = this.s3Service.getFolderPath(uploadDto.entityType, uploadDto.entityId);

      // Generate unique filename
      const fileExtension = this.getFileExtension(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;

      // Upload to S3
      const uploadResult: FileUploadResult = await this.s3Service.uploadFile(file.buffer, {
        folder,
        fileName: uniqueFileName,
        contentType: file.mimetype,
        isPublic: uploadDto.isPublic ?? false,
        metadata: {
          uploadedBy: userId,
          originalName: file.originalname,
          entityType: uploadDto.entityType ?? 'OTHER',
          entityId: uploadDto.entityId ?? '',
        },
      });

      // Create media record
      const media = await this.prisma.media.create({
        data: {
          fileName: uniqueFileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          type: validatedFile.mediaType,
          status: MediaStatus.READY,
          s3Key: uploadResult.key,
          s3Bucket: uploadResult.bucket,
          s3Region: uploadResult.region,
          s3Url: uploadResult.url,
          entityType: uploadDto.entityType ?? null,
          entityId: uploadDto.entityId ?? null,
          description: uploadDto.description ?? null,
          alt: uploadDto.alt ?? null,
          uploadedById: userId,
          uploadedByIp: userIp ?? null,
          isPublic: uploadDto.isPublic ?? false,
        },
      });

      this.logger.log(`Media uploaded successfully: ${media.id}`, {
        mediaId: media.id,
        userId,
        fileName: uniqueFileName,
      });

      return media;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to upload media: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get media by ID
   * @param id - Media ID
   * @param userId - User requesting the media (for access control)
   * @returns Media record
   */
  async getMediaById(id: string, userId?: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({
      where: { id, deletedAt: null },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check access permissions
    if (!media.isPublic && userId !== media.uploadedById) {
      throw new ForbiddenException('Access denied to this media');
    }

    return media;
  }

  /**
   * Get media list with filtering and pagination
   * @param query - Query parameters
   * @param userId - User requesting the list (for access control)
   * @returns Paginated media list
   */
  async getMediaList(query: QueryMediaDto, userId?: string): Promise<MediaListResponseDto> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      deletedAt: null,
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(userId
        ? {
            OR: [{ uploadedById: userId }, { isPublic: true }],
          }
        : { isPublic: true }),
    };

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() as 'asc' | 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Delete media
   * @param id - Media ID
   * @param userId - User requesting deletion (for access control)
   */
  async deleteMedia(id: string, userId: string): Promise<void> {
    const media = await this.prisma.media.findUnique({
      where: { id, deletedAt: null },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Check if user owns the media
    if (media.uploadedById !== userId) {
      throw new ForbiddenException('You can only delete your own media');
    }

    try {
      // Delete from S3
      await this.s3Service.deleteFile(media.s3Key);

      // Soft delete in database
      await this.prisma.media.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: MediaStatus.DELETED,
        },
      });

      this.logger.log(`Media deleted successfully: ${id}`, {
        mediaId: id,
        userId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Failed to delete media: ${errorMessage}`, {
        error: errorMessage,
        mediaId: id,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get signed URL for accessing private media
   * @param id - Media ID
   * @param userId - User requesting the URL (for access control)
   * @param expiresIn - URL expiration time in seconds
   * @returns Signed URL
   */
  async getSignedUrl(id: string, userId: string, expiresIn = 3600): Promise<string> {
    const media = await this.getMediaById(id, userId);

    if (media.isPublic) {
      return media.s3Url;
    }

    return this.s3Service.getSignedUrl(media.s3Key, expiresIn);
  }

  /**
   * Validate uploaded file
   * @param file - File to validate
   * @returns Validated file info
   */
  private validateFile(file: Express.Multer.File): ValidatedFile {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Determine media type
    const mediaType = this.getMediaType(file.mimetype);

    // Validate MIME type
    if (!this.isAllowedMimeType(file.mimetype, mediaType)) {
      const allowedTypesMap: Record<MediaType, readonly string[]> = ALLOWED_MIME_TYPES;
      const allowedTypes = allowedTypesMap[mediaType] || [];
      throw new BadRequestException(
        `File type not allowed. Allowed types for ${mediaType}: ${allowedTypes.join(', ')}`
      );
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[mediaType];
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB for ${mediaType}`
      );
    }

    return {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      mediaType,
    };
  }

  /**
   * Get media type from MIME type
   * @param mimeType - MIME type
   * @returns Media type
   */
  private getMediaType(mimeType: string): MediaType {
    if (this.isMimeTypeInCategory(mimeType, ALLOWED_MIME_TYPES.IMAGE)) {
      return MediaType.IMAGE;
    }
    if (this.isMimeTypeInCategory(mimeType, ALLOWED_MIME_TYPES.VIDEO)) {
      return MediaType.VIDEO;
    }
    if (this.isMimeTypeInCategory(mimeType, ALLOWED_MIME_TYPES.DOCUMENT)) {
      return MediaType.DOCUMENT;
    }
    if (this.isMimeTypeInCategory(mimeType, ALLOWED_MIME_TYPES.AUDIO)) {
      return MediaType.AUDIO;
    }
    return MediaType.OTHER;
  }

  /**
   * Check if MIME type is in category
   * @param mimeType - MIME type to check
   * @param category - Category array to check against
   * @returns True if MIME type is in category
   */
  private isMimeTypeInCategory(mimeType: string, category: readonly string[]): boolean {
    return category.includes(mimeType);
  }

  /**
   * Check if MIME type is allowed for media type
   * @param mimeType - MIME type to check
   * @param mediaType - Media type
   * @returns True if allowed
   */
  private isAllowedMimeType(mimeType: string, mediaType: MediaType): boolean {
    const allowedTypesMap: Record<MediaType, readonly string[]> = ALLOWED_MIME_TYPES;
    const allowedList = allowedTypesMap[mediaType];
    return allowedList ? allowedList.includes(mimeType) : false;
  }

  /**
   * Get file extension from filename
   * @param filename - File name
   * @returns File extension
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }
}

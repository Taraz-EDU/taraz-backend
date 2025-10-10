import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import type { FileUploadResult, S3UploadOptions } from '../types/media.types';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client?: S3Client;
  private readonly bucket?: string;
  private readonly region?: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('AWS_ACCESS_SECRET');

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'S3 configuration is missing. Media upload features will not be available. Please configure AWS credentials in environment variables.'
      );
      this.isConfigured = false;
      return;
    }

    this.bucket = bucket;
    this.region = region;
    this.isConfigured = true;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`S3Service initialized with bucket: ${this.bucket}, region: ${this.region}`);
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.s3Client || !this.bucket || !this.region) {
      throw new InternalServerErrorException(
        'S3 is not configured. Please check your environment variables.'
      );
    }
  }

  /**
   * Upload a file to S3
   * @param buffer - File buffer
   * @param options - Upload options
   * @returns Upload result with S3 details
   */
  async uploadFile(buffer: Buffer, options: S3UploadOptions): Promise<FileUploadResult> {
    this.ensureConfigured();

    if (!this.s3Client || !this.bucket || !this.region) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    try {
      const fileName = options.fileName ?? `${uuidv4()}`;
      const key = `${options.folder}/${fileName}`;

      this.logger.log(`Uploading file to S3: ${key}`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
        ACL: options.isPublic ? 'public-read' : 'private',
        Metadata: options.metadata,
        ServerSideEncryption: 'AES256',
      });

      const result = await this.s3Client.send(command);

      const url = options.isPublic
        ? `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
        : await this.getSignedUrl(key, 3600); // 1 hour for private files

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        bucket: this.bucket,
        region: this.region,
        url,
        etag: result.ETag ?? '',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to upload file to S3: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        folder: options.folder,
      });
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key
   */
  async deleteFile(key: string): Promise<void> {
    this.ensureConfigured();

    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    try {
      this.logger.log(`Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to delete file from S3: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        key,
      });
      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }

  /**
   * Generate a signed URL for accessing a private file
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    this.ensureConfigured();

    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    try {
      this.logger.debug(`Generating signed URL for: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to generate signed URL: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        key,
      });
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - S3 object key
   * @returns True if file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    this.ensureConfigured();

    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        return false;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Error checking file existence: ${errorMessage}`, {
        error: errorMessage,
        key,
      });
      throw new InternalServerErrorException('Failed to check file existence');
    }
  }

  /**
   * Copy a file within S3
   * @param sourceKey - Source object key
   * @param destinationKey - Destination object key
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    this.ensureConfigured();

    if (!this.s3Client || !this.bucket) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    try {
      this.logger.log(`Copying file in S3: ${sourceKey} -> ${destinationKey}`);

      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        Key: destinationKey,
        CopySource: `${this.bucket}/${sourceKey}`,
      });

      await this.s3Client.send(command);

      this.logger.log(`File copied successfully: ${destinationKey}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to copy file in S3: ${errorMessage}`, {
        error: errorMessage,
        stack: errorStack,
        sourceKey,
        destinationKey,
      });
      throw new InternalServerErrorException('Failed to copy file in S3');
    }
  }

  /**
   * Get the public URL for a file
   * @param key - S3 object key
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    this.ensureConfigured();

    if (!this.bucket || !this.region) {
      throw new InternalServerErrorException('S3 client not initialized');
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Get S3 folder structure based on entity type
   * @param entityType - Entity type
   * @param entityId - Entity ID (optional)
   * @returns Folder path
   */
  getFolderPath(entityType?: string, entityId?: string): string {
    if (!entityType) {
      return 'general';
    }

    const baseFolder = entityType.toLowerCase();
    return entityId ? `${baseFolder}/${entityId}` : baseFolder;
  }
}

import type { MediaType } from '@prisma/client';

export interface FileUploadResult {
  key: string;
  bucket: string;
  region: string;
  url: string;
  etag: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface ValidatedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  mediaType: MediaType;
}

export interface S3UploadOptions {
  folder: string;
  fileName?: string;
  contentType: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'],
  OTHER: ['application/octet-stream', 'application/zip', 'application/x-rar-compressed'],
} as const;

export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  AUDIO: 50 * 1024 * 1024, // 50MB
  OTHER: 10 * 1024 * 1024, // 10MB
} as const;

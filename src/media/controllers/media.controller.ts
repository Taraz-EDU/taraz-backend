import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';

import {
  MediaResponseDto,
  MediaListResponseDto,
  SignedUrlResponseDto,
} from '../dto/media-response.dto';
import type { QueryMediaDto } from '../dto/query-media.dto';
import type { UploadMediaDto } from '../dto/upload-media.dto';
import { MediaService } from '../services/media.service';

import { Public } from '@/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('Media')
@Controller('api/v1/media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload media file',
    description: 'Upload a media file to S3 with metadata',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        entityType: {
          type: 'string',
          enum: ['USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER'],
          description: 'Entity type this media belongs to',
        },
        entityId: {
          type: 'string',
          description: 'Entity ID this media belongs to',
        },
        description: {
          type: 'string',
          description: 'Description of the media',
        },
        alt: {
          type: 'string',
          description: 'Alt text for images (accessibility)',
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the media is publicly accessible',
          default: false,
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully',
    type: MediaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadMediaDto,
    @Req() req: Request & { user: { id: string } }
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user.id;
    const userIp = req.ip;

    return this.mediaService.uploadMedia(file, uploadDto, userId, userIp);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get media list',
    description: 'Get paginated list of media with optional filtering',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'],
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    enum: ['USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER'],
  })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'fileName', 'fileSize', 'type'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: 'Media list retrieved successfully',
    type: MediaListResponseDto,
  })
  async getMediaList(
    @Query() query: QueryMediaDto,
    @Req() req: Request & { user?: { id: string } }
  ): Promise<MediaListResponseDto> {
    const userId = req.user?.id;
    return this.mediaService.getMediaList(query, userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get media by ID',
    description: 'Get a specific media by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Media ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Media found',
    type: MediaResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async getMediaById(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id: string } }
  ): Promise<MediaResponseDto> {
    const userId = req.user?.id;
    return this.mediaService.getMediaById(id, userId);
  }

  @Get(':id/signed-url')
  @ApiOperation({
    summary: 'Get signed URL for media',
    description: 'Get a signed URL for accessing private media',
  })
  @ApiParam({
    name: 'id',
    description: 'Media ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    example: 3600,
    description: 'URL expiration time in seconds',
  })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated successfully',
    type: SignedUrlResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn = 3600,
    @Req() req: Request & { user: { id: string } }
  ): Promise<SignedUrlResponseDto> {
    const userId = req.user.id;
    const url = await this.mediaService.getSignedUrl(id, userId, expiresIn);

    return {
      url,
      expiresIn,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete media',
    description: 'Delete a media file (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'Media ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Media deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - you can only delete your own media',
  })
  async deleteMedia(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } }
  ): Promise<void> {
    const userId = req.user.id;
    await this.mediaService.deleteMedia(id, userId);
  }
}

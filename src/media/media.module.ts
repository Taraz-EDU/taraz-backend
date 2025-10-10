import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { S3Service } from './services/s3.service';

import { PrismaService } from '@/common/services/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [MediaService, S3Service, PrismaService],
  exports: [MediaService, S3Service],
})
export class MediaModule {}

import { Module } from '@nestjs/common';

import { ContactController } from './controllers/contact.controller';
import { ContactService } from './services/contact.service';

import { EmailService } from '@/common/services/email.service';
import { PrismaService } from '@/common/services/prisma.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, PrismaService, EmailService],
  exports: [ContactService],
})
export class ContactModule {}

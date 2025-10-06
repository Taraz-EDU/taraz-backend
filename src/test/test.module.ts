import { Module } from '@nestjs/common';

import { PrismaService } from '../common/services/prisma.service';

import { TestController } from './test.controller';

@Module({
  controllers: [TestController],
  providers: [PrismaService],
})
export class TestModule {}

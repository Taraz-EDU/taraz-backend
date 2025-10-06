import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error(
        'Failed to connect to database',
        error instanceof Error ? error.message : String(error)
      );
      // Log DATABASE_URL presence (not the actual value for security)
      const hasDbUrl = !!process.env['DATABASE_URL'];
      this.logger.error(`DATABASE_URL is ${hasDbUrl ? 'set' : 'NOT SET'}`);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Disconnecting from database...');
      await this.$disconnect();
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      this.logger.error(
        'Error during database disconnect',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

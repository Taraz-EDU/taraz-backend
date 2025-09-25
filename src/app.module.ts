import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [HealthModule, TestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

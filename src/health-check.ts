import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(3030);
}

// Health check for Docker
if (require.main === module) {
  void bootstrap();
}

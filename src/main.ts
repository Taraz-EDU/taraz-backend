import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3030',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Taraz Backend API')
    .setDescription('The Taraz Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('admin', 'Admin endpoints')
    .addTag('student', 'Student endpoints')
    .addTag('test', 'Test endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    jsonDocumentUrl: 'api.json',
  });

  const port = process.env['PORT'] ?? 3030;
  const host = process.env['HOST'] ?? '0.0.0.0';

  await app.listen(port, host);

  // Application startup logging
  // eslint-disable-next-line no-console
  console.log(`🚀 Application is running on: http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger documentation: http://${host}:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`📄 Swagger JSON: http://${host}:${port}/api.json`);
  // eslint-disable-next-line no-console
  console.log(`💚 Health check: http://${host}:${port}/health`);
}
void bootstrap();

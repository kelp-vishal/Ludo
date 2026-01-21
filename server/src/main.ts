
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Setting global prefix to all routes
  // app.setGlobalPrefix('api');

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'https://f1vbcpxc-4200.inc1.devtunnels.ms'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger doc
  const config = new DocumentBuilder()
    .setTitle('Ludo Game API')
    .setDescription('API documentation for Ludo Game')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('rooms', 'Game rooms management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3002);
  logger.log(`Application is running on: http://localhost:3002`);
  logger.log(`Swagger documentation available at: http://localhost:3002/api/docs`);
}
bootstrap();





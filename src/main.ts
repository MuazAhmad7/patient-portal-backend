import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.enableCors({
    origin: configService.get('security.corsOrigin') || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe - relaxed for debugging
  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,  // Allow extra properties
    forbidNonWhitelisted: false,  // Don't throw on extra properties
    transform: true,
  }));

  // API documentation with Swagger
  const config = new DocumentBuilder()
    .setTitle('Patient Portal API')
    .setDescription('Healthcare patient portal backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('patients', 'Patient management operations')
    .addTag('appointments', 'Appointment management operations')
    .addTag('medical-records', 'Medical records management')
    .addTag('prescriptions', 'Prescription management')
    .addTag('ai-agents', 'AI agent integration')
    .addTag('insurance', 'Insurance info and AI advice')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const port = configService.get('port');
  await app.listen(port);
  
  console.log(`🚀 Patient Portal Backend running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();

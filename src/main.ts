import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS
  app.enableCors({
    origin: configService.get('cors.origin') || process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Serve static files
  const uploadPath = configService.get('uploadPath') || './public/uploads';
  const absoluteUploadPath = join(__dirname, '..', 'public', 'uploads');
  
  // Ensure upload directories exist
  const fs = require('fs');
  const uploadDirs = [
    absoluteUploadPath,
    join(absoluteUploadPath, 'customers'),
    join(absoluteUploadPath, 'motorcycles')
  ];

  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }

  // Serve static files with security options
  app.use('/uploads', express.static(absoluteUploadPath, {
    index: false, // Disable directory listing
    maxAge: '1d', // Cache files for 1 day
    setHeaders: (res, path) => {
      res.set('X-Content-Type-Options', 'nosniff'); // Prevent MIME-type sniffing
      res.set('Access-Control-Allow-Origin', configService.get('cors.origin')); // CORS for files
    }
  }));
  
  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  if (configService.get('swagger.enabled')) {
    const config = new DocumentBuilder()
      .setTitle('Motorcycle Management API')
      .setDescription('Sistema completo de gestión de motocicletas con análisis y seguimiento')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Application', 'Endpoints principales de la aplicación')
      .addTag('Auth', 'Autenticación y autorización')
      .addTag('Motorcycles', 'Gestión de motocicletas')
      .addTag('Categories', 'Categorías de motocicletas')
      .addTag('Inventory', 'Control de inventario')
      .addTag('Customers', 'Gestión de clientes')
      .addTag('Sales', 'Ventas y seguimiento de pedidos')
      .addTag('Invoices', 'Facturación')
      .addTag('Cart', 'Carrito de compras')
      .addTag('Uploads', 'Sistema de archivos')
      .addTag('Analytics', 'Análisis y reportes')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log('📚 Swagger documentation available at: /api/docs');
  }

  const port = configService.get('port') || process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

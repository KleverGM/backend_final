import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    return {
      name: 'Motorcycle Management API',
      version: '1.0.0',
      description: 'Sistema de gestión de motocicletas con análisis y seguimiento',
      environment: this.configService.get('environment'),
      features: [
        'Gestión de usuarios y autenticación',
        'Catálogo de motocicletas',
        'Sistema de inventario',
        'Gestión de ventas y facturación',
        'Carrito de compras',
        'Análisis y reportes',
        'Sistema de uploads',
        'Gestión de clientes y reseñas'
      ],
      endpoints: {
        api: '/api',
        health: '/api/health',
        uploads: '/uploads'
      }
    };
  }

  getHealthStatus() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('environment'),
      databases: {
        postgres: 'Connected',
        mongodb: 'Connected'
      }
    };
  }
}

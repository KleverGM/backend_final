import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { MotorcyclesModule } from './motorcycles/motorcycles.module';
import { CategoriesModule } from './categories/categories.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CommonModule } from './common/common.module';
import { MongodbModule } from './mongodb/mongodb.module';
import { CartModule } from './cart/cart.module';
import { UploadModule } from './upload/upload.module';
import { ImagesModule } from './images/images.module';
import { AnalyticsModule } from './analytics/analytics.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // PostgreSQL with TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.postgres.host'),
        port: configService.get('database.postgres.port'),
        username: configService.get('database.postgres.username'),
        password: configService.get('database.postgres.password'),
        database: configService.get('database.postgres.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('environment') === 'development',
        logging: configService.get('environment') === 'development',
        ssl: {
          rejectUnauthorized: false,
          sslmode: 'require',
        },
      }),
      inject: [ConfigService],
    }),
    
    // MongoDB with Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('database.mongodb.uri'),
      }),
      inject: [ConfigService],
    }),
    
    // Application modules
    CommonModule,
    AuthModule,
    CustomersModule,
    MotorcyclesModule,
    CategoriesModule,
    InventoryModule,
    SalesModule,
    InvoicesModule,
    CartModule,
    UploadModule,
    ImagesModule,
    MongodbModule,
    AnalyticsModule, // Módulo unificado de analíticas que incluye funcionalidad de MongoDB
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

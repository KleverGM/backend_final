import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { OrderTrackingService } from './services/order-tracking.service';
import { OrderTrackingController } from './controllers/order-tracking.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Customer, Motorcycle])],
  controllers: [SalesController, OrderTrackingController],
  providers: [SalesService, OrderTrackingService],
  exports: [SalesService, OrderTrackingService],
})
export class SalesModule {}

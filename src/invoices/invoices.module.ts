import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from './entities/invoice.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceItemsController } from './invoice-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, Motorcycle])],
  providers: [InvoicesService],
  controllers: [InvoicesController, InvoiceItemsController],
  exports: [InvoicesService]
})
export class InvoicesModule {}

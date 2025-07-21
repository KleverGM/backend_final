import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { UnifiedAnalyticsService } from './unified-analytics.service';
import { SalesModule } from '../sales/sales.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { SalesAnalytics, SalesAnalyticsSchema } from '../mongodb/analytics/sales-analytics.schema';
import { InventoryAnalytics, InventoryAnalyticsSchema } from '../mongodb/analytics/inventory-analytics.schema';
import { CustomerAnalytics, CustomerAnalyticsSchema } from '../mongodb/analytics/customer-analytics.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesAnalytics.name, schema: SalesAnalyticsSchema },
      { name: InventoryAnalytics.name, schema: InventoryAnalyticsSchema },
      { name: CustomerAnalytics.name, schema: CustomerAnalyticsSchema },
    ]),
    SalesModule,
    InventoryModule,
    CustomersModule,
  ],
  controllers: [AnalyticsController],
  providers: [UnifiedAnalyticsService],
  exports: [UnifiedAnalyticsService],
})
export class AnalyticsModule {}

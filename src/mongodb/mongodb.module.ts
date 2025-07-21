import { Module } from '@nestjs/common';
import { CustomerAnalytics, CustomerAnalyticsSchema } from './analytics/customer-analytics.schema';
import { InventoryAnalytics, InventoryAnalyticsSchema } from './analytics/inventory-analytics.schema';
import { SalesAnalytics, SalesAnalyticsSchema } from './analytics/sales-analytics.schema';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas - Solo las que pertenecen exclusivamente a MongoDB
import { PriceHistory, PriceHistorySchema } from './price-history/price-history.schema';
import { ActivityLog, ActivityLogSchema } from './logs/activity-log.schema';

// Services
import { PriceHistoryService } from './service/price-history.service';
import { ActivityLogService } from './service/activity-log.service';
import { InventoryAnalyticsService } from './service/inventory-analytics.service';
import { SalesAnalyticsService } from './service/sales-analytics.service';
import { CustomerAnalyticsService } from './service/customer-analytics.service';

// Controllers
import { PriceHistoryController } from './controllers/price-history.controller';
import { ActivityLogController } from './controllers/activity-log.controller';
import { SalesAnalyticsController } from './controllers/sales-analytics.controller';
import { InventoryAnalyticsController } from './controllers/inventory-analytics.controller';
import { CustomerAnalyticsController } from './controllers/customer-analytics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceHistory.name, schema: PriceHistorySchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: CustomerAnalytics.name, schema: CustomerAnalyticsSchema },
      { name: InventoryAnalytics.name, schema: InventoryAnalyticsSchema },
      { name: SalesAnalytics.name, schema: SalesAnalyticsSchema },
    ]),
  ],
  controllers: [
    PriceHistoryController,
    ActivityLogController,
    SalesAnalyticsController,
    InventoryAnalyticsController,
    CustomerAnalyticsController,
  ],
  providers: [
    PriceHistoryService,
    ActivityLogService,
    InventoryAnalyticsService,
    SalesAnalyticsService,
    CustomerAnalyticsService,
  ],
  exports: [
    PriceHistoryService,
    ActivityLogService,
    InventoryAnalyticsService,
    SalesAnalyticsService,
    CustomerAnalyticsService,
  ],
})
export class MongodbModule {}

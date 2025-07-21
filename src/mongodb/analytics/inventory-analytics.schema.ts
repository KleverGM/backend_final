import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryAnalyticsDocument = InventoryAnalytics & Document;

@Schema({ timestamps: true })
export class InventoryAnalytics {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  period: string; // 'daily', 'weekly', 'monthly'

  @Prop({ required: true })
  totalItems: number;

  @Prop({ required: true })
  totalValue: number;

  @Prop({ required: true })
  lowStockItems: number;

  @Prop({ required: true })
  outOfStockItems: number;

  @Prop({ required: true })
  averageStockLevel: number;

  @Prop({ required: true })
  turnoverRate: number;

  @Prop({ required: true })
  stockMovements: Array<{
    motorcycleId: string;
    brand: string;
    model: string;
    movement: string; // 'in', 'out', 'reserved', 'released'
    quantity: number;
    timestamp: Date;
    reason: string;
  }>;

  @Prop({ required: true })
  topSellingItems: Array<{
    motorcycleId: string;
    brand: string;
    model: string;
    unitsSold: number;
    revenue: number;
    stockLevel: number;
  }>;

  @Prop({ required: true })
  slowMovingItems: Array<{
    motorcycleId: string;
    brand: string;
    model: string;
    daysInStock: number;
    currentStock: number;
    lastSaleDate: Date;
  }>;

  @Prop({ type: [Object] })
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    itemCount: number;
    totalValue: number;
    averageTurnover: number;
  }>;

  @Prop({ type: [Object] })
  supplierMetrics: Array<{
    supplier: string;
    itemCount: number;
    totalValue: number;
    averageLeadTime: number;
    reliabilityScore: number;
  }>;
}

export const InventoryAnalyticsSchema = SchemaFactory.createForClass(InventoryAnalytics);

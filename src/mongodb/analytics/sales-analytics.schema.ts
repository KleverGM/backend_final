import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SalesAnalyticsDocument = SalesAnalytics & Document;

@Schema({ timestamps: true })
export class SalesAnalytics {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  period: string; // 'daily', 'weekly', 'monthly', 'yearly'

  @Prop({ required: true, type: Number })
  totalSales: number;

  @Prop({ required: true, type: Number })
  totalRevenue: number;

  @Prop({ required: true, type: Number })
  totalProfit: number;

  @Prop({ required: true })
  topSellingBrands: Array<{
    brand: string;
    units: number;
    revenue: number;
  }>;

  @Prop({ required: true })
  topSellingModels: Array<{
    brand: string;
    model: string;
    units: number;
    revenue: number;
  }>;

  @Prop({ required: true })
  salesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    units: number;
    revenue: number;
  }>;

  @Prop({ required: true })
  salesByMonth: Array<{
    month: number;
    year: number;
    units: number;
    revenue: number;
  }>;

  @Prop()
  averageOrderValue: number;

  @Prop()
  conversionRate: number;

  @Prop({ type: Object })
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    totalCustomers: number;
  };
}

export const SalesAnalyticsSchema = SchemaFactory.createForClass(SalesAnalytics);

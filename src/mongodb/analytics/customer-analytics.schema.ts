import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerAnalyticsDocument = CustomerAnalytics & Document;

@Schema({ timestamps: true })
export class CustomerAnalytics {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  period: string; // 'daily', 'weekly', 'monthly', 'yearly'

  @Prop({ required: true })
  totalCustomers: number;

  @Prop({ required: true })
  newCustomers: number;

  @Prop({ required: true })
  activeCustomers: number;

  @Prop({ required: true })
  returningCustomers: number;

  @Prop({ required: true })
  averageCustomerValue: number;

  @Prop({ required: true })
  customerLifetimeValue: number;

  @Prop({ required: true })
  customerRetentionRate: number;

  @Prop({ required: true })
  customerAcquisitionCost: number;

  @Prop({ required: true })
  topCustomers: Array<{
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalPurchases: number;
    totalValue: number;
    lastPurchaseDate: Date;
    loyaltyScore: number;
  }>;

  @Prop({ required: true })
  customerSegments: Array<{
    segment: string; // 'high_value', 'regular', 'occasional', 'new'
    count: number;
    averageValue: number;
    totalRevenue: number;
  }>;

  @Prop({ required: true })
  geographicDistribution: Array<{
    state: string;
    city: string;
    customerCount: number;
    totalRevenue: number;
  }>;

  @Prop({ required: true })
  ageDistribution: Array<{
    ageGroup: string; // '18-25', '26-35', '36-45', '46-55', '55+'
    count: number;
    averageSpend: number;
  }>;

  @Prop({ type: Object })
  behaviorMetrics: {
    averageTimeBetweenPurchases: number;
    mostPreferredBrands: Array<{
      brand: string;
      customerCount: number;
      preference: number;
    }>;
    purchasePatterns: Array<{
      pattern: string;
      frequency: number;
    }>;
  };
}

export const CustomerAnalyticsSchema = SchemaFactory.createForClass(CustomerAnalytics);

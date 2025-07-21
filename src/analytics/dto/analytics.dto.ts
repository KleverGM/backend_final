import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum AnalyticsType {
  SALES = 'sales',
  INVENTORY = 'inventory',
  CUSTOMER = 'customer',
}

export class AnalyticsQueryDto {
  @ApiProperty({ enum: AnalyticsPeriod, description: 'Período de análisis' })
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod;

  @ApiPropertyOptional({ description: 'Fecha de inicio para el análisis (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin para el análisis (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría para filtrar análisis' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Marca de motocicleta para filtrar análisis' })
  @IsString()
  @IsOptional()
  brand?: string;
}

export class SalesAnalyticsDto {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  period: string;
  date: Date;
  
  topSellingBrands: Array<{
    brand: string;
    units: number;
    revenue: number;
  }>;
  
  topSellingModels: Array<{
    brand: string;
    model: string;
    units: number;
    revenue: number;
  }>;
  
  salesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    units: number;
    revenue: number;
  }>;
  
  salesByMonth: Array<{
    month: number;
    year: number;
    units: number;
    revenue: number;
  }>;
  
  averageOrderValue: number;
  conversionRate: number;
  
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    totalCustomers: number;
  };
}

export class InventoryAnalyticsDto {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockLevel: number;
  turnoverRate: number;
  period: string;
  date: Date;
  
  stockMovements: Array<{
    motorcycleId: string;
    brand: string;
    model: string;
    movement: string;
    quantity: number;
    timestamp: Date;
    reason: string;
  }>;
  
  topSellingItems: Array<{
    motorcycleId: string;
    brand: string;
    model: string;
    unitsSold: number;
    revenue: number;
    stockLevel: number;
  }>;
  
  slowMovingItems: Array<{
    motorcycleId: string;
    brand: string;
    model: string;
    daysInStock: number;
    currentStock: number;
    lastSaleDate: Date;
  }>;
  
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    itemCount: number;
    totalValue: number;
    averageTurnover: number;
  }>;
}

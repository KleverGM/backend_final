import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesAnalytics, SalesAnalyticsDocument } from '../mongodb/analytics/sales-analytics.schema';
import { InventoryAnalytics, InventoryAnalyticsDocument } from '../mongodb/analytics/inventory-analytics.schema';
import { CustomerAnalytics, CustomerAnalyticsDocument } from '../mongodb/analytics/customer-analytics.schema';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { AnalyticsPeriod, AnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class UnifiedAnalyticsService {
  private readonly logger = new Logger(UnifiedAnalyticsService.name);

  constructor(
    @InjectModel(SalesAnalytics.name)
    private salesAnalyticsModel: Model<SalesAnalyticsDocument>,
    @InjectModel(InventoryAnalytics.name)
    private inventoryAnalyticsModel: Model<InventoryAnalyticsDocument>,
    @InjectModel(CustomerAnalytics.name)
    private customerAnalyticsModel: Model<CustomerAnalyticsDocument>,
    private readonly salesService: SalesService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
  ) {}

  // --- Métodos de servicio original de analytics ---

  getDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date; period: string } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    let startDate = query.startDate ? new Date(query.startDate) : new Date();
    let period = query.period || AnalyticsPeriod.MONTHLY;

    if (!query.startDate) {
      // Si no se proporciona fecha de inicio, calcular según el período
      switch (period) {
        case AnalyticsPeriod.DAILY:
          startDate.setDate(endDate.getDate() - 1);
          break;
        case AnalyticsPeriod.WEEKLY:
          startDate.setDate(endDate.getDate() - 7);
          break;
        case AnalyticsPeriod.MONTHLY:
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case AnalyticsPeriod.QUARTERLY:
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case AnalyticsPeriod.YEARLY:
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30); // Default: últimos 30 días
      }
    }

    return { startDate, endDate, period };
  }

  async getSalesAnalytics(query: AnalyticsQueryDto, sellerId?: string): Promise<any> {
    // Determinar las fechas para el análisis
    const { startDate, endDate, period } = this.getDateRange(query);

    // Filtros adicionales
    let filter: any = {
      period: query.period,
      date: { $gte: startDate, $lte: endDate }
    };

    // Si es un vendedor, filtrar por ventas del vendedor
    if (sellerId) {
      // Para vendedores, necesitamos generar análisis específicos
      // basados en sus propias ventas
      const sellerSales = await this.salesService.findAll({
        sellerId,
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString()
      });

      // Generar análisis en tiempo real para el vendedor
      return this.generateSellerSalesAnalytics(sellerSales, query.period, startDate, endDate);
    }

    // Para administradores, usar los datos pre-calculados en MongoDB
    const analytics = await this.salesAnalyticsModel.findOne(filter)
      .sort({ date: -1 })
      .lean()
      .exec();

    if (!analytics) {
      // Si no hay datos pre-calculados, generarlos en tiempo real
      const sales = await this.salesService.findAll({
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString()
      });
      
      return this.generateSalesAnalytics(sales, query.period, startDate, endDate);
    }

    return analytics;
  }

  async getInventoryAnalytics(query: AnalyticsQueryDto): Promise<any> {
    // Determinar las fechas para el análisis
    const { startDate, endDate, period } = this.getDateRange(query);

    // Filtros adicionales
    let filter: any = {
      period: query.period,
      date: { $gte: startDate, $lte: endDate }
    };

    // Buscar en MongoDB los análisis pre-calculados
    const analytics = await this.inventoryAnalyticsModel.findOne(filter)
      .sort({ date: -1 })
      .lean()
      .exec();

    if (!analytics) {
      // Si no hay datos pre-calculados, generarlos en tiempo real
      const inventory = await this.inventoryService.findAll({});
      return this.generateInventoryAnalytics(inventory, query.period, startDate, endDate);
    }

    return analytics;
  }

  async getSellerDashboardData(sellerId: string): Promise<any> {
    // Obtener fecha actual y hace 30 días
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Obtener ventas del vendedor
    const sales = await this.salesService.findAll({
      sellerId,
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString()
    });

    // Generar métricas para el dashboard
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    // Para el profit necesitaríamos el costo, que no está disponible directamente. Usaremos una estimación.
    const totalProfit = sales.reduce((sum, sale) => {
      // Estimación de profit como 20% del total si no tenemos el costo real
      return sum + (sale.totalAmount * 0.2);
    }, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Top productos vendidos
    const productMap = new Map();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.motorcycleId;
        if (productMap.has(key)) {
          productMap.set(key, {
            ...productMap.get(key),
            quantity: productMap.get(key).quantity + item.quantity,
            revenue: productMap.get(key).revenue + (item.unitPrice * item.quantity)
          });
        } else {
          productMap.set(key, {
            motorcycleId: item.motorcycleId,
            // No tenemos acceso directo al nombre, usaremos el ID
            name: `Producto ${item.motorcycleId.substring(0, 8)}...`,
            quantity: item.quantity,
            revenue: item.unitPrice * item.quantity
          });
        }
      });
    });
    
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Agrupar ventas por fecha para gráfico
    const salesByDate = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          count: 0,
          revenue: 0
        };
      }
      salesByDate[date].count++;
      salesByDate[date].revenue += sale.totalAmount;
    });

    return {
      summary: {
        totalSales,
        totalRevenue,
        totalProfit,
        averageOrderValue,
        conversionRate: 0, // Se necesitaría información adicional para calcular
      },
      topProducts,
      salesTrend: Object.values(salesByDate)
    };
  }

  private generateSalesAnalytics(sales: any[], period: string, startDate: Date, endDate: Date): any {
    // Lógica para generar análisis en tiempo real a partir de las ventas
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    // Estimación de profit como 20% del total si no tenemos el costo real
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.totalAmount * 0.2), 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Tendencia de ventas por periodo
    const salesTrend = this.generateSalesTrend(sales, period, startDate, endDate);
    
    // Ventas por categoría
    const salesByCategory = this.generateSalesByCategory(sales);
    
    return {
      period,
      date: new Date(),
      totalSales,
      totalRevenue,
      totalProfit,
      averageOrderValue,
      salesTrend,
      salesByCategory,
    };
  }

  private generateSellerSalesAnalytics(sales: any[], period: string, startDate: Date, endDate: Date): any {
    // Similar a generateSalesAnalytics pero específico para vendedores
    // Podría tener métricas adicionales relevantes para los vendedores
    return this.generateSalesAnalytics(sales, period, startDate, endDate);
  }

  private generateInventoryAnalytics(inventory: any[], period: string, startDate: Date, endDate: Date): any {
    // Lógica para generar análisis en tiempo real del inventario
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity < item.minStock).length;
    
    // Inventario por categoría
    const inventoryByCategory = this.generateInventoryByCategory(inventory);
    
    return {
      period,
      date: new Date(),
      totalItems,
      totalValue,
      totalQuantity,
      lowStockItems,
      inventoryByCategory,
    };
  }

  private generateSalesTrend(sales: any[], period: string, startDate: Date, endDate: Date): any[] {
    // Implementación de tendencia de ventas
    // Sería más complejo en la implementación real
    return [];
  }

  private generateSalesByCategory(sales: any[]): any[] {
    // Implementación de ventas por categoría
    // Sería más complejo en la implementación real
    return [];
  }

  private generateInventoryByCategory(inventory: any[]): any[] {
    // Implementación de inventario por categoría
    // Sería más complejo en la implementación real
    return [];
  }

  // --- Métodos del servicio de MongoDB analytics ---

  // =========== MÉTODOS PARA CREAR Y ACTUALIZAR DATOS DE ANALYTICS ===========

  /**
   * Crea un nuevo registro de análisis de ventas
   * @param data Datos para el nuevo registro de análisis
   */
  async createSalesAnalytics(data: Partial<SalesAnalytics>): Promise<SalesAnalytics> {
    this.logger.log(`Creating sales analytics record for period: ${data.period}`);
    const analytics = new this.salesAnalyticsModel(data);
    return analytics.save();
  }
  
  /**
   * Actualiza un registro de análisis de ventas existente
   * @param id ID del registro de análisis
   * @param data Datos a actualizar
   */
  async updateSalesAnalytics(id: string, data: Partial<SalesAnalytics>): Promise<SalesAnalytics | null> {
    this.logger.log(`Updating sales analytics record: ${id}`);
    return this.salesAnalyticsModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
  
  /**
   * Actualiza un registro de análisis de inventario existente
   * @param id ID del registro de análisis
   * @param data Datos a actualizar
   */
  async updateInventoryAnalytics(id: string, data: Partial<InventoryAnalytics>): Promise<InventoryAnalytics | null> {
    this.logger.log(`Updating inventory analytics record: ${id}`);
    return this.inventoryAnalyticsModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
  
  /**
   * Actualiza un registro de análisis de clientes existente
   * @param id ID del registro de análisis
   * @param data Datos a actualizar
   */
  async updateCustomerAnalytics(id: string, data: Partial<CustomerAnalytics>): Promise<CustomerAnalytics | null> {
    this.logger.log(`Updating customer analytics record: ${id}`);
    return this.customerAnalyticsModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  // =========== MÉTODOS PARA CONSULTAR MÉTRICAS ===========
  
  async getSalesMetrics(period: string): Promise<any> {
    this.logger.log(`Getting sales metrics for period: ${period}`);
    const pipeline = [
      { $match: { period } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalSales' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$totalProfit' },
          avgOrderValue: { $avg: '$averageOrderValue' },
          avgConversionRate: { $avg: '$conversionRate' },
        },
      },
    ];

    const result = await this.salesAnalyticsModel.aggregate(pipeline).exec();
    return result[0] || {};
  }

  async getTopSellingProducts(period: string, limit: number = 10): Promise<any[]> {
    // Buscar análisis más reciente para el periodo
    const analytics = await this.salesAnalyticsModel
      .findOne({ period })
      .sort({ date: -1 })
      .exec();

    if (!analytics || !analytics.topSellingModels) {
      return [];
    }

    return analytics.topSellingModels.slice(0, limit);
  }

  async getSalesByCategory(period: string): Promise<any[]> {
    // Buscar análisis más reciente para el periodo
    const analytics = await this.salesAnalyticsModel
      .findOne({ period })
      .sort({ date: -1 })
      .exec();

    if (!analytics || !analytics.salesByCategory) {
      return [];
    }

    return analytics.salesByCategory;
  }

  // Inventory Analytics
  async getLowStockItems(): Promise<any[]> {
    // Buscar análisis más reciente
    const analytics = await this.inventoryAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    if (!analytics) {
      return [];
    }

    // Revisamos inventory.lowStockItems es un número, así que devolvemos los items relevantes del inventario
    // En una implementación real, esto requeriría acceder directamente al inventario
    // y filtrar los elementos con bajo stock
    return []; // Implementación temporal que devuelve un array vacío
  }

  async getStockMovements(period: string, motorcycleId?: string): Promise<any[]> {
    // Filtrar por periodo y opcionalmente por motocicleta
    let filter: any = { period };
    if (motorcycleId) {
      filter['stockMovements.motorcycleId'] = motorcycleId;
    }

    const analytics = await this.inventoryAnalyticsModel
      .findOne(filter)
      .sort({ date: -1 })
      .exec();

    if (!analytics || !analytics.stockMovements) {
      return [];
    }

    let movements = analytics.stockMovements;
    if (motorcycleId) {
      movements = movements.filter(m => m.motorcycleId === motorcycleId);
    }

    return movements;
  }

  // Customer Analytics
  async getCustomerAnalytics(filters: {
    period?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<CustomerAnalytics[]> {
    const query: any = {};

    if (filters.period) {
      query.period = filters.period;
    }

    if (filters.fromDate || filters.toDate) {
      query.date = {};
      if (filters.fromDate) {
        query.date.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.date.$lte = filters.toDate;
      }
    }

    return this.customerAnalyticsModel
      .find(query)
      .sort({ date: -1 })
      .exec();
  }

  async getCustomerSegments(): Promise<any[]> {
    // Obtener el análisis de clientes más reciente
    const analytics = await this.customerAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    if (!analytics || !analytics.customerSegments) {
      return [];
    }

    return analytics.customerSegments;
  }

  async getCustomerLifetimeValue(): Promise<any> {
    // Obtener el análisis de clientes más reciente
    const analytics = await this.customerAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    if (!analytics) {
      return {};
    }

    return { customerLifetimeValue: analytics.customerLifetimeValue };
  }

  async getGeographicDistribution(): Promise<any[]> {
    // Obtener el análisis de clientes más reciente
    const analytics = await this.customerAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    if (!analytics || !analytics.geographicDistribution) {
      return [];
    }

    return analytics.geographicDistribution;
  }

  async getDashboardSummary(): Promise<any> {
    // Obtener análisis más recientes de ventas, inventario y clientes
    const salesAnalytics = await this.salesAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    const inventoryAnalytics = await this.inventoryAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    const customerAnalytics = await this.customerAnalyticsModel
      .findOne()
      .sort({ date: -1 })
      .exec();

    return {
      sales: salesAnalytics ? {
        totalSales: salesAnalytics.totalSales,
        totalRevenue: salesAnalytics.totalRevenue,
        averageOrderValue: salesAnalytics.averageOrderValue,
        recentTrend: salesAnalytics.salesByMonth ? 
          salesAnalytics.salesByMonth.slice(-5) : []
      } : {},
      inventory: inventoryAnalytics ? {
        totalItems: inventoryAnalytics.totalItems,
        totalValue: inventoryAnalytics.totalValue,
        lowStockCount: inventoryAnalytics.lowStockItems || 0
      } : {},
      customers: customerAnalytics ? {
        totalCustomers: customerAnalytics.totalCustomers,
        newCustomers: customerAnalytics.newCustomers,
        activeCustomers: customerAnalytics.activeCustomers
      } : {}
    };
  }
}

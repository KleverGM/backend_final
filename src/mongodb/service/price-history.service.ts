import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PriceHistory, PriceHistoryDocument } from '../price-history/price-history.schema';

@Injectable()
export class PriceHistoryService {
  async getPriceHistoryBySeller(sellerId: string): Promise<any[]> {
    return await this.priceHistoryModel.find({ sellerId });
  }

  async getPriceHistoryByCustomer(customerId: string): Promise<any[]> {
    return await this.priceHistoryModel.find({ customerId });
  }
  private readonly logger = new Logger(PriceHistoryService.name);

  constructor(
    @InjectModel(PriceHistory.name)
    private priceHistoryModel: Model<PriceHistoryDocument>,
  ) {}

  async recordPriceChange(data: {
    motorcycleId: string;
    brand: string;
    model: string;
    year: number;
    newPrice: number;
    previousPrice: number;
    changeReason: string;
    updatedBy: string;
    notes?: string;
    marketTrends?: any;
  }): Promise<PriceHistory> {
    try {
      const priceChange = data.newPrice - data.previousPrice;
      const changePercentage = (priceChange / data.previousPrice) * 100;
      const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'stable';

      const priceHistory = new this.priceHistoryModel({
        motorcycleId: data.motorcycleId,
        brand: data.brand,
        model: data.model,
        year: data.year,
        price: data.newPrice,
        previousPrice: data.previousPrice,
        changeAmount: priceChange,
        changePercentage,
        changeType,
        changeReason: data.changeReason,
        updatedBy: data.updatedBy,
        notes: data.notes,
        effectiveDate: new Date(),
        marketTrends: data.marketTrends,
      });

      return await priceHistory.save();
    } catch (error) {
      this.logger.error(`Failed to record price change: ${error.message}`);
      throw error;
    }
  }

  async getMotorcyclePriceHistory(
    motorcycleId: string,
    limit: number = 50,
  ): Promise<PriceHistory[]> {
    try {
      return await this.priceHistoryModel
        .find({ motorcycleId })
        .sort({ effectiveDate: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get price history: ${error.message}`);
      throw error;
    }
  }
  
  async getPriceHistoryByMotorcycleId(
    motorcycleId: string,
  ): Promise<PriceHistory[]> {
    try {
      return await this.priceHistoryModel
        .find({ motorcycleId })
        .sort({ effectiveDate: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get price history by ID: ${error.message}`);
      throw error;
    }
  }

  async getPriceHistoryByBrand(
    brand: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<PriceHistory[]> {
    try {
      const query: any = { brand };

      if (fromDate || toDate) {
        query.effectiveDate = {};
        if (fromDate) {
          query.effectiveDate.$gte = fromDate;
        }
        if (toDate) {
          query.effectiveDate.$lte = toDate;
        }
      }

      return await this.priceHistoryModel
        .find(query)
        .sort({ effectiveDate: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get brand price history: ${error.message}`);
      throw error;
    }
  }

  async getPriceTrends(period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    try {
      const now = new Date();
      let fromDate: Date;

      switch (period) {
        case 'weekly':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const pipeline = [
        {
          $match: {
            effectiveDate: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: {
              brand: '$brand',
              model: '$model',
            },
            avgPriceChange: { $avg: '$changePercentage' },
            totalPriceChanges: { $sum: 1 },
            latestPrice: { $last: '$price' },
            earliestPrice: { $first: '$price' },
          },
        },
        {
          $addFields: {
            totalPeriodChange: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$latestPrice', '$earliestPrice'] },
                    '$earliestPrice',
                  ],
                },
                100,
              ],
            },
          },
        },
        {
          $sort: { totalPeriodChange: -1 as 1 | -1 },
        },
      ];

      const trends = await this.priceHistoryModel.aggregate(pipeline).exec();

      const changeReasonsPipeline = [
        {
          $match: {
            effectiveDate: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: '$reason',
            count: { $sum: 1 },
            avgPriceChange: { $avg: '$changePercentage' },
          },
        },
        {
          $sort: { count: -1 as 1 | -1 },
        },
      ] as any[];

      const changeReasons = await this.priceHistoryModel.aggregate(changeReasonsPipeline).exec();

      return {
        period,
        trends,
        changeReasons,
        summary: {
          totalChanges: trends.reduce((sum, item) => sum + item.totalPriceChanges, 0),
          avgChange: trends.reduce((sum, item) => sum + item.avgPriceChange, 0) / trends.length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get price trends: ${error.message}`);
      throw error;
    }
  }

  async getMarketComparison(
    brand: string,
    model: string,
    year: number,
  ): Promise<any> {
    try {
      const latestRecord = await this.priceHistoryModel
        .findOne({ brand, model, year })
        .sort({ effectiveDate: -1 })
        .exec();

      if (!latestRecord) {
        return null;
      }

      // Get historical data for the same model
      const historicalData = await this.priceHistoryModel
        .find({ brand, model, year })
        .sort({ effectiveDate: 1 })
        .limit(10)
        .exec();

      // Get similar models in the same price range
      const similarModels = await this.priceHistoryModel
        .find({
          brand,
          year: { $gte: year - 2, $lte: year + 2 },
          price: {
            $gte: latestRecord.price * 0.8,
            $lte: latestRecord.price * 1.2,
          },
          model: { $ne: model },
        })
        .sort({ effectiveDate: -1 })
        .limit(5)
        .exec();

      return {
        currentModel: {
          brand,
          model,
          year,
          currentPrice: latestRecord.price,
          priceHistory: historicalData,
        },
        similarModels,
        marketTrends: {
          trend: latestRecord.changeType,
          changeAmount: latestRecord.changeAmount,
          changePercentage: latestRecord.changePercentage,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get market comparison: ${error.message}`);
      throw error;
    }
  }

  async generatePriceReport(filters: {
    brand?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<any> {
    try {
      const query: any = {};

      if (filters.brand) {
        query.brand = filters.brand;
      }

      if (filters.fromDate || filters.toDate) {
        query.effectiveDate = {};
        if (filters.fromDate) {
          query.effectiveDate.$gte = filters.fromDate;
        }
        if (filters.toDate) {
          query.effectiveDate.$lte = filters.toDate;
        }
      }

      const priceChanges = await this.priceHistoryModel.find(query).exec();

      const summary = {
        totalChanges: priceChanges.length,
        priceIncreases: priceChanges.filter(p => p.changeAmount > 0).length,
        priceDecreases: priceChanges.filter(p => p.changeAmount < 0).length,
        avgPriceChange: priceChanges.reduce((sum, p) => sum + p.changeAmount, 0) / priceChanges.length,
        avgPercentChange: priceChanges.reduce((sum, p) => sum + p.changePercentage, 0) / priceChanges.length,
      };

      return {
        filters,
        summary,
        priceChanges,
      };
    } catch (error) {
      this.logger.error(`Failed to generate price report: ${error.message}`);
      throw error;
    }
  }
  
  async getRecentPriceChanges(limit: number = 10): Promise<PriceHistory[]> {
    try {
      return await this.priceHistoryModel
        .find()
        .sort({ effectiveDate: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get recent price changes: ${error.message}`);
      throw error;
    }
  }

  async getPriceStatistics(period: string = 'yearly'): Promise<any> {
    try {
      const now = new Date();
      let fromDate: Date;

      switch (period) {
        case 'weekly':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
        default:
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Estadísticas por marca
      const brandStatsPipeline = [
        {
          $match: {
            effectiveDate: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: '$brand',
            avgChange: { $avg: '$changePercentage' },
            totalChanges: { $sum: 1 },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        {
          $sort: { totalChanges: -1 as 1 | -1 },
        },
      ] as any[];

      const brandStats = await this.priceHistoryModel.aggregate(brandStatsPipeline).exec();

      // Estadísticas generales
      const allChanges = await this.priceHistoryModel
        .find({ effectiveDate: { $gte: fromDate } })
        .exec();

      const increases = allChanges.filter(change => change.changePercentage > 0);
      const decreases = allChanges.filter(change => change.changePercentage < 0);

      return {
        period,
        summary: {
          totalRecords: allChanges.length,
          increases: increases.length,
          decreases: decreases.length,
          noChange: allChanges.length - increases.length - decreases.length,
          averageIncrease: increases.length > 0 
            ? increases.reduce((sum, item) => sum + item.changePercentage, 0) / increases.length 
            : 0,
          averageDecrease: decreases.length > 0
            ? decreases.reduce((sum, item) => sum + item.changePercentage, 0) / decreases.length
            : 0,
        },
        brandStats,
      };
    } catch (error) {
      this.logger.error(`Failed to get price statistics: ${error.message}`);
      throw error;
    }
  }

  async comparePriceChanges(
    motorcycleIds: string[],
    options: { fromDate?: Date; toDate?: Date } = {}
  ): Promise<any> {
    try {
      const { fromDate, toDate } = options;
      const query: any = { motorcycleId: { $in: motorcycleIds } };

      if (fromDate || toDate) {
        query.effectiveDate = {};
        if (fromDate) {
          query.effectiveDate.$gte = fromDate;
        }
        if (toDate) {
          query.effectiveDate.$lte = toDate;
        }
      }

      // Obtener historial de precios para cada motocicleta
      const priceHistories = await this.priceHistoryModel
        .find(query)
        .sort({ motorcycleId: 1, effectiveDate: 1 })
        .exec();

      // Agrupar por motorcycleId
      const groupedHistories = priceHistories.reduce((groups, item) => {
        const motorcycleId = item.motorcycleId;
        if (!groups[motorcycleId]) {
          groups[motorcycleId] = [];
        }
        groups[motorcycleId].push(item);
        return groups;
      }, {});

      // Calcular estadísticas para cada motocicleta
      const results = Object.keys(groupedHistories).map(motorcycleId => {
        const history = groupedHistories[motorcycleId];
        const firstPrice = history[0]?.price || 0;
        const lastPrice = history[history.length - 1]?.price || 0;
        const priceChanges = history.length > 1 ? history.length - 1 : 0;
        
        return {
          motorcycleId,
          brand: history[0]?.brand || 'Unknown',
          model: history[0]?.model || 'Unknown',
          firstPrice,
          currentPrice: lastPrice,
          totalChangeAmount: lastPrice - firstPrice,
          totalChangePercent: firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0,
          priceChanges,
          history: history.map(item => ({
            date: item.effectiveDate,
            price: item.price,
            changeAmount: item.changeAmount,
            changePercent: item.changePercentage,
            reason: item.reason
          }))
        };
      });

      return results;
    } catch (error) {
      this.logger.error(`Failed to compare price changes: ${error.message}`);
      throw error;
    }
  }

  async updatePriceHistory(id: string, updateDto: any): Promise<any> {
    // Implementación básica: actualizar por id
    return await this.priceHistoryModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async deletePriceHistory(id: string): Promise<void> {
    await this.priceHistoryModel.findByIdAndDelete(id);
  }
}

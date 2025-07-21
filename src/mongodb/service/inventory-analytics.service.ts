import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class InventoryAnalyticsService {
  private readonly logger = new Logger(InventoryAnalyticsService.name);

  constructor(
    @InjectModel('InventoryAnalytics')
    private readonly inventoryAnalyticsModel: Model<any>,
  ) {}

  async create(data: any): Promise<any> {
    try {
      const created = await this.inventoryAnalyticsModel.create(data);
      return created;
    } catch (error) {
      this.logger.error('Error creating inventory analytics', error);
      throw error;
    }
  }
}

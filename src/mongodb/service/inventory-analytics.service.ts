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

  async findAll(): Promise<any[]> {
    try {
      return await this.inventoryAnalyticsModel.find().exec();
    } catch (error) {
      this.logger.error('Error fetching inventory analytics', error);
      throw error;
    }
  }

  async update(id: string, data: any): Promise<any> {
    try {
      return await this.inventoryAnalyticsModel.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      this.logger.error('Error updating inventory analytics', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.inventoryAnalyticsModel.findByIdAndDelete(id).exec();
    } catch (error) {
      this.logger.error('Error deleting inventory analytics', error);
      throw error;
    }
  }
}

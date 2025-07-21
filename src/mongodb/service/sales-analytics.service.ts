import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SalesAnalyticsService {
  async findOne(id: string): Promise<any> {
    return await this.salesAnalyticsModel.findById(id);
  }

  async update(id: string, data: any): Promise<any> {
    return await this.salesAnalyticsModel.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string): Promise<void> {
    await this.salesAnalyticsModel.findByIdAndDelete(id);
  }

  async findBySeller(sellerId: string): Promise<any[]> {
    return await this.salesAnalyticsModel.find({ sellerId });
  }

  async findByCustomer(customerId: string): Promise<any[]> {
    return await this.salesAnalyticsModel.find({ customerId });
  }
  private readonly logger = new Logger(SalesAnalyticsService.name);

  constructor(
    @InjectModel('SalesAnalytics')
    private readonly salesAnalyticsModel: Model<any>,
  ) {}

  async create(data: any): Promise<any> {
    try {
      const created = await this.salesAnalyticsModel.create(data);
      return created;
    } catch (error) {
      this.logger.error('Error creating sales analytics', error);
      throw error;
    }
  }
}

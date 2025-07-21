import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CustomerAnalyticsService {
  async findOne(id: string): Promise<any> {
    return await this.customerAnalyticsModel.findById(id);
  }

  async update(id: string, data: any): Promise<any> {
    return await this.customerAnalyticsModel.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string): Promise<void> {
    await this.customerAnalyticsModel.findByIdAndDelete(id);
  }

  async findBySeller(sellerId: string): Promise<any[]> {
    return await this.customerAnalyticsModel.find({ sellerId });
  }

  async findByCustomer(customerId: string): Promise<any[]> {
    return await this.customerAnalyticsModel.find({ customerId });
  }
  private readonly logger = new Logger(CustomerAnalyticsService.name);

  constructor(
    @InjectModel('CustomerAnalytics')
    private readonly customerAnalyticsModel: Model<any>,
  ) {}

  async create(data: any): Promise<any> {
    try {
      const created = await this.customerAnalyticsModel.create(data);
      return created;
    } catch (error) {
      this.logger.error('Error creating customer analytics', error);
      throw error;
    }
  }
}

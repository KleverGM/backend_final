import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CustomerAnalyticsService } from '../service/customer-analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('customer-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerAnalyticsController {
  constructor(private readonly customerAnalyticsService: CustomerAnalyticsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: any) {
    const created = await this.customerAnalyticsService.create(dto);
    return { message: 'Customer analytics created', data: created };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.customerAnalyticsService.findOne(id);
    return { message: 'Customer analytics found', data: result };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.customerAnalyticsService.update(id, dto);
    return { message: 'Customer analytics updated', data: updated };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.customerAnalyticsService.remove(id);
    return { message: 'Customer analytics deleted' };
  }

  // Endpoint para que el seller consulte sus analytics
  @Get('seller/:sellerId')
  @Roles(UserRole.SELLER)
  async getSellerAnalytics(@Param('sellerId') sellerId: string) {
    const result = await this.customerAnalyticsService.findBySeller(sellerId);
    return { message: 'Customer analytics for seller', data: result };
  }

  // Endpoint para que el customer consulte sus analytics
  @Get('customer/:customerId')
  @Roles(UserRole.CUSTOMER)
  async getCustomerAnalytics(@Param('customerId') customerId: string) {
    const result = await this.customerAnalyticsService.findByCustomer(customerId);
    return { message: 'Customer analytics for customer', data: result };
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalesAnalyticsService } from '../service/sales-analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('sales-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesAnalyticsController {
  constructor(private readonly salesAnalyticsService: SalesAnalyticsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: any) {
    const created = await this.salesAnalyticsService.create(dto);
    return { message: 'Sales analytics created', data: created };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.salesAnalyticsService.findOne(id);
    return { message: 'Sales analytics found', data: result };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.salesAnalyticsService.update(id, dto);
    return { message: 'Sales analytics updated', data: updated };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.salesAnalyticsService.remove(id);
    return { message: 'Sales analytics deleted' };
  }

  // Endpoint para que el seller consulte sus analytics
  @Get('seller/:sellerId')
  @Roles(UserRole.SELLER)
  async getSellerAnalytics(@Param('sellerId') sellerId: string) {
    const result = await this.salesAnalyticsService.findBySeller(sellerId);
    return { message: 'Sales analytics for seller', data: result };
  }

  // Endpoint para que el customer consulte sus analytics
  @Get('customer/:customerId')
  @Roles(UserRole.CUSTOMER)
  async getCustomerAnalytics(@Param('customerId') customerId: string) {
    const result = await this.salesAnalyticsService.findByCustomer(customerId);
    return { message: 'Sales analytics for customer', data: result };
  }
}

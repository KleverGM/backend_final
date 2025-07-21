import { Controller, Get, Post, Body, Query, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { PriceHistoryService } from '../service/price-history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('price-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PriceHistoryController {
  constructor(private readonly priceHistoryService: PriceHistoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async recordPriceChange(@Body() data: any) {
    const result = await this.priceHistoryService.recordPriceChange(data);
    return {
      message: 'Price change recorded successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updatePriceHistory(@Param('id') id: string, @Body() updateDto: any) {
    const result = await this.priceHistoryService.updatePriceHistory(id, updateDto);
    return {
      message: 'Price history updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deletePriceHistory(@Param('id') id: string) {
    await this.priceHistoryService.deletePriceHistory(id);
    return { message: 'Price history deleted successfully' };
  }

  @Get('motorcycle/:id')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  async getPriceHistoryByMotorcycle(@Param('id') motorcycleId: string) {
    // Asumiendo que existe este método en el servicio
    const result = await this.priceHistoryService.getPriceHistoryByMotorcycleId(motorcycleId);
    return {
      message: 'Price history retrieved successfully',
      data: result,
    };
  }

  @Get('brand/:brand')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getPriceHistoryByBrand(
    @Param('brand') brand: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
  ) {
    const result = await this.priceHistoryService.getPriceHistoryByBrand(brand, fromDate, toDate);
    return {
      message: `Price history for ${brand} retrieved successfully`,
      data: result,
    };
  }

  @Get('trends')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getPriceTrends(
    @Query('period') period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ) {
    const result = await this.priceHistoryService.getPriceTrends(period);
    return {
      message: 'Price trends retrieved successfully',
      data: result,
    };
  }

  @Get('changes/recent')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getRecentPriceChanges(
    @Query('limit') limit: number = 10
  ) {
    // Asumiendo que existe este método en el servicio
    const result = await this.priceHistoryService.getRecentPriceChanges(limit);
    return {
      message: 'Recent price changes retrieved successfully',
      data: result,
    };
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  async getPriceStatistics(
    @Query('period') period: string = 'yearly'
  ) {
    // Asumiendo que existe este método en el servicio
    const result = await this.priceHistoryService.getPriceStatistics(period);
    return {
      message: 'Price statistics retrieved successfully',
      data: result,
    };
  }

  @Get('comparison')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async comparePriceChanges(
    @Query('motorcycleIds') motorcycleIds: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date
  ) {
    const ids = motorcycleIds.split(',');
    const result = await this.priceHistoryService.comparePriceChanges(ids, { fromDate, toDate });
    return {
      message: 'Price comparison retrieved successfully',
      data: result,
    };
  }
  
  @Get('report')
  @Roles(UserRole.ADMIN)
  async generatePriceReport(
    @Query('brand') brand?: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date
  ) {
    const result = await this.priceHistoryService.generatePriceReport({
      brand,
      fromDate,
      toDate
    });
    return {
      message: 'Price report generated successfully',
      data: result,
    };
  }

  // Endpoint para que el seller consulte su historial de precios
  @Get('seller/:sellerId')
  @Roles(UserRole.SELLER)
  async getSellerPriceHistory(@Param('sellerId') sellerId: string) {
    // Solo se pasa sellerId, sin propiedades extra
    const history = await this.priceHistoryService.getPriceHistoryBySeller(sellerId);
    return { message: 'Price history for seller', data: history };
  }

  // Endpoint para que el customer consulte su historial de precios
  @Get('customer/:customerId')
  @Roles(UserRole.CUSTOMER)
  async getCustomerPriceHistory(@Param('customerId') customerId: string) {
    // Solo se pasa customerId, sin propiedades extra
    const history = await this.priceHistoryService.getPriceHistoryByCustomer(customerId);
    return { message: 'Price history for customer', data: history };
  }
}

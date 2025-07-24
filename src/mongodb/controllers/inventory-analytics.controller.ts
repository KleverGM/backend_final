import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InventoryAnalyticsService } from '../service/inventory-analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('inventory-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryAnalyticsController {
  constructor(private readonly inventoryAnalyticsService: InventoryAnalyticsService) {}


  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: any) {
    const created = await this.inventoryAnalyticsService.create(dto);
    return { message: 'Inventory analytics created', data: created };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    const data = await this.inventoryAnalyticsService.findAll();
    return { message: 'Inventory analytics list', data };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    // Implementar lógica de consulta
    return { message: 'Inventory analytics found', id };
  }


  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.inventoryAnalyticsService.update(id, dto);
    return { message: 'Inventory analytics updated', data: updated };
  }


  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.inventoryAnalyticsService.remove(id);
    return { message: 'Inventory analytics deleted', id };
  }

  // Endpoint para que el seller consulte sus analytics
  @Get('seller/:sellerId')
  @Roles(UserRole.SELLER)
  async getSellerAnalytics(@Param('sellerId') sellerId: string) {
    // Implementar lógica de consulta para seller
    return { message: 'Inventory analytics for seller', sellerId };
  }

  // Endpoint para que el customer consulte sus analytics
  @Get('customer/:customerId')
  @Roles(UserRole.CUSTOMER)
  async getCustomerAnalytics(@Param('customerId') customerId: string) {
    // Implementar lógica de consulta para customer
    return { message: 'Inventory analytics for customer', customerId };
  }
}

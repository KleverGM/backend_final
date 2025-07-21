import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UnifiedAnalyticsService } from './unified-analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { AnalyticsPeriod, AnalyticsType, AnalyticsQueryDto } from './dto/analytics.dto';
import { RequestWithUser } from '../common/interfaces/auth.interfaces';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: UnifiedAnalyticsService) {}

  @Get('dashboard/seller')
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener panel de control del vendedor' })
  @ApiResponse({ status: 200, description: 'Datos del panel recuperados exitosamente' })
  async getSellerDashboard(@Request() req: RequestWithUser) {
    return await this.analyticsService.getSellerDashboardData(req.user.id);
  }

  @Get('sales')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener análisis de ventas' })
  @ApiResponse({ status: 200, description: 'Análisis de ventas recuperados exitosamente' })
  @ApiQuery({ name: 'period', enum: AnalyticsPeriod, description: 'Período para el análisis' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filtrar por marca' })
  async getSalesAnalytics(
    @Query() query: AnalyticsQueryDto,
    @Request() req: RequestWithUser,
  ) {
    // Si es vendedor, obtener solo sus ventas
    const sellerId = req.user.role === UserRole.SELLER ? req.user.id : undefined;
    const analytics = await this.analyticsService.getSalesAnalytics(query, sellerId);
    
    return {
      message: 'Análisis de ventas recuperados exitosamente',
      data: analytics,
    };
  }

  @Get('inventory')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener análisis de inventario' })
  @ApiResponse({ status: 200, description: 'Análisis de inventario recuperados exitosamente' })
  @ApiQuery({ name: 'period', enum: AnalyticsPeriod, description: 'Período para el análisis' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoría' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filtrar por marca' })
  async getInventoryAnalytics(@Query() query: AnalyticsQueryDto) {
    const analytics = await this.analyticsService.getInventoryAnalytics(query);
    
    return {
      message: 'Análisis de inventario recuperados exitosamente',
      data: analytics,
    };
  }
}

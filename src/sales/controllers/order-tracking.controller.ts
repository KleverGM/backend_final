import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { OrderTrackingService, TrackingUpdate } from '../services/order-tracking.service';
import { RequestWithUser } from '../../common/interfaces/auth.interfaces';

@ApiTags('Order Tracking')
@Controller('orders')
export class OrderTrackingController {
  constructor(private readonly orderTrackingService: OrderTrackingService) {}

  @Get('my-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las órdenes del cliente' })
  @ApiResponse({ status: 200, description: 'Órdenes recuperadas exitosamente' })
  async getMyOrders(@Request() req: RequestWithUser) {
    if (!req.user.customerId) {
      throw new ForbiddenException('Usuario no tiene perfil de cliente');
    }
    
    const orders = await this.orderTrackingService.getCustomerOrders(req.user.customerId);
    
    return {
      message: 'Órdenes recuperadas exitosamente',
      data: orders,
    };
  }

  @Get(':id/tracking')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalles de seguimiento de una orden' })
  @ApiResponse({ status: 200, description: 'Detalles de seguimiento recuperados exitosamente' })
  async getOrderTracking(@Param('id') id: string, @Request() req: RequestWithUser) {
    let order;
    
    // Si es cliente, solo puede ver sus propias órdenes
    if (req.user.role === UserRole.CUSTOMER) {
      if (!req.user.customerId) {
        throw new ForbiddenException('Usuario no tiene perfil de cliente');
      }
      order = await this.orderTrackingService.getOrderTracking(id, req.user.customerId);
    } else {
      // Admin y vendedor pueden ver cualquier orden
      order = await this.orderTrackingService.getOrderTracking(id);
    }
    
    return {
      message: 'Detalles de seguimiento recuperados exitosamente',
      data: order,
    };
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de una orden (Admin/Seller)' })
  @ApiResponse({ status: 200, description: 'Estado de orden actualizado exitosamente' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() trackingUpdate: TrackingUpdate,
    @Request() req: RequestWithUser
  ) {
    const order = await this.orderTrackingService.updateOrderStatus(
      id,
      trackingUpdate,
      req.user.role as UserRole,
      req.user.id
    );
    
    return {
      message: 'Estado de orden actualizado exitosamente',
      data: order,
    };
  }
}

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { getErrorMessage } from '../../common/types/error.types';
import { UserRole } from '../../auth/entities/user.entity';

export interface TrackingUpdate {
  status: SaleStatus;
  timestamp: Date;
  comments?: string;
  updatedBy?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDeliveryDate?: Date;
}

@Injectable()
export class OrderTrackingService {
  private readonly logger = new Logger(OrderTrackingService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async getOrderTracking(orderId: string, customerId?: string): Promise<Sale> {
    try {
      const queryBuilder = this.saleRepository.createQueryBuilder('sale')
        .leftJoinAndSelect('sale.customer', 'customer')
        .leftJoinAndSelect('sale.items', 'items')
        .leftJoinAndSelect('items.motorcycle', 'motorcycle')
        .where('sale.id = :orderId', { orderId })
        .andWhere('sale.isDeleted = :isDeleted', { isDeleted: false });

      // Si es un cliente, solo puede ver sus propias órdenes
      if (customerId) {
        queryBuilder.andWhere('sale.customerId = :customerId', { customerId });
      }

      const order = await queryBuilder.getOne();

      if (!order) {
        throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
      }

      return order;
    } catch (error) {
      this.logger.error(`Error al obtener seguimiento de orden: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getCustomerOrders(customerId: string): Promise<Sale[]> {
    try {
      const orders = await this.saleRepository.find({
        where: { customerId, isDeleted: false },
        relations: ['items', 'items.motorcycle'],
        order: { createdAt: 'DESC' },
      });

      return orders;
    } catch (error) {
      this.logger.error(`Error al obtener órdenes del cliente: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string, 
    trackingUpdate: TrackingUpdate, 
    userRole: UserRole, 
    userId: string
  ): Promise<Sale> {
    try {
      const order = await this.saleRepository.findOne({
        where: { id: orderId, isDeleted: false },
      });

      if (!order) {
        throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
      }

      // Validar permisos según el estado
      if (userRole !== UserRole.ADMIN) {
        this.validateStatusChange(order.status, trackingUpdate.status, userRole);
      }

      // Actualizar estado
      order.status = trackingUpdate.status;

      // Actualizar campos de seguimiento si se proporcionaron
      if (trackingUpdate.trackingNumber) {
        order.trackingNumber = trackingUpdate.trackingNumber;
      }
      if (trackingUpdate.shippingCarrier) {
        order.shippingCarrier = trackingUpdate.shippingCarrier;
      }
      if (trackingUpdate.estimatedDeliveryDate) {
        order.estimatedDeliveryDate = trackingUpdate.estimatedDeliveryDate;
      }

      // Actualizar historial de estado
      const statusHistoryEntry = {
        status: trackingUpdate.status,
        timestamp: trackingUpdate.timestamp || new Date(),
        comments: trackingUpdate.comments || '',
        updatedBy: userId,
      };

      if (order.statusHistory) {
        order.statusHistory.push(statusHistoryEntry);
      } else {
        order.statusHistory = [statusHistoryEntry];
      }

      // Si el estado es completado, marcar como entregado
      if (trackingUpdate.status === SaleStatus.COMPLETED) {
        order.isDelivered = true;
      }

      const updatedOrder = await this.saleRepository.save(order);
      this.logger.log(`Orden ${orderId} actualizada a estado ${trackingUpdate.status}`);

      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error al actualizar estado de orden: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private validateStatusChange(currentStatus: SaleStatus, newStatus: SaleStatus, userRole: UserRole): void {
    // Definir transiciones válidas según el rol
    const allowedTransitions: Record<UserRole, Record<SaleStatus, SaleStatus[]>> = {
      [UserRole.ADMIN]: {
        // Los administradores pueden cambiar a cualquier estado
        [SaleStatus.PENDING]: Object.values(SaleStatus),
        [SaleStatus.CONFIRMED]: Object.values(SaleStatus),
        [SaleStatus.PROCESSING]: Object.values(SaleStatus),
        [SaleStatus.PREPARING]: Object.values(SaleStatus),
        [SaleStatus.READY_FOR_PICKUP]: Object.values(SaleStatus),
        [SaleStatus.IN_TRANSIT]: Object.values(SaleStatus),
        [SaleStatus.COMPLETED]: Object.values(SaleStatus),
        [SaleStatus.CANCELLED]: Object.values(SaleStatus),
        [SaleStatus.REFUNDED]: Object.values(SaleStatus),
      },
      [UserRole.SELLER]: {
        [SaleStatus.PENDING]: [SaleStatus.CONFIRMED, SaleStatus.CANCELLED],
        [SaleStatus.CONFIRMED]: [SaleStatus.PROCESSING, SaleStatus.CANCELLED],
        [SaleStatus.PROCESSING]: [SaleStatus.PREPARING, SaleStatus.CANCELLED],
        [SaleStatus.PREPARING]: [SaleStatus.READY_FOR_PICKUP, SaleStatus.IN_TRANSIT],
        [SaleStatus.READY_FOR_PICKUP]: [SaleStatus.COMPLETED],
        [SaleStatus.IN_TRANSIT]: [SaleStatus.COMPLETED],
        [SaleStatus.COMPLETED]: [],
        [SaleStatus.CANCELLED]: [SaleStatus.REFUNDED],
        [SaleStatus.REFUNDED]: [],
      },
      [UserRole.CUSTOMER]: {
        // Los clientes no pueden cambiar el estado directamente
        [SaleStatus.PENDING]: [],
        [SaleStatus.CONFIRMED]: [],
        [SaleStatus.PROCESSING]: [],
        [SaleStatus.PREPARING]: [],
        [SaleStatus.READY_FOR_PICKUP]: [],
        [SaleStatus.IN_TRANSIT]: [],
        [SaleStatus.COMPLETED]: [],
        [SaleStatus.CANCELLED]: [],
        [SaleStatus.REFUNDED]: [],
      },
    };

    const allowed = allowedTransitions[userRole][currentStatus];
    
    if (!allowed.includes(newStatus)) {
      throw new ForbiddenException(
        `No está autorizado para cambiar el estado de la orden de ${currentStatus} a ${newStatus}`,
      );
    }
  }
}

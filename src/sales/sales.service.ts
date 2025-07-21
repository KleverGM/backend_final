import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus, PaymentStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';
import { CreateSaleDto, UpdateSaleDto, AddPaymentDto } from './dto/sale.dto';
import { getErrorMessage } from '../common/types/error.types';
import { UserRole } from '../auth/entities/user.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto, sellerId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify customer exists
      const customer = await this.customerRepository.findOne({
        where: { id: createSaleDto.customerId, isActive: true, isDeleted: false },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${createSaleDto.customerId} not found`);
      }

      // Generate sale number
      const saleNumber = await this.generateSaleNumber();

      // Calculate totals
      let subtotal = 0;
      const saleItems: Partial<SaleItem>[] = [];

      for (const itemDto of createSaleDto.items) {
        const motorcycle = await this.motorcycleRepository.findOne({
          where: { id: itemDto.motorcycleId, isActive: true },
        });

        if (!motorcycle) {
          throw new NotFoundException(`Motorcycle with ID ${itemDto.motorcycleId} not found`);
        }

        const totalPrice = itemDto.unitPrice * itemDto.quantity;
        const discountAmount = (totalPrice * (itemDto.discountPercent || 0)) / 100;
        
        saleItems.push({
          motorcycleId: itemDto.motorcycleId,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          totalPrice,
          discountPercent: itemDto.discountPercent || 0,
          discountAmount,
          notes: itemDto.notes,
        });

        subtotal += totalPrice - discountAmount;
      }

      const taxAmount = (subtotal * (createSaleDto.taxRate || 0)) / 100;
      const totalAmount = subtotal + taxAmount - (createSaleDto.discountAmount || 0);

      // Create sale
      const saleData: Partial<Sale> = {
        saleNumber,
        customerId: createSaleDto.customerId,
        sellerId,
        subtotal,
        taxAmount,
        taxRate: createSaleDto.taxRate || 0,
        discountAmount: createSaleDto.discountAmount || 0,
        totalAmount,
        paymentMethod: createSaleDto.paymentMethod,
        notes: createSaleDto.notes,
        internalNotes: createSaleDto.internalNotes,
        deliveryAddress: createSaleDto.deliveryAddress,
      };

      if (createSaleDto.deliveryDate) {
        saleData.deliveryDate = new Date(createSaleDto.deliveryDate);
      }

      const sale = queryRunner.manager.create(Sale, saleData);

      const savedSale = await queryRunner.manager.save(Sale, sale);

      // Create sale items
      for (const itemData of saleItems) {
        const saleItem = queryRunner.manager.create(SaleItem, {
          ...itemData,
          saleId: savedSale.id,
        });
        await queryRunner.manager.save(SaleItem, saleItem);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Sale created with ID: ${savedSale.id}, Number: ${saleNumber}`);
      
      // Return sale with items
      return await this.findOne(savedSale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create sale: ${getErrorMessage(error)}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: {
    status?: SaleStatus;
    paymentStatus?: PaymentStatus;
    customerId?: string;
    sellerId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Sale[]> {
    try {
      const queryBuilder = this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect('sale.customer', 'customer')
        .leftJoinAndSelect('sale.seller', 'seller')
        .leftJoinAndSelect('sale.items', 'items')
        .leftJoinAndSelect('items.motorcycle', 'motorcycle');

      if (filters?.status) {
        queryBuilder.andWhere('sale.status = :status', { status: filters.status });
      }

      if (filters?.paymentStatus) {
        queryBuilder.andWhere('sale.paymentStatus = :paymentStatus', {
          paymentStatus: filters.paymentStatus,
        });
      }

      if (filters?.customerId) {
        queryBuilder.andWhere('sale.customerId = :customerId', {
          customerId: filters.customerId,
        });
      }

      if (filters?.sellerId) {
        queryBuilder.andWhere('sale.sellerId = :sellerId', {
          sellerId: filters.sellerId,
        });
      }

      if (filters?.fromDate) {
        queryBuilder.andWhere('sale.createdAt >= :fromDate', {
          fromDate: new Date(filters.fromDate),
        });
      }

      if (filters?.toDate) {
        queryBuilder.andWhere('sale.createdAt <= :toDate', {
          toDate: new Date(filters.toDate),
        });
      }

      return await queryBuilder
        .orderBy('sale.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to fetch sales: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findOne(id: string, user?: any): Promise<Sale> {
    try {
      const sale = await this.saleRepository.findOne({
        where: { id },
        relations: ['customer', 'seller', 'items', 'items.motorcycle', 'items.motorcycle.category'],
      });

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      // Verificar permisos según el rol del usuario
      if (user) {
        // Si es cliente, solo puede ver sus propias ventas
        if (user.role === UserRole.CUSTOMER && sale.customerId !== user.customerId) {
          throw new NotFoundException(`Sale with ID ${id} not found`);
        }
        
        // Si es vendedor, solo puede ver ventas que él ha realizado
        if (user.role === UserRole.SELLER && sale.sellerId !== user.id) {
          throw new NotFoundException(`Sale with ID ${id} not found`);
        }
      }

      return sale;
    } catch (error) {
      this.logger.error(`Failed to fetch sale ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async update(id: string, updateSaleDto: UpdateSaleDto, user?: any): Promise<Sale> {
    try {
      // Pasamos el usuario para verificar permisos
      const sale = await this.findOne(id, user);

      Object.assign(sale, updateSaleDto);

      if (updateSaleDto.deliveryDate) {
        sale.deliveryDate = new Date(updateSaleDto.deliveryDate);
      }

      const updatedSale = await this.saleRepository.save(sale);

      this.logger.log(`Sale updated with ID: ${id}`);
      return updatedSale;
    } catch (error) {
      this.logger.error(`Failed to update sale ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  
  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      const sale = await this.findOne(id);
      
      // Check if the sale can be deleted
      if (sale.status === SaleStatus.COMPLETED || sale.status === SaleStatus.REFUNDED) {
        throw new ConflictException(`Cannot delete sale with status ${sale.status}`);
      }
      
      // Soft delete - mark as cancelled and update database
      sale.status = SaleStatus.CANCELLED;
      sale.isDeleted = true;
      sale.cancelledAt = new Date();
      
      await queryRunner.manager.save(Sale, sale);
      
      // Release any reserved inventory (optional)
      // Logic to release inventory items would go here
      
      await queryRunner.commitTransaction();
      this.logger.log(`Sale with ID: ${id} has been deleted/cancelled`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to delete sale ${id}: ${getErrorMessage(error)}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addPayment(id: string, addPaymentDto: AddPaymentDto): Promise<Sale> {
    try {
      const sale = await this.findOne(id);

      if (sale.paidAmount + addPaymentDto.amount > sale.totalAmount) {
        throw new ConflictException('Payment amount exceeds remaining balance');
      }

      sale.paidAmount += addPaymentDto.amount;
      sale.paymentMethod = addPaymentDto.paymentMethod;

      // Update payment status
      if (sale.paidAmount >= sale.totalAmount) {
        sale.paymentStatus = PaymentStatus.PAID;
      } else if (sale.paidAmount > 0) {
        sale.paymentStatus = PaymentStatus.PARTIAL;
      }

      const updatedSale = await this.saleRepository.save(sale);

      this.logger.log(`Payment of ${addPaymentDto.amount} added to sale ${id}`);
      return updatedSale;
    } catch (error) {
      this.logger.error(`Failed to add payment to sale ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async cancel(id: string): Promise<Sale> {
    try {
      const sale = await this.findOne(id);

      if (sale.status === SaleStatus.COMPLETED) {
        throw new ConflictException('Cannot cancel a completed sale');
      }

      sale.status = SaleStatus.CANCELLED;
      const updatedSale = await this.saleRepository.save(sale);

      this.logger.log(`Sale cancelled with ID: ${id}`);
      return updatedSale;
    } catch (error) {
      this.logger.error(`Failed to cancel sale ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getSalesReport(filters?: {
    fromDate?: string;
    toDate?: string;
    sellerId?: string;
  }) {
    try {
      const queryBuilder = this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect('sale.seller', 'seller')
        .where('sale.status != :cancelledStatus', { cancelledStatus: SaleStatus.CANCELLED });

      if (filters?.fromDate) {
        queryBuilder.andWhere('sale.createdAt >= :fromDate', {
          fromDate: new Date(filters.fromDate),
        });
      }

      if (filters?.toDate) {
        queryBuilder.andWhere('sale.createdAt <= :toDate', {
          toDate: new Date(filters.toDate),
        });
      }

      if (filters?.sellerId) {
        queryBuilder.andWhere('sale.sellerId = :sellerId', {
          sellerId: filters.sellerId,
        });
      }

      const sales = await queryBuilder.getMany();

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const totalPaid = sales.reduce((sum, sale) => sum + Number(sale.paidAmount), 0);
      const pendingAmount = totalRevenue - totalPaid;

      return {
        totalSales,
        totalRevenue,
        totalPaid,
        pendingAmount,
        sales,
      };
    } catch (error) {
      this.logger.error(`Failed to generate sales report: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private async generateSaleNumber(): Promise<string> {
    const prefix = 'SALE';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastSale = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.saleNumber LIKE :pattern', { pattern: `${prefix}-${year}${month}%` })
      .orderBy('sale.saleNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.split('-')[1].slice(6));
      sequence = lastSequence + 1;
    }

    return `${prefix}-${year}${month}${String(sequence).padStart(4, '0')}`;
  }

  async findByCustomer(customerId: string, sellerId?: string): Promise<Sale[]> {
    try {
      const query: any = { customerId };
      
      // Si se proporciona un sellerId, filtramos también por vendedor
      if (sellerId) {
        query.sellerId = sellerId;
      }
      
      return await this.saleRepository.find({
        where: query,
        relations: ['customer', 'seller', 'items', 'items.motorcycle'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch sales for customer ${customerId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

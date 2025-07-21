import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, InventoryStatus } from './entities/inventory.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';
import { CreateInventoryDto, UpdateInventoryDto, RestockDto } from './dto/inventory.dto';
import { getErrorMessage } from '../common/types/error.types';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    try {
      // Verify motorcycle exists
      const motorcycle = await this.motorcycleRepository.findOne({
        where: { id: createInventoryDto.motorcycleId, isActive: true },
      });

      if (!motorcycle) {
        throw new NotFoundException(`Motorcycle with ID ${createInventoryDto.motorcycleId} not found`);
      }

      // Check if inventory already exists for this motorcycle
      const existingInventory = await this.inventoryRepository.findOne({
        where: { motorcycleId: createInventoryDto.motorcycleId },
      });

      if (existingInventory) {
        throw new ConflictException('Inventory already exists for this motorcycle');
      }

      const inventory = this.inventoryRepository.create({
        ...createInventoryDto,
        motorcycle,
      });

      const savedInventory = await this.inventoryRepository.save(inventory);
      this.logger.log(`Inventory created with ID: ${savedInventory.id}`);
      return savedInventory;
    } catch (error) {
      this.logger.error(`Failed to create inventory: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findAll(filters?: {
    status?: InventoryStatus;
    lowStock?: boolean;
    motorcycleId?: string;
  }): Promise<Inventory[]> {
    try {
      const queryBuilder = this.inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.motorcycle', 'motorcycle')
        .leftJoinAndSelect('motorcycle.category', 'category')
        .where('inventory.isActive = :isActive', { isActive: true });

      if (filters?.status) {
        queryBuilder.andWhere('inventory.status = :status', { status: filters.status });
      }

      if (filters?.motorcycleId) {
        queryBuilder.andWhere('inventory.motorcycleId = :motorcycleId', {
          motorcycleId: filters.motorcycleId,
        });
      }

      const results = await queryBuilder
        .orderBy('inventory.createdAt', 'DESC')
        .getMany();

      // Filter for low stock if requested
      if (filters?.lowStock) {
        return results.filter(item => item.isLowStock);
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch inventory: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Inventory> {
    try {
      const inventory = await this.inventoryRepository.findOne({
        where: { id, isActive: true },
        relations: ['motorcycle', 'motorcycle.category'],
      });

      if (!inventory) {
        throw new NotFoundException(`Inventory with ID ${id} not found`);
      }

      return inventory;
    } catch (error) {
      this.logger.error(`Failed to fetch inventory ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findByMotorcycle(motorcycleId: string): Promise<Inventory> {
    try {
      const inventory = await this.inventoryRepository.findOne({
        where: { motorcycleId, isActive: true },
        relations: ['motorcycle', 'motorcycle.category'],
      });

      if (!inventory) {
        throw new NotFoundException(`Inventory for motorcycle ID ${motorcycleId} not found`);
      }

      return inventory;
    } catch (error) {
      this.logger.error(`Failed to fetch inventory for motorcycle ${motorcycleId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    try {
      const inventory = await this.findOne(id);

      // Verify motorcycle exists if motorcycleId is being updated
      if (updateInventoryDto.motorcycleId) {
        const motorcycle = await this.motorcycleRepository.findOne({
          where: { id: updateInventoryDto.motorcycleId, isActive: true },
        });

        if (!motorcycle) {
          throw new NotFoundException(`Motorcycle with ID ${updateInventoryDto.motorcycleId} not found`);
        }
      }

      Object.assign(inventory, updateInventoryDto);
      
      // Update status based on quantity
      if (updateInventoryDto.quantity !== undefined) {
        if (updateInventoryDto.quantity === 0) {
          inventory.status = InventoryStatus.OUT_OF_STOCK;
        } else if (inventory.isLowStock) {
          inventory.status = InventoryStatus.IN_STOCK; // You might want to add LOW_STOCK status
        } else {
          inventory.status = InventoryStatus.IN_STOCK;
        }
      }

      const updatedInventory = await this.inventoryRepository.save(inventory);

      this.logger.log(`Inventory updated with ID: ${id}`);
      return updatedInventory;
    } catch (error) {
      this.logger.error(`Failed to update inventory ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async restock(id: string, restockDto: RestockDto): Promise<Inventory> {
    try {
      const inventory = await this.findOne(id);

      inventory.quantity += restockDto.quantity;
      inventory.costPrice = restockDto.costPrice;
      inventory.lastRestockDate = new Date();
      
      if (restockDto.supplier) {
        inventory.supplier = restockDto.supplier;
      }
      
      if (restockDto.notes) {
        inventory.notes = restockDto.notes;
      }

      // Update status
      inventory.status = InventoryStatus.IN_STOCK;

      const updatedInventory = await this.inventoryRepository.save(inventory);

      this.logger.log(`Inventory restocked with ${restockDto.quantity} units for ID: ${id}`);
      return updatedInventory;
    } catch (error) {
      this.logger.error(`Failed to restock inventory ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async reserve(id: string, quantity: number): Promise<Inventory> {
    try {
      const inventory = await this.findOne(id);

      if (inventory.availableQuantity < quantity) {
        throw new ConflictException('Insufficient available quantity for reservation');
      }

      inventory.reservedQuantity += quantity;
      
      if (inventory.availableQuantity === 0) {
        inventory.status = InventoryStatus.RESERVED;
      }

      const updatedInventory = await this.inventoryRepository.save(inventory);

      this.logger.log(`Reserved ${quantity} units for inventory ID: ${id}`);
      return updatedInventory;
    } catch (error) {
      this.logger.error(`Failed to reserve inventory ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async releaseReservation(id: string, quantity: number): Promise<Inventory> {
    try {
      const inventory = await this.findOne(id);

      if (inventory.reservedQuantity < quantity) {
        throw new ConflictException('Cannot release more than reserved quantity');
      }

      inventory.reservedQuantity -= quantity;
      
      if (inventory.quantity > 0) {
        inventory.status = InventoryStatus.IN_STOCK;
      }

      const updatedInventory = await this.inventoryRepository.save(inventory);

      this.logger.log(`Released ${quantity} reserved units for inventory ID: ${id}`);
      return updatedInventory;
    } catch (error) {
      this.logger.error(`Failed to release reservation for inventory ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getLowStockItems(): Promise<Inventory[]> {
    try {
      return await this.inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.motorcycle', 'motorcycle')
        .leftJoinAndSelect('motorcycle.category', 'category')
        .where('inventory.isActive = :isActive', { isActive: true })
        .andWhere('inventory.quantity <= inventory.minStockLevel')
        .orderBy('inventory.quantity', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to fetch low stock items: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const inventory = await this.findOne(id);
      inventory.isActive = false;
      await this.inventoryRepository.save(inventory);

      this.logger.log(`Inventory soft deleted with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete inventory ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

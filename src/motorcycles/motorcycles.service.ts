import { Injectable, NotFoundException, Logger, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Motorcycle, MotorcycleStatus } from './entities/motorcycle.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateMotorcycleDto, UpdateMotorcycleDto } from './dto/motorcycle.dto';
import { getErrorMessage } from '../common/types/error.types';
import { PriceHistoryService } from '../mongodb/service/price-history.service';
import { CloudinaryService } from '../upload/cloudinary.service';

@Injectable()
export class MotorcyclesService {
  private readonly logger = new Logger(MotorcyclesService.name);

  constructor(
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly priceHistoryService: PriceHistoryService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createMotorcycleDto: CreateMotorcycleDto, files?: Express.Multer.File[]): Promise<Motorcycle> {
    try {
      // Verify category exists
      const category = await this.categoryRepository.findOne({
        where: { id: createMotorcycleDto.categoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createMotorcycleDto.categoryId} not found`);
      }

      let imageUrls = createMotorcycleDto.imageUrls || [];
      if (files && files.length > 0) {
        for (const file of files) {
          const uploadedUrl = await this.cloudinaryService.uploadImage(file.buffer, 'motorcycles');
          imageUrls = [...imageUrls, uploadedUrl];
        }
      }
      const motorcycle = this.motorcycleRepository.create({
        ...createMotorcycleDto,
        imageUrls,
        category,
      });
      const savedMotorcycle = await this.motorcycleRepository.save(motorcycle);
      this.logger.log(`Motorcycle created with ID: ${savedMotorcycle.id}`);
      return savedMotorcycle;
    } catch (error) {
      this.logger.error(`Failed to create motorcycle: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findAll(filters?: {
    brand?: string;
    categoryId?: string;
    status?: MotorcycleStatus;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Motorcycle[]> {
    try {
      const queryBuilder = this.motorcycleRepository
        .createQueryBuilder('motorcycle')
        .leftJoinAndSelect('motorcycle.category', 'category')
        .where('motorcycle.isActive = :isActive', { isActive: true });

      if (filters?.brand) {
        queryBuilder.andWhere('LOWER(motorcycle.brand) LIKE LOWER(:brand)', {
          brand: `%${filters.brand}%`,
        });
      }

      if (filters?.categoryId) {
        queryBuilder.andWhere('motorcycle.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }

      if (filters?.status) {
        queryBuilder.andWhere('motorcycle.status = :status', {
          status: filters.status,
        });
      }

      if (filters?.minPrice) {
        queryBuilder.andWhere('motorcycle.price >= :minPrice', {
          minPrice: filters.minPrice,
        });
      }

      if (filters?.maxPrice) {
        queryBuilder.andWhere('motorcycle.price <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      }

      return await queryBuilder
        .orderBy('motorcycle.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to fetch motorcycles: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Motorcycle> {
    try {
      const motorcycle = await this.motorcycleRepository.findOne({
        where: { id, isActive: true },
        relations: ['category'],
      });

      if (!motorcycle) {
        throw new NotFoundException(`Motorcycle with ID ${id} not found`);
      }

      return motorcycle;
    } catch (error) {
      this.logger.error(`Failed to fetch motorcycle ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async update(id: string, updateMotorcycleDto: UpdateMotorcycleDto, userId?: string, files?: Express.Multer.File[]): Promise<Motorcycle> {
    try {
      const motorcycle = await this.findOne(id);

      // Verify category exists if categoryId is being updated
      if (updateMotorcycleDto.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: updateMotorcycleDto.categoryId, isActive: true },
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${updateMotorcycleDto.categoryId} not found`);
        }
      }

      // Registrar cambio de precio si el precio fue modificado
      if (updateMotorcycleDto.price && updateMotorcycleDto.price !== motorcycle.price) {
        try {
          await this.priceHistoryService.recordPriceChange({
            motorcycleId: motorcycle.id,
            brand: motorcycle.brand,
            model: motorcycle.model,
            year: motorcycle.year,
            previousPrice: motorcycle.price,
            newPrice: updateMotorcycleDto.price,
            changeReason: updateMotorcycleDto.priceChangeReason || 'price_update',
            updatedBy: userId || 'system',
            notes: updateMotorcycleDto.priceChangeNotes,
          });
          
          this.logger.log(`Price history recorded for motorcycle ${id}: ${motorcycle.price} -> ${updateMotorcycleDto.price}`);
        } catch (historyError) {
          this.logger.error(`Failed to record price history for motorcycle ${id}: ${getErrorMessage(historyError)}`);
          // No lanzamos el error para permitir que la actualización continúe incluso si el registro de historial falla
        }
      }

      // Si se suben nuevas imágenes, agregarlas al array
      if (files && files.length > 0) {
        for (const file of files) {
          const uploadedUrl = await this.cloudinaryService.uploadImage(file.buffer, 'motorcycles');
          if (Array.isArray(motorcycle.imageUrls)) {
            motorcycle.imageUrls.push(uploadedUrl);
          } else {
            motorcycle.imageUrls = [uploadedUrl];
          }
        }
      }
      Object.assign(motorcycle, updateMotorcycleDto);
      const updatedMotorcycle = await this.motorcycleRepository.save(motorcycle);
      this.logger.log(`Motorcycle updated with ID: ${id}`);
      return updatedMotorcycle;
    } catch (error) {
      this.logger.error(`Failed to update motorcycle ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async addImageUrl(id: string, imageUrl: string): Promise<Motorcycle> {
    try {
      const motorcycle = await this.findOne(id);
      
      // Inicializar el array si no existe
      if (!motorcycle.imageUrls) {
        motorcycle.imageUrls = [];
      }
      
      // Agregar la nueva URL si no existe ya
      if (!motorcycle.imageUrls.includes(imageUrl)) {
        motorcycle.imageUrls.push(imageUrl);
        await this.motorcycleRepository.save(motorcycle);
      }
      
      this.logger.log(`Image URL added to motorcycle ID: ${id}`);
      return motorcycle;
    } catch (error) {
      this.logger.error(`Failed to add image URL to motorcycle ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const motorcycle = await this.findOne(id);
      motorcycle.isActive = false;
      await this.motorcycleRepository.save(motorcycle);

      this.logger.log(`Motorcycle soft deleted with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete motorcycle ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async softDelete(id: string, isAdmin: boolean): Promise<Motorcycle> {
    try {
      const motorcycle = await this.findOne(id);
      
      // Verificar si la motocicleta tiene ventas asociadas
      // Solo verificamos esto para vendedores, los administradores pueden desactivar cualquier motocicleta
      if (!isAdmin) {
        const salesCount = await this.motorcycleRepository
          .createQueryBuilder('motorcycle')
          .leftJoin('sale_items', 'saleItems', 'saleItems.motorcycleId = motorcycle.id')
          .leftJoin('sales', 'sales', 'sales.id = saleItems.saleId')
          .where('motorcycle.id = :id', { id })
          .andWhere('sales.status != :canceledStatus', { canceledStatus: 'canceled' })
          .getCount();
          
        if (salesCount > 0) {
          throw new ConflictException(
            'No se puede desactivar esta motocicleta porque tiene ventas activas asociadas. Contacte a un administrador.',
          );
        }
      }
      
      motorcycle.isActive = false;
      const updatedMotorcycle = await this.motorcycleRepository.save(motorcycle);
      
      this.logger.log(`Motorcycle soft deleted with ID: ${id} by ${isAdmin ? 'ADMIN' : 'SELLER'}`);
      return updatedMotorcycle;
    } catch (error) {
      this.logger.error(`Failed to soft delete motorcycle ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  
  async getPriceHistory(id: string) {
    try {
      // Primero, verificar que la motocicleta existe
      await this.findOne(id);
      
      // Obtener el historial de precios desde el servicio de MongoDB
      return await this.priceHistoryService.getPriceHistoryByMotorcycleId(id);
    } catch (error) {
      this.logger.error(`Failed to get price history for motorcycle ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  
  async updateStatus(id: string, status: MotorcycleStatus): Promise<Motorcycle> {
    try {
      const motorcycle = await this.findOne(id);
      motorcycle.status = status;
      const updatedMotorcycle = await this.motorcycleRepository.save(motorcycle);

      this.logger.log(`Motorcycle status updated to ${status} for ID: ${id}`);
      return updatedMotorcycle;
    } catch (error) {
      this.logger.error(`Failed to update motorcycle status ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findByCategory(categoryId: string): Promise<Motorcycle[]> {
    try {
      return await this.motorcycleRepository.find({
        where: {
          categoryId,
          isActive: true,
          status: MotorcycleStatus.AVAILABLE,
        },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch motorcycles by category ${categoryId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFeaturedMotorcycles(): Promise<Motorcycle[]> {
    try {
      // Get motorcycles that are available and recently added (as featured)
      return await this.motorcycleRepository.find({
        where: {
          isActive: true,
          status: MotorcycleStatus.AVAILABLE,
        },
        relations: ['category'],
        order: { createdAt: 'DESC' },
        take: 8, // Limit to 8 featured motorcycles (most recent)
      });
    } catch (error) {
      this.logger.error(`Failed to fetch featured motorcycles: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

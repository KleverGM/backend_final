import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { CreateWishlistDto, WishlistResponseDto } from '../dto/wishlist.dto';
import { Customer } from '../entities/customer.entity';
import { Motorcycle } from '../../motorcycles/entities/motorcycle.entity';
import { getErrorMessage } from '../../common/types/error.types';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
  ) {}

  async addToWishlist(customerId: string, createWishlistDto: CreateWishlistDto): Promise<WishlistResponseDto> {
    try {
      // Verificar que el cliente existe
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, isActive: true },
      });
      
      if (!customer) {
        throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
      }

      // Verificar que la motocicleta existe
      const motorcycle = await this.motorcycleRepository.findOne({
        where: { id: createWishlistDto.motorcycleId, isActive: true },
      });
      
      if (!motorcycle) {
        throw new NotFoundException(`Motocicleta con ID ${createWishlistDto.motorcycleId} no encontrada`);
      }

      // Verificar si ya existe en la lista de deseos
      const existingItem = await this.wishlistRepository.findOne({
        where: {
          customerId: customerId,
          motorcycleId: createWishlistDto.motorcycleId,
        },
      });

      if (existingItem) {
        throw new ConflictException('Esta motocicleta ya está en tu lista de deseos');
      }

      // Crear nuevo item en la lista de deseos
      const wishlistItem = this.wishlistRepository.create({
        customerId,
        motorcycleId: createWishlistDto.motorcycleId,
      });

      const savedItem = await this.wishlistRepository.save(wishlistItem);
      this.logger.log(`Item agregado a la lista de deseos con ID: ${savedItem.id}`);
      
      return {
        ...savedItem,
        motorcycle: {
          id: motorcycle.id,
          brand: motorcycle.brand,
          model: motorcycle.model,
          year: motorcycle.year,
          price: motorcycle.price,
          imageUrls: motorcycle.imageUrls,
        },
      };
    } catch (error) {
      this.logger.error(`Error al agregar a la lista de deseos: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getWishlist(customerId: string): Promise<WishlistResponseDto[]> {
    try {
      // Verificar que el cliente existe
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, isActive: true },
      });
      
      if (!customer) {
        throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
      }

      const wishlistItems = await this.wishlistRepository.find({
        where: { customerId },
        relations: ['motorcycle'],
      });

      return wishlistItems.map(item => ({
        ...item,
        motorcycle: {
          id: item.motorcycle.id,
          brand: item.motorcycle.brand,
          model: item.motorcycle.model,
          year: item.motorcycle.year,
          price: item.motorcycle.price,
          imageUrls: item.motorcycle.imageUrls,
        },
      }));
    } catch (error) {
      this.logger.error(`Error al obtener lista de deseos: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async removeFromWishlist(customerId: string, wishlistItemId: string): Promise<void> {
    try {
      const wishlistItem = await this.wishlistRepository.findOne({
        where: { id: wishlistItemId, customerId },
      });

      if (!wishlistItem) {
        throw new NotFoundException(`Item de lista de deseos con ID ${wishlistItemId} no encontrado`);
      }

      await this.wishlistRepository.remove(wishlistItem);
      this.logger.log(`Item eliminado de la lista de deseos con ID: ${wishlistItemId}`);
    } catch (error) {
      this.logger.error(`Error al eliminar de la lista de deseos: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

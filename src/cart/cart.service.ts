import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart.entity';
import { AddToCartDto, UpdateCartItemDto, CartSummaryDto } from './dto/cart.dto';
import { MotorcyclesService } from '../motorcycles/motorcycles.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @Inject(forwardRef(() => MotorcyclesService))
    private motorcyclesService: MotorcyclesService,
  ) {}

  async addToCart(customerId: string, addToCartDto: AddToCartDto): Promise<CartItem> {
    try {
      // Verificar si el item ya existe en el carrito
      const existingItem = await this.cartRepository.findOne({
        where: {
          customerId,
          motorcycleId: addToCartDto.motorcycleId,
          isActive: true,
        },
        relations: ['motorcycle'],
      });

      if (existingItem) {
        // Obtener el precio actualizado de la motocicleta
        const motorcycle = await this.motorcyclesService.findOne(addToCartDto.motorcycleId);
        let unitPrice: number;
        if (typeof motorcycle.price === 'string') {
          unitPrice = parseFloat(motorcycle.price);
        } else {
          unitPrice = motorcycle.price;
        }
        if (!motorcycle || motorcycle.price === null || motorcycle.price === undefined || isNaN(unitPrice)) {
          throw new NotFoundException('Motocicleta no encontrada o precio inválido');
        }
        existingItem.unitPrice = unitPrice;
        existingItem.quantity += addToCartDto.quantity;
        existingItem.totalPrice = unitPrice * existingItem.quantity;
        existingItem.notes = addToCartDto.notes || existingItem.notes;
        return await this.cartRepository.save(existingItem);
      }

      // Obtener el precio real de la motocicleta
      const motorcycle = await this.motorcyclesService.findOne(addToCartDto.motorcycleId);
      let unitPrice: number;
      if (typeof motorcycle.price === 'string') {
        unitPrice = parseFloat(motorcycle.price);
      } else {
        unitPrice = motorcycle.price;
      }
      if (!motorcycle || motorcycle.price === null || motorcycle.price === undefined || isNaN(unitPrice)) {
        throw new NotFoundException('Motocicleta no encontrada o precio inválido');
      }

      const cartItem = this.cartRepository.create({
        customerId,
        motorcycleId: addToCartDto.motorcycleId,
        quantity: addToCartDto.quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * addToCartDto.quantity,
        notes: addToCartDto.notes,
      });

      return await this.cartRepository.save(cartItem);
    } catch (error) {
      this.logger.error(`Error adding to cart: ${error.message}`);
      throw new BadRequestException('Error adding item to cart');
    }
  }

  async getCart(customerId: string): Promise<CartSummaryDto> {
    try {
      const cartItems = await this.cartRepository.find({
        where: { customerId, isActive: true },
        relations: ['motorcycle'],
        order: { createdAt: 'DESC' },
      });

      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

      return {
        totalItems,
        totalPrice,
        items: cartItems.map(item => ({
          id: item.id,
          motorcycleId: item.motorcycleId,
          motorcycle: {
            id: item.motorcycle.id,
            brand: item.motorcycle.brand,
            model: item.motorcycle.model,
            year: item.motorcycle.year,
            price: item.motorcycle.price,
            imageUrl: item.motorcycle.imageUrls?.[0] || null,
            inStock: item.motorcycle.status === 'available',
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
          createdAt: item.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting cart: ${error.message}`);
      throw error;
    }
  }

  async updateCartItem(
    customerId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItem> {
    try {
      const cartItem = await this.cartRepository.findOne({
        where: { id: itemId, customerId, isActive: true },
      });
      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }
      if (updateCartItemDto.quantity !== undefined) {
        // Obtener el precio actualizado de la motocicleta
        const motorcycle = await this.motorcyclesService.findOne(cartItem.motorcycleId);
        let unitPrice: number;
        if (typeof motorcycle.price === 'string') {
          unitPrice = parseFloat(motorcycle.price);
        } else {
          unitPrice = motorcycle.price;
        }
        if (!motorcycle || motorcycle.price === null || motorcycle.price === undefined || isNaN(unitPrice)) {
          throw new NotFoundException('Motocicleta no encontrada o precio inválido');
        }
        cartItem.unitPrice = unitPrice;
        cartItem.quantity = updateCartItemDto.quantity;
        cartItem.totalPrice = unitPrice * cartItem.quantity;
      }
      if (updateCartItemDto.notes !== undefined) {
        cartItem.notes = updateCartItemDto.notes;
      }
      return await this.cartRepository.save(cartItem);
    } catch (error) {
      this.logger.error(`Error updating cart item: ${error.message}`);
      throw error;
    }
  }

  async removeFromCart(customerId: string, itemId: string): Promise<void> {
    try {
      const cartItem = await this.cartRepository.findOne({
        where: { id: itemId, customerId, isActive: true },
      });

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      cartItem.isActive = false;
      await this.cartRepository.save(cartItem);
    } catch (error) {
      this.logger.error(`Error removing from cart: ${error.message}`);
      throw error;
    }
  }

  async clearCart(customerId: string): Promise<void> {
    try {
      await this.cartRepository.update(
        { customerId, isActive: true },
        { isActive: false },
      );
    } catch (error) {
      this.logger.error(`Error clearing cart: ${error.message}`);
      throw error;
    }
  }

  async getCartItemCount(customerId: string): Promise<number> {
    try {
      const result = await this.cartRepository
        .createQueryBuilder('cart')
        .select('SUM(cart.quantity)', 'total')
        .where('cart.customerId = :customerId', { customerId })
        .andWhere('cart.isActive = :isActive', { isActive: true })
        .getRawOne();

      return parseInt(result?.total) || 0;
    } catch (error) {
      this.logger.error(`Error getting cart count: ${error.message}`);
      return 0;
    }
  }

  async getAllCarts(active: boolean = true, limit: number = 10, page: number = 1): Promise<{ data: CartSummaryDto[], total: number, page: number, limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // Obtenemos el total de registros para la paginación
      const total = await this.cartRepository
        .createQueryBuilder('cart')
        .where('cart.isActive = :isActive', { isActive: active })
        .getCount();
      
      // Agrupamos los items por customerId para obtener los carritos
      const cartGroups = await this.cartRepository
        .createQueryBuilder('cart')
        .select('cart.customerId')
        .addSelect('COUNT(cart.id)', 'itemCount')
        .addSelect('SUM(cart.totalPrice)', 'total')
        .where('cart.isActive = :isActive', { isActive: active })
        .groupBy('cart.customerId')
        .orderBy('MAX(cart.updatedAt)', 'DESC')
        .limit(limit)
        .offset(skip)
        .getRawMany();
      
      // Para cada grupo (carrito), obtenemos los detalles
      const cartSummaries: CartSummaryDto[] = [];
      
      for (const group of cartGroups) {
        const cartItems = await this.cartRepository.find({
          where: {
            customerId: group.customerId,
            isActive: active,
          },
          relations: ['motorcycle'],
        });
        
        if (cartItems.length > 0) {
          cartSummaries.push(this.mapToCartSummary(cartItems));
        }
      }
      
      return {
        data: cartSummaries,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(`Error getting all carts: ${error.message}`);
      throw new BadRequestException(`Error retrieving carts: ${error.message}`);
    }
  }
  
  // Método auxiliar para mapear los items a un CartSummaryDto
  private mapToCartSummary(cartItems: CartItem[]): CartSummaryDto {
    const firstItem = cartItems[0];
    const customerId = firstItem.customerId;
    
    const items = cartItems.map(item => ({
      id: item.id,
      motorcycleId: item.motorcycleId,
      motorcycle: {
        id: item.motorcycle?.id || item.motorcycleId,
        brand: item.motorcycle?.brand || 'Unknown',
        model: item.motorcycle?.model || 'Unknown',
        year: item.motorcycle?.year || new Date().getFullYear(),
        price: item.unitPrice,
        imageUrl: item.motorcycle?.imageUrls?.[0] || null,
        inStock: item.motorcycle?.status === 'available'
      },
      quantity: item.quantity,
      unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
      totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice,
      notes: item.notes,
      createdAt: item.createdAt
    }));
    
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return {
      totalItems,
      totalPrice,
      items,
      customerId,
      itemCount: items.length,
      updatedAt: firstItem.updatedAt
    };
  }
}

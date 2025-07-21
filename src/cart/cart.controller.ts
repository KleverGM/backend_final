import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartSummaryDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Carrito de compras')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir producto al carrito (solo cliente)' })
  @ApiResponse({ status: 201, description: 'Producto añadido al carrito' })
  async addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto,
  ) {
    const customerId = req.user.customerId || req.user.id;
    return await this.cartService.addToCart(customerId, addToCartDto);
  }

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener carrito del cliente actual' })
  @ApiResponse({ status: 200, description: 'Carrito recuperado correctamente' })
  async getCart(@Request() req): Promise<CartSummaryDto> {
    const customerId = req.user.customerId || req.user.id;
    return await this.cartService.getCart(customerId);
  }

  @Get('count')
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener cantidad de productos en el carrito' })
  @ApiResponse({ status: 200, description: 'Cantidad recuperada correctamente' })
  async getCartCount(@Request() req): Promise<{ count: number }> {
    const customerId = req.user.customerId || req.user.id;
    const count = await this.cartService.getCartItemCount(customerId);
    return { count };
  }

  @Put(':itemId')
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar item del carrito' })
  @ApiResponse({ status: 200, description: 'Item actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  async updateCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const customerId = req.user.customerId || req.user.id;
    return await this.cartService.updateCartItem(customerId, itemId, updateCartItemDto);
  }

  @Delete(':itemId')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  @ApiResponse({ status: 204, description: 'Item eliminado correctamente' })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  async removeFromCart(
    @Request() req,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    const customerId = req.user.customerId || req.user.id;
    await this.cartService.removeFromCart(customerId, itemId);
  }

  @Delete()
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vaciar el carrito completo' })
  @ApiResponse({ status: 204, description: 'Carrito vaciado correctamente' })
  async clearCart(@Request() req): Promise<void> {
    const customerId = req.user.customerId || req.user.id;
    await this.cartService.clearCart(customerId);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los carritos (solo admin)' })
  @ApiResponse({ status: 200, description: 'Carritos recuperados correctamente' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de resultados' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página de resultados' })
  async getAllCarts(
    @Query('active') active: boolean = true,
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1
  ) {
    return await this.cartService.getAllCarts(active, limit, page);
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener carrito de un cliente específico (solo admin)' })
  @ApiResponse({ status: 200, description: 'Carrito recuperado correctamente' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado' })
  async getCustomerCart(
    @Param('customerId') customerId: string
  ): Promise<CartSummaryDto> {
    return await this.cartService.getCart(customerId);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { WishlistService } from '../services/wishlist.service';
import { CreateWishlistDto } from '../dto/wishlist.dto';
import { RequestWithUser } from '../../common/interfaces/auth.interfaces';

@ApiTags('Wishlists')
@Controller('customers/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar motocicleta a la lista de deseos' })
  @ApiResponse({ status: 201, description: 'Motocicleta agregada exitosamente' })
  @ApiResponse({ status: 409, description: 'La motocicleta ya está en la lista de deseos' })
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(@Body() createWishlistDto: CreateWishlistDto, @Request() req: RequestWithUser) {
    if (!req.user || !req.user.customerId) {
      throw new ForbiddenException('Usuario no tiene perfil de cliente');
    }
    const wishlistItem = await this.wishlistService.addToWishlist(req.user.customerId, createWishlistDto);
    return {
      message: 'Motocicleta agregada a tu lista de deseos',
      data: wishlistItem,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la lista de deseos del cliente' })
  @ApiResponse({ status: 200, description: 'Lista de deseos recuperada exitosamente' })
  async getWishlist(@Request() req: RequestWithUser) {
    if (!req.user || !req.user.customerId) {
      throw new ForbiddenException('Usuario no tiene perfil de cliente');
    }
    
    const wishlist = await this.wishlistService.getWishlist(req.user.customerId);
    return {
      message: 'Lista de deseos recuperada exitosamente',
      data: wishlist,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar motocicleta de la lista de deseos' })
  @ApiResponse({ status: 200, description: 'Motocicleta eliminada de la lista de deseos' })
  @HttpCode(HttpStatus.OK)
  async removeFromWishlist(@Param('id') id: string, @Request() req: RequestWithUser) {
    if (!req.user || !req.user.customerId) {
      throw new ForbiddenException('Usuario no tiene perfil de cliente');
    }
    
    await this.wishlistService.removeFromWishlist(req.user.customerId, id);
    return {
      message: 'Motocicleta eliminada de tu lista de deseos',
    };
  }
}

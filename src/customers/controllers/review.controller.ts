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
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';
import { RequestWithUser } from '../../common/interfaces/auth.interfaces';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva reseña' })
  @ApiResponse({ status: 201, description: 'Reseña creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya has escrito una reseña para esta motocicleta' })
  @HttpCode(HttpStatus.CREATED)
  async createReview(@Body() createReviewDto: CreateReviewDto, @Request() req: RequestWithUser) {
    if (!req.user || !req.user.customerId) {
      throw new BadRequestException('Usuario no tiene perfil de cliente');
    }
    
    const review = await this.reviewService.createReview(
      req.user.customerId, 
      createReviewDto
    );
    
    return {
      message: 'Reseña creada exitosamente',
      data: review,
    };
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis reseñas' })
  @ApiResponse({ status: 200, description: 'Reseñas recuperadas exitosamente' })
  async getMyReviews(@Request() req: RequestWithUser) {
    if (!req.user || !req.user.customerId) {
      throw new BadRequestException('Usuario no tiene perfil de cliente');
    }
    
    const reviews = await this.reviewService.getCustomerReviews(req.user.customerId);
    
    return {
      message: 'Reseñas recuperadas exitosamente',
      data: reviews,
    };
  }

  @Get('motorcycle/:motorcycleId')
  @ApiOperation({ summary: 'Obtener reseñas de una motocicleta específica' })
  @ApiResponse({ status: 200, description: 'Reseñas recuperadas exitosamente' })
  async getMotorcycleReviews(@Param('motorcycleId') motorcycleId: string) {
    const reviews = await this.reviewService.getMotorcycleReviews(motorcycleId);
    
    return {
      message: 'Reseñas recuperadas exitosamente',
      data: reviews,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una reseña' })
  @ApiResponse({ status: 200, description: 'Reseña actualizada exitosamente' })
  async updateReview(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req: RequestWithUser
  ) {
    if (!req.user || !req.user.customerId) {
      throw new BadRequestException('Usuario no tiene perfil de cliente');
    }
    
    const review = await this.reviewService.updateReview(
      req.user.customerId,
      id,
      updateReviewDto
    );
    
    return {
      message: 'Reseña actualizada exitosamente',
      data: review,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una reseña' })
  @ApiResponse({ status: 200, description: 'Reseña eliminada exitosamente' })
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Param('id') id: string, @Request() req: RequestWithUser) {
    if (!req.user || !req.user.customerId) {
      throw new BadRequestException('Usuario no tiene perfil de cliente');
    }
    
    await this.reviewService.deleteReview(req.user.customerId, id);
    
    return {
      message: 'Reseña eliminada exitosamente',
    };
  }
}

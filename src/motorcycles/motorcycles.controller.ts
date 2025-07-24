
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
  Request,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MotorcyclesService } from './motorcycles.service';
import { CreateMotorcycleDto, UpdateMotorcycleDto } from './dto/motorcycle.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { MotorcycleStatus } from './entities/motorcycle.entity';
import { RequestWithUser } from '../common/interfaces/auth.interfaces';
import { CloudinaryService } from '../upload/cloudinary.service';
import { Express } from 'express';

@ApiTags('Motorcycles')
@Controller('motorcycles')
export class MotorcyclesController {
  constructor(
    private readonly motorcyclesService: MotorcyclesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  /**
   * Subir imagen de moto a Cloudinary 
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMotorcycleImage(
    @UploadedFile() file: any,
  ) {
    if (!file) {
      return { message: 'No se proporcionó archivo', data: null };
    }
    const imageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'motorcycles');
    return {
      message: 'Imagen de moto subida correctamente',
      url: imageUrl,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new motorcycle (Admin/Seller only)' })
  @ApiResponse({ status: 201, description: 'Motorcycle created successfully' })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: any,
    @Body() createMotorcycleDto: CreateMotorcycleDto
  ) {
    const motorcycle = await this.motorcyclesService.create(createMotorcycleDto, file);
    return {
      message: 'Motorcycle created successfully',
      data: motorcycle,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all motorcycles (Public access)' })
  @ApiResponse({ status: 200, description: 'Motorcycles retrieved successfully' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filter by brand' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'status', required: false, enum: MotorcycleStatus, description: 'Filter by status' })
  async findAll(
    @Query('brand') brand?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('status') status?: MotorcycleStatus,
  ) {
    const filters = { brand, categoryId, minPrice, maxPrice, status };
    const motorcycles = await this.motorcyclesService.findAll(filters);
    return {
      message: 'Motorcycles retrieved successfully',
      data: motorcycles,
    };
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured motorcycles' })
  @ApiResponse({ status: 200, description: 'Featured motorcycles retrieved successfully' })
  async getFeatured() {
    const motorcycles = await this.motorcyclesService.getFeaturedMotorcycles();
    return {
      message: 'Featured motorcycles retrieved successfully',
      data: motorcycles,
    };
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get motorcycles by category' })
  @ApiResponse({ status: 200, description: 'Motorcycles by category retrieved successfully' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    const motorcycles = await this.motorcyclesService.findByCategory(categoryId);
    return {
      message: 'Motorcycles by category retrieved successfully',
      data: motorcycles,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get motorcycle by ID' })
  @ApiResponse({ status: 200, description: 'Motorcycle retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const motorcycle = await this.motorcyclesService.findOne(id);
    return {
      message: 'Motorcycle retrieved successfully',
      data: motorcycle,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update motorcycle (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Motorcycle updated successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() updateMotorcycleDto: UpdateMotorcycleDto,
    @Request() req: RequestWithUser,
  ) {
    // Log para depuración: mostrar el valor recibido de categoryId
    console.log('PATCH /motorcycles/:id categoryId recibido:', updateMotorcycleDto.categoryId);
    const motorcycle = await this.motorcyclesService.update(id, updateMotorcycleDto, req.user.id, file);
    return {
      message: 'Motorcycle updated successfully',
      data: motorcycle,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete motorcycle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Motorcycle deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.motorcyclesService.remove(id);
    return {
      message: 'Motorcycle deleted successfully',
    };
  }
  
  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete/deactivate motorcycle (Admin/Seller)' })
  @ApiResponse({ status: 200, description: 'Motorcycle deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot deactivate motorcycle with active sales' })
  async softDelete(@Param('id') id: string, @Request() req: RequestWithUser) {
    const motorcycle = await this.motorcyclesService.softDelete(id, req.user.role === UserRole.ADMIN);
    return {
      message: 'Motorcycle deactivated successfully',
      data: motorcycle,
    };
  }

  @Get(':id/price-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get motorcycle price history (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Motorcycle price history retrieved successfully' })
  async getPriceHistory(@Param('id') id: string) {
    const priceHistory = await this.motorcyclesService.getPriceHistory(id);
    return {
      message: 'Motorcycle price history retrieved successfully',
      data: priceHistory,
    };
  }
}


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
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';
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
   * Subir imagen de moto a Cloudinary y devolver la URL
   */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseInterceptors(AnyFilesInterceptor())
  async uploadMotorcycleImage(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      return { message: 'No se proporcionó archivo', data: null };
    }
    // Subir todas las imágenes y devolver las URLs
    const urls: string[] = [];
    for (const file of files) {
      const imageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'motorcycles');
      urls.push(imageUrl);
    }
    return {
      message: 'Imágenes de moto subidas correctamente',
      urls,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new motorcycle (Admin/Seller only)' })
  @ApiResponse({ status: 201, description: 'Motorcycle created successfully' })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('file'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createMotorcycleDto: CreateMotorcycleDto
  ) {
    const motorcycle = await this.motorcyclesService.create(createMotorcycleDto, files);
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
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateMotorcycleDto: UpdateMotorcycleDto,
    @Request() req: RequestWithUser,
  ) {
    // Log body crudo recibido
    console.log('PATCH /motorcycles/:id BODY CRUDO:', req.body);
    if (req.body) {
      console.log('PATCH /motorcycles/:id features:', req.body.features);
      console.log('PATCH /motorcycles/:id imageUrls:', req.body.imageUrls);
    } else {
      console.log('PATCH /motorcycles/:id features: req.body es undefined');
      console.log('PATCH /motorcycles/:id imageUrls: req.body es undefined');
    }
    // Transformar manualmente los campos que lo requieran
    const transformedDto: any = { ...req.body };
    // Números
    if (transformedDto.year) transformedDto.year = Number(transformedDto.year);
    if (transformedDto.price) transformedDto.price = Number(transformedDto.price);
    if (transformedDto.displacement) transformedDto.displacement = Number(transformedDto.displacement);
    if (transformedDto.power) transformedDto.power = Number(transformedDto.power);
    if (transformedDto.mileage) transformedDto.mileage = Number(transformedDto.mileage);
    // Booleanos
    if (transformedDto.isActive !== undefined) transformedDto.isActive = transformedDto.isActive === 'true' || transformedDto.isActive === true;
    // Arrays (features, imageUrls)
    if (typeof transformedDto.features === 'string') {
      try { transformedDto.features = JSON.parse(transformedDto.features); } catch { transformedDto.features = [transformedDto.features]; }
    }
    if (typeof transformedDto.imageUrls === 'string') {
      try { transformedDto.imageUrls = JSON.parse(transformedDto.imageUrls); } catch { transformedDto.imageUrls = [transformedDto.imageUrls]; }
    }
    // Enums: fuelType, transmission, status (se quedan como string, el DTO los valida)
    // UUID: categoryId (se queda como string)
    // Log body transformado
    console.log('PATCH /motorcycles/:id BODY TRANSFORMADO:', transformedDto);
    console.log('PATCH /motorcycles/:id FILES recibidos:', files);
    // Puedes pasar el array completo de files al service si quieres manejar varias imágenes
    const motorcycle = await this.motorcyclesService.update(id, transformedDto, req.user.id, files);
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

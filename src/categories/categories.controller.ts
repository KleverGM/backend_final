import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CloudinaryService } from '../upload/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  @Patch(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir o agregar imagen a la categoría (Admin)' })
  @ApiResponse({ status: 200, description: 'Imagen de categoría actualizada correctamente' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCategoryImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'No se proporcionó archivo', data: null };
    }
    // Subir imagen a Cloudinary
    const imageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'categories');
    // Obtener la categoría actual
    const categoryActual = await this.categoriesService.findOne(id);
    // Acumular la nueva imagen en el array
    const nuevasImagenes = Array.isArray(categoryActual.imageUrls)
      ? [...categoryActual.imageUrls, imageUrl]
      : [imageUrl];
    // Actualizar categoría
    const category = await this.categoriesService.update(id, { imageUrls: nuevasImagenes });
    return {
      message: 'Imagen de categoría actualizada correctamente',
      data: category,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createCategoryDto: CreateCategoryDto
  ) {
    const category = await this.categoriesService.create(createCategoryDto, file);
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories (Public access)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Get(':id/motorcycles')
  @ApiOperation({ summary: 'Get motorcycles by category' })
  @ApiResponse({ status: 200, description: 'Motorcycles retrieved successfully' })
  async getMotorcyclesByCategory(@Param('id') id: string) {
    const motorcycles = await this.categoriesService.getMotorcyclesByCategory(id);
    return {
      message: 'Motorcycles by category retrieved successfully',
      data: motorcycles,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto, file);
    return {
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return {
      message: 'Category deleted successfully',
    };
  }
}

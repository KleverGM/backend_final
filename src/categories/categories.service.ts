import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CloudinaryService } from '../upload/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { getErrorMessage } from '../common/types/error.types';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, file?: Express.Multer.File): Promise<Category> {
    try {
      let imageUrls = createCategoryDto.imageUrls || [];
      if (file) {
        const uploadedUrl = await this.cloudinaryService.uploadImage(file.buffer, 'categories');
        imageUrls = [...imageUrls, uploadedUrl];
      }
      const category = this.categoryRepository.create({ ...createCategoryDto, imageUrls });
      return await this.categoryRepository.save(category);
    } catch (error) {
      this.logger.error(`Failed to create category: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id, isActive: true },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      this.logger.error(`Failed to find category ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getMotorcyclesByCategory(id: string): Promise<Motorcycle[]> {
    try {
      // First verify the category exists
      await this.findOne(id);

      return await this.motorcycleRepository.find({
        where: { 
          categoryId: id, 
          isActive: true 
        },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch motorcycles for category ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, file?: Express.Multer.File): Promise<Category> {
    try {
      const category = await this.findOne(id);
      let imageUrls = Array.isArray(category.imageUrls) ? [...category.imageUrls] : [];
      if (Array.isArray(updateCategoryDto.imageUrls)) {
        imageUrls = updateCategoryDto.imageUrls;
      }
      if (file) {
        const uploadedUrl = await this.cloudinaryService.uploadImage(file.buffer, 'categories');
        imageUrls.push(uploadedUrl);
      }
      Object.assign(category, updateCategoryDto);
      category.imageUrls = imageUrls;
      return await this.categoryRepository.save(category);
    } catch (error) {
      this.logger.error(`Failed to update category ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const category = await this.findOne(id);
      
      // Check if there are motorcycles using this category
      const motorcycleCount = await this.motorcycleRepository.count({
        where: { categoryId: id, isActive: true },
      });

      if (motorcycleCount > 0) {
        // Soft delete by marking as inactive
        category.isActive = false;
        await this.categoryRepository.save(category);
      } else {
        // Hard delete if no motorcycles are using this category
        await this.categoryRepository.remove(category);
      }
    } catch (error) {
      this.logger.error(`Failed to remove category ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

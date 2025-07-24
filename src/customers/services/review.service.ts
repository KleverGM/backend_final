import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto, UpdateReviewDto, ReviewResponseDto } from '../dto/review.dto';
import { Customer } from '../entities/customer.entity';
import { Motorcycle } from '../../motorcycles/entities/motorcycle.entity';
import { getErrorMessage } from '../../common/types/error.types';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
  ) {}

  async createReview(customerId: string, createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
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
        where: { id: createReviewDto.motorcycleId, isActive: true },
      });
      
      if (!motorcycle) {
        throw new NotFoundException(`Motocicleta con ID ${createReviewDto.motorcycleId} no encontrada`);
      }

      // Verificar si el cliente ya ha escrito una reseña para esta motocicleta
      const existingReview = await this.reviewRepository.findOne({
        where: {
          customerId,
          motorcycleId: createReviewDto.motorcycleId,
          isActive: true,
        },
      });

      if (existingReview) {
        throw new ConflictException('Ya has escrito una reseña para esta motocicleta');
      }

      // Crear nueva reseña
      const review = this.reviewRepository.create({
        customerId,
        motorcycleId: createReviewDto.motorcycleId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      });

      const savedReview = await this.reviewRepository.save(review);
      this.logger.log(`Reseña creada con ID: ${savedReview.id}`);
      
      return {
        id: savedReview.id,
        customerId: savedReview.customerId,
        motorcycleId: savedReview.motorcycleId,
        rating: savedReview.rating,
        comment: savedReview.comment,
        createdAt: savedReview.createdAt instanceof Date ? savedReview.createdAt.toISOString() : String(savedReview.createdAt),
      };
    } catch (error) {
      this.logger.error(`Error al crear reseña: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateReview(
    customerId: string, 
    reviewId: string, 
    updateReviewDto: UpdateReviewDto
  ): Promise<ReviewResponseDto> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId, customerId, isActive: true },
        relations: ['customer', 'motorcycle'],
      });

      if (!review) {
        throw new NotFoundException(`Reseña con ID ${reviewId} no encontrada`);
      }

      // Actualizar campos
      if (updateReviewDto.rating !== undefined) {
        review.rating = updateReviewDto.rating;
      }
      if (updateReviewDto.comment !== undefined) {
        review.comment = updateReviewDto.comment;
      }

      const updatedReview = await this.reviewRepository.save(review);
      this.logger.log(`Reseña actualizada con ID: ${reviewId}`);
      
      return {
        id: updatedReview.id,
        customerId: updatedReview.customerId,
        motorcycleId: updatedReview.motorcycleId,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt instanceof Date ? updatedReview.createdAt.toISOString() : String(updatedReview.createdAt),
      };
    } catch (error) {
      this.logger.error(`Error al actualizar reseña: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async deleteReview(customerId: string, reviewId: string): Promise<void> {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId, customerId, isActive: true },
      });

      if (!review) {
        throw new NotFoundException(`Reseña con ID ${reviewId} no encontrada`);
      }

      // Soft delete
      review.isActive = false;
      await this.reviewRepository.save(review);
      
      this.logger.log(`Reseña eliminada con ID: ${reviewId}`);
    } catch (error) {
      this.logger.error(`Error al eliminar reseña: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getCustomerReviews(customerId: string): Promise<ReviewResponseDto[]> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, isActive: true },
      });
      
      if (!customer) {
        throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
      }

      const reviews = await this.reviewRepository.find({
        where: { customerId, isActive: true },
        relations: ['motorcycle'],
        order: { createdAt: 'DESC' },
      });

      return reviews.map(review => ({
        id: review.id,
        customerId: review.customerId,
        motorcycleId: review.motorcycleId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
      }));
    } catch (error) {
      this.logger.error(`Error al obtener reseñas: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getMotorcycleReviews(motorcycleId: string): Promise<ReviewResponseDto[]> {
    try {
      const motorcycle = await this.motorcycleRepository.findOne({
        where: { id: motorcycleId, isActive: true },
      });
      
      if (!motorcycle) {
        throw new NotFoundException(`Motocicleta con ID ${motorcycleId} no encontrada`);
      }

      const reviews = await this.reviewRepository.find({
        where: { motorcycleId, isActive: true },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });

      return reviews.map(review => ({
        id: review.id,
        customerId: review.customerId,
        motorcycleId: review.motorcycleId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
      }));
    } catch (error) {
      this.logger.error(`Error al obtener reseñas de motocicleta: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

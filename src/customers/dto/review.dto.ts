import { IsUUID, IsNumber, IsString, IsOptional, Min, Max, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID de la motocicleta a reseñar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  motorcycleId: string;

  @ApiProperty({
    description: 'Calificación del 1 al 5',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Comentario de la reseña',
    example: 'Excelente motocicleta, muy cómoda y potente.'
  })
  @IsString()
  @Length(5, 1000)
  comment: string;
}

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Calificación del 1 al 5',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'Comentario de la reseña',
    example: 'Excelente motocicleta, muy cómoda y potente.'
  })
  @IsString()
  @Length(5, 1000)
  @IsOptional()
  comment?: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  motorcycleId: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;
  
  @ApiProperty()
  updatedAt: Date;
  
  @ApiProperty()
  customer?: any;
  
  @ApiProperty()
  motorcycle?: any;
}

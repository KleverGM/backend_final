import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCategoryDto {
  @ApiProperty({ 
    example: 'Sport', 
    description: 'Category name' 
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ 
    example: 'High performance motorcycles for racing and sport riding', 
    description: 'Category description',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Whether the category is active',
    default: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/categorias/sport1.jpg',
      'https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/categorias/sport2.jpg'
    ],
    description: 'URLs de las imágenes de la categoría',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  motorcycleCount?: number;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/categorias/sport1.jpg',
      'https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/categorias/sport2.jpg'
    ],
    description: 'URLs de las imágenes de la categoría',
    required: false,
    type: [String],
  })
  imageUrls?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsArray, IsUrl, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { FuelType, TransmissionType, MotorcycleStatus } from '../entities/motorcycle.entity';
import { PickType } from '@nestjs/mapped-types';

export class UpdateMotorcycleDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  engine?: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Type(() => Number)
  displacement?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  power?: number;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  mileage?: number;

  @IsOptional()
  @IsEnum(MotorcycleStatus)
  status?: MotorcycleStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  
  @IsOptional()
  @IsString()
  priceChangeReason?: string;
  
  @IsOptional()
  @IsString()
  priceChangeNotes?: string;
}

export class CreateMotorcycleDto extends PickType(UpdateMotorcycleDto, [
  'brand',
  'model',
  'year',
  'price',
  'engine',
  'displacement',
  'power',
  'fuelType',
  'transmission',
  'color',
  'mileage',
  'categoryId',
] as const) {}

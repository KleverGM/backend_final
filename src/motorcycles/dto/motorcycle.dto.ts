import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import {
  MotorcycleStatus,
  FuelType,
  TransmissionType,
} from '../entities/motorcycle.entity';

export class CreateMotorcycleDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsString()
  engine: string;

  @IsNumber()
  @Min(50)
  displacement: number;

  @IsNumber()
  @Min(0)
  power: number;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @IsString()
  color: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
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

  @IsUUID()
  categoryId: string;
}

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
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
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
  displacement?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
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


import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  IsBoolean,
} from 'class-validator';
import { InventoryStatus } from '../entities/inventory.entity';

// DTO para reabastecimiento de inventario

export class RestockDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  set quantity(val: any) { this._quantity = cleanNumber(val); }
  get quantity(): number { return this._quantity; }
  private _quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  set costPrice(val: any) { this._costPrice = cleanNumber(val); }
  get costPrice(): number { return this._costPrice; }
  private _costPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Utilidad para limpiar números: solo dígitos
export function cleanNumber(val: any) {
  if (val === undefined || val === null) return val;
  const digits = String(val).replace(/\D/g, '');
  return digits === '' ? undefined : Number(digits);
}

export class CreateInventoryDto {
  @IsString()
  sku: string;

  @IsNumber()
  @Min(0)
  set quantity(val: any) { this._quantity = cleanNumber(val); }
  get quantity(): number { return this._quantity; }
  private _quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set reservedQuantity(val: any) { this._reservedQuantity = cleanNumber(val); }
  get reservedQuantity(): number | undefined { return this._reservedQuantity; }
  private _reservedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set minStockLevel(val: any) { this._minStockLevel = cleanNumber(val); }
  get minStockLevel(): number | undefined { return this._minStockLevel; }
  private _minStockLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set maxStockLevel(val: any) { this._maxStockLevel = cleanNumber(val); }
  get maxStockLevel(): number | undefined { return this._maxStockLevel; }
  private _maxStockLevel?: number;

  @IsNumber()
  @Min(0)
  set costPrice(val: any) { this._costPrice = cleanNumber(val); }
  get costPrice(): number { return this._costPrice; }
  private _costPrice: number;

  @IsNumber()
  @Min(0)
  set sellingPrice(val: any) { this._sellingPrice = cleanNumber(val); }
  get sellingPrice(): number { return this._sellingPrice; }
  private _sellingPrice: number;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastRestockDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsUUID()
  motorcycleId: string;
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set quantity(val: any) { this._quantity = cleanNumber(val); }
  get quantity(): number | undefined { return this._quantity; }
  private _quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set reservedQuantity(val: any) { this._reservedQuantity = cleanNumber(val); }
  get reservedQuantity(): number | undefined { return this._reservedQuantity; }
  private _reservedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set minStockLevel(val: any) { this._minStockLevel = cleanNumber(val); }
  get minStockLevel(): number | undefined { return this._minStockLevel; }
  private _minStockLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set maxStockLevel(val: any) { this._maxStockLevel = cleanNumber(val); }
  get maxStockLevel(): number | undefined { return this._maxStockLevel; }
  private _maxStockLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set costPrice(val: any) { this._costPrice = cleanNumber(val); }
  get costPrice(): number | undefined { return this._costPrice; }
  private _costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  set sellingPrice(val: any) { this._sellingPrice = cleanNumber(val); }
  get sellingPrice(): number | undefined { return this._sellingPrice; }
  private _sellingPrice?: number;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastRestockDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsUUID()
  motorcycleId?: string;
}

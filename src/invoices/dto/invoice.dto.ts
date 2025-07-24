// Utilidad para limpiar números: solo dígitos
export function cleanNumber(val: any) {
  if (val === undefined || val === null) return val;
  const digits = String(val).replace(/\D/g, '');
  return digits === '' ? undefined : Number(digits);
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceItemDto {
  @ApiProperty({ description: 'ID of the product', example: '5f8d0f5a4c6c4f0017b4c1a9' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Name of the product', example: 'Motorcycle Part X' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity of items', example: 2 })
  @IsNotEmpty()
  @IsNumber()
  set quantity(val: any) { this._quantity = cleanNumber(val); }
  get quantity(): number { return this._quantity; }
  private _quantity: number;

  @ApiProperty({ description: 'Price per unit', example: 199.99 })
  @IsNotEmpty()
  @IsNumber()
  set unitPrice(val: any) { this._unitPrice = cleanNumber(val); }
  get unitPrice(): number { return this._unitPrice; }
  private _unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 399.98 })
  @IsNotEmpty()
  @IsNumber()
  set totalPrice(val: any) { this._totalPrice = cleanNumber(val); }
  get totalPrice(): number { return this._totalPrice; }
  private _totalPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID of the customer', example: '5f8d0f5a4c6c4f0017b4c1a9' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'ID of the sale this invoice is for', example: '5f8d0f5a4c6c4f0017b4c1a9' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiProperty({ description: 'Invoice issue date', example: '2023-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ description: 'Invoice due date', example: '2023-02-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Current status of the invoice',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
    example: InvoiceStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({ description: 'Subtotal amount before taxes', example: 500 })
  @IsNotEmpty()
  @IsNumber()
  set subtotal(val: any) { this._subtotal = cleanNumber(val); }
  get subtotal(): number { return this._subtotal; }
  private _subtotal: number;

  @ApiProperty({ description: 'Tax amount', example: 50 })
  @IsNotEmpty()
  @IsNumber()
  set tax(val: any) { this._tax = cleanNumber(val); }
  get tax(): number { return this._tax; }
  private _tax: number;

  @ApiProperty({ description: 'Total amount including taxes', example: 550 })
  @IsNotEmpty()
  @IsNumber()
  set total(val: any) { this._total = cleanNumber(val); }
  get total(): number { return this._total; }
  private _total: number;

  @ApiProperty({
    description: 'Array of invoice items',
    type: [InvoiceItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Additional notes', example: 'Customer requested special delivery' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceDto {
  @ApiProperty({ description: 'ID of the customer', example: '5f8d0f5a4c6c4f0017b4c1a9' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'ID of the sale this invoice is for', example: '5f8d0f5a4c6c4f0017b4c1a9' })
  @IsOptional()
  @IsString()
  saleId?: string;

  @ApiProperty({ description: 'Invoice issue date', example: '2023-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ description: 'Invoice due date', example: '2023-02-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Current status of the invoice',
    enum: InvoiceStatus,
    example: InvoiceStatus.PAID
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({ description: 'Subtotal amount before taxes', example: 500 })
  @IsOptional()
  @IsNumber()
  set subtotal(val: any) { this._subtotal = cleanNumber(val); }
  get subtotal(): number | undefined { return this._subtotal; }
  private _subtotal?: number;

  @ApiProperty({ description: 'Tax amount', example: 50 })
  @IsOptional()
  @IsNumber()
  set tax(val: any) { this._tax = cleanNumber(val); }
  get tax(): number | undefined { return this._tax; }
  private _tax?: number;

  @ApiProperty({ description: 'Total amount including taxes', example: 550 })
  @IsOptional()
  @IsNumber()
  set total(val: any) { this._total = cleanNumber(val); }
  get total(): number | undefined { return this._total; }
  private _total?: number;

  @ApiProperty({
    description: 'Array of invoice items',
    type: [InvoiceItemDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @ApiProperty({ description: 'Additional notes', example: 'Customer requested special delivery' })
  @IsOptional()
  @IsString()
  notes?: string;
}

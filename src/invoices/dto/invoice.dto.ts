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
  quantity: number;

  @ApiProperty({ description: 'Price per unit', example: 199.99 })
  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 399.98 })
  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;
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
  status?: InvoiceStatus = InvoiceStatus.DRAFT;

  @ApiProperty({ description: 'Subtotal amount before taxes', example: 500 })
  @IsNotEmpty()
  @IsNumber()
  subtotal: number;

  @ApiProperty({ description: 'Tax amount', example: 50 })
  @IsNotEmpty()
  @IsNumber()
  tax: number;

  @ApiProperty({ description: 'Total amount including taxes', example: 550 })
  @IsNotEmpty()
  @IsNumber()
  total: number;

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
  subtotal?: number;

  @ApiProperty({ description: 'Tax amount', example: 50 })
  @IsOptional()
  @IsNumber()
  tax?: number;

  @ApiProperty({ description: 'Total amount including taxes', example: 550 })
  @IsOptional()
  @IsNumber()
  total?: number;

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

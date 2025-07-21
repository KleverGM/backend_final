import { IsUUID, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID de la motocicleta',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  motorcycleId: string;

  @ApiProperty({
    description: 'Cantidad de motocicletas',
    example: 1,
    minimum: 1,
    maximum: 10
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;

  @ApiProperty({
    description: 'Notas adicionales',
    example: 'Color preferido: rojo',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Nueva cantidad',
    example: 2,
    minimum: 1,
    maximum: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity?: number;

  @ApiProperty({
    description: 'Notas actualizadas',
    example: 'Cambio de color: azul',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CartSummaryDto {
  @ApiProperty({ description: 'Número total de items' })
  totalItems: number;

  @ApiProperty({ description: 'Precio total del carrito' })
  totalPrice: number;

  @ApiProperty({ description: 'Items en el carrito' })
  items: CartItemResponseDto[];
  
  @ApiProperty({ description: 'ID del cliente (solo para vistas de admin)', required: false })
  customerId?: string;
  
  @ApiProperty({ description: 'Cantidad de items distintos (solo para vistas de admin)', required: false })
  itemCount?: number;
  
  @ApiProperty({ description: 'Última actualización del carrito (solo para vistas de admin)', required: false })
  updatedAt?: Date;
}

export class CartItemResponseDto {
  @ApiProperty({ description: 'ID del item del carrito' })
  id: string;

  @ApiProperty({ description: 'ID de la motocicleta' })
  motorcycleId: string;

  @ApiProperty({ description: 'Información de la motocicleta' })
  motorcycle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    imageUrl?: string | null;
    inStock: boolean;
  };

  @ApiProperty({ description: 'Cantidad' })
  quantity: number;

  @ApiProperty({ description: 'Precio unitario' })
  unitPrice: number;

  @ApiProperty({ description: 'Precio total del item' })
  totalPrice: number;

  @ApiProperty({ description: 'Notas del item' })
  notes?: string;

  @ApiProperty({ description: 'Fecha de agregado al carrito' })
  createdAt: Date;
}

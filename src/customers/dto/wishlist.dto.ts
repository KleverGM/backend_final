import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWishlistDto {
  @ApiProperty({
    description: 'ID de la motocicleta para agregar a la lista de deseos',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  motorcycleId: string;
}

export class WishlistResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  motorcycleId: string;

  @ApiProperty()
  createdAt: Date;
  
  @ApiProperty()
  motorcycle?: any;
}

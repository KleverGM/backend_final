import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartItem } from './cart.entity';
import { MotorcyclesModule } from '../motorcycles/motorcycles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem]),
    forwardRef(() => MotorcyclesModule),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

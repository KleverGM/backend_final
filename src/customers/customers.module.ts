import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { WishlistService } from './services/wishlist.service';
import { ReviewService } from './services/review.service';
import { WishlistController } from './controllers/wishlist.controller';
import { ReviewController } from './controllers/review.controller';
import { Customer } from './entities/customer.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Review } from './entities/review.entity';
import { User } from '../auth/entities/user.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, User, Wishlist, Review, Motorcycle])],
  controllers: [CustomersController, WishlistController, ReviewController],
  providers: [CustomersService, WishlistService, ReviewService],
  exports: [CustomersService, WishlistService, ReviewService],
})
export class CustomersModule {}

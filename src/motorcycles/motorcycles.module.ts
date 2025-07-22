import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MotorcyclesController } from './motorcycles.controller';
import { MotorcyclesService } from './motorcycles.service';
import { Motorcycle } from './entities/motorcycle.entity';
import { Category } from '../categories/entities/category.entity';
import { MongodbModule } from '../mongodb/mongodb.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Motorcycle, Category]),
    MongodbModule,
    UploadModule,
  ],
  controllers: [MotorcyclesController],
  providers: [MotorcyclesService],
  exports: [MotorcyclesService],
})
export class MotorcyclesModule {}

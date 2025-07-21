import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { UploadModule } from '../upload/upload.module';
import { CustomersModule } from '../customers/customers.module';
import { MotorcyclesModule } from '../motorcycles/motorcycles.module';

@Module({
  imports: [UploadModule, CustomersModule, MotorcyclesModule],
  controllers: [ImagesController],
})
export class ImagesModule {}

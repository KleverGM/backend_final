import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Upload } from './upload.entity';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload]),
    MulterModule.register({
      dest: './public/uploads',
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}

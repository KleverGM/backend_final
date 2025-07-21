import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './upload.entity';
import { UploadDto, EntityType } from './dto/upload.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
// import type { File as MulterFile } from 'multer';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadDto,
    uploadedBy: string,
  ): Promise<Upload> {
    try {
      // Validar tipo de archivo
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de archivo no permitido');
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('Archivo demasiado grande. Máximo 5MB');
      }

      // Crear URL del archivo
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const fileUrl = `${baseUrl}/uploads/${file.filename}`;

      const upload = this.uploadRepository.create({
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: fileUrl,
        entityType: uploadDto.entityType,
        entityId: uploadDto.entityId,
        uploadedBy,
      });

      return await this.uploadRepository.save(upload);
    } catch (error) {
      // Eliminar archivo si hay error
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      this.logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  async getFileById(id: string): Promise<Upload> {
    const upload = await this.uploadRepository.findOne({ where: { id } });
    if (!upload) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return upload;
  }

  async getFilesByEntity(entityType: EntityType, entityId: string): Promise<Upload[]> {
    return await this.uploadRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteFile(id: string, userId: string, isAdmin: boolean = false): Promise<void> {
    try {
      const upload = await this.getFileById(id);

      // Verificar permisos (solo el que subió el archivo o admin puede eliminarlo)
      if (!isAdmin && upload.uploadedBy !== userId) {
        throw new BadRequestException('No tienes permiso para eliminar este archivo');
      }
      
      // Eliminar archivo físico
      if (fs.existsSync(upload.path)) {
        fs.unlinkSync(upload.path);
      }

      // Eliminar registro de base de datos
      await this.uploadRepository.remove(upload);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  async updateFileEntity(id: string, entityType: EntityType, entityId: string): Promise<Upload> {
    const upload = await this.getFileById(id);
    upload.entityType = entityType;
    upload.entityId = entityId;
    return await this.uploadRepository.save(upload);
  }

  async getFileStats(): Promise<any> {
    try {
      const totalFiles = await this.uploadRepository.count();
      const totalSize = await this.uploadRepository
        .createQueryBuilder('upload')
        .select('SUM(upload.size)', 'totalSize')
        .getRawOne();

      const filesByType = await this.uploadRepository
        .createQueryBuilder('upload')
        .select('upload.mimetype', 'mimetype')
        .addSelect('COUNT(*)', 'count')
        .groupBy('upload.mimetype')
        .getRawMany();

      const filesByEntity = await this.uploadRepository
        .createQueryBuilder('upload')
        .select('upload.entityType', 'entityType')
        .addSelect('COUNT(*)', 'count')
        .where('upload.entityType IS NOT NULL')
        .groupBy('upload.entityType')
        .getRawMany();

      return {
        totalFiles,
        totalSize: totalSize?.totalSize || 0,
        filesByType,
        filesByEntity,
      };
    } catch (error) {
      this.logger.error(`Error getting file stats: ${error.message}`);
      throw error;
    }
  }

  async getAllFiles(page: number = 1, limit: number = 20, mimetype?: string): Promise<{ files: Upload[], total: number, page: number, limit: number }> {
    try {
      const skip = (page - 1) * limit;

      // Crear el queryBuilder base
      const queryBuilder = this.uploadRepository.createQueryBuilder('upload');

      // Filtrar por tipo MIME si se proporciona
      if (mimetype) {
        queryBuilder.where('upload.mimetype = :mimetype', { mimetype });
      }

      // Obtener el total de archivos
      const total = await queryBuilder.getCount();

      // Ejecutar la consulta con paginación
      const files = await queryBuilder
        .orderBy('upload.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      return {
        files,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(`Error getting all files: ${error.message}`);
      throw error;
    }
  }
}

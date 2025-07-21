import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadDto, EntityType, UploadResponseDto } from './dto/upload.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { Express } from 'express';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Subir un nuevo archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir (max 5MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido correctamente', type: UploadResponseDto })
  @ApiResponse({ status: 400, description: 'Solicitud incorrecta - Archivo no válido o demasiado grande' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDto,
    @Request() req,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    const upload = await this.uploadService.uploadFile(
      file,
      uploadDto,
      req.user.id,
    );

    return {
      id: upload.id,
      originalName: upload.originalName,
      filename: upload.filename,
      url: upload.url,
      size: upload.size,
      mimetype: upload.mimetype,
      entityType: upload.entityType,
      entityId: upload.entityId,
      createdAt: upload.createdAt,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un archivo por su ID' })
  @ApiParam({ name: 'id', description: 'ID del archivo' })
  @ApiResponse({ status: 200, description: 'Archivo encontrado', type: UploadResponseDto })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async getFile(@Param('id') id: string, @Request() req) {
    // Solo el propietario o admin pueden ver el archivo
    const file = await this.uploadService.getFileById(id);
    if (!file) return { message: 'Archivo no encontrado', data: null };
    const isAdmin = req.user.role === UserRole.ADMIN;
    if (!isAdmin && file.uploadedBy !== req.user.id) {
      return { message: 'No tienes permiso para ver este archivo', data: null };
    }
    return { message: 'Archivo encontrado', data: file };
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Obtener archivos por tipo de entidad e ID' })
  @ApiParam({ name: 'entityType', description: 'Tipo de entidad (MOTORCYCLE, CUSTOMER, etc)' })
  @ApiParam({ name: 'entityId', description: 'ID de la entidad' })
  @ApiResponse({ status: 200, description: 'Lista de archivos encontrada' })
  async getFilesByEntity(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
    @Request() req,
  ) {
    // ADMIN puede ver cualquier archivo
    // SELLER/CUSTOMER solo archivos propios
    if (req.user.role === UserRole.ADMIN) {
      return await this.uploadService.getFilesByEntity(entityType, entityId);
    }
    // Filtra manualmente después de obtener los archivos
    const files = await this.uploadService.getFilesByEntity(entityType, entityId);
    return files.filter(file => file.uploadedBy === req.user.id);
  }

  @Put(':id/entity')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar la entidad asociada a un archivo' })
  @ApiParam({ name: 'id', description: 'ID del archivo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entityType: { 
          type: 'string',
          description: 'Tipo de entidad (MOTORCYCLE, CUSTOMER, etc)',
          enum: Object.values(EntityType)
        },
        entityId: { 
          type: 'string', 
          description: 'ID de la entidad a asociar' 
        },
      },
      required: ['entityType', 'entityId']
    }
  })
  @ApiResponse({ status: 200, description: 'Entidad actualizada correctamente' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Usuario sin permisos' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async updateFileEntity(
    @Param('id') id: string,
    @Body() body: { entityType: EntityType; entityId: string },
    @Request() req,
  ) {
    // Solo ADMIN y SELLER pueden actualizar entidad
    if (![UserRole.ADMIN, UserRole.SELLER].includes(req.user.role)) {
      return { message: 'No tienes permiso para actualizar la entidad', data: null };
    }
    return await this.uploadService.updateFileEntity(
      id,
      body.entityType,
      body.entityId,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SELLER)
  @ApiOperation({ summary: 'Eliminar archivo (solo propietario o admin)' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado correctamente' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - No eres el propietario' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async deleteFile(@Param('id') id: string, @Request() req) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    // Solo el propietario o admin pueden eliminar
    const file = await this.uploadService.getFileById(id);
    if (!file) return { message: 'Archivo no encontrado' };
    if (!isAdmin && file.uploadedBy !== req.user.id) {
      return { message: 'No tienes permiso para eliminar este archivo' };
    }
    await this.uploadService.deleteFile(id, req.user.id, isAdmin);
    return { message: 'Archivo eliminado exitosamente' };
  }

  @Get('stats/summary')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener estadísticas de archivos subidos (solo admin)' })
  @ApiResponse({ status: 200, description: 'Estadísticas recuperadas correctamente' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Usuario no es administrador' })
  async getFileStats() {
    return await this.uploadService.getFileStats();
  }

  @Delete('admin/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Eliminar cualquier archivo (solo admin)' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado correctamente' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Usuario no es administrador' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async adminDeleteFile(@Param('id') id: string, @Request() req) {
    await this.uploadService.deleteFile(id, req.user.id, true);
    return { message: 'Archivo eliminado exitosamente por administrador' };
  }

  @Get('list/all')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener todos los archivos (solo admin)' })
  @ApiResponse({ status: 200, description: 'Listado de archivos recuperado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido - Usuario no es administrador' })
  @ApiQuery({ name: 'page', description: 'Número de página', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Límites por página', required: false, type: Number })
  @ApiQuery({ name: 'mimetype', description: 'Filtrar por tipo de archivo', required: false })
  async getAllFiles(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('type') mimetype?: string
  ) {
    return await this.uploadService.getAllFiles(page || 1, limit || 20, mimetype);
  }
}

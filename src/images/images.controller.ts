import { Controller, Post, Body, UseGuards, Request, Param, Put } from '@nestjs/common';
import { MotorcyclesService } from '../motorcycles/motorcycles.service';
import { CustomersService } from '../customers/customers.service';
import { UploadService } from '../upload/upload.service';
import { EntityType } from '../upload/dto/upload.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly customersService: CustomersService,
    private readonly motorcyclesService: MotorcyclesService,
  ) {}

  @Post('motorcycle/:motorcycleId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseGuards(RolesGuard)
  async linkImageToMotorcycle(
    @Param('motorcycleId') motorcycleId: string,
    @Body() body: { uploadId: string },
    @Request() req,
  ) {
    // Actualizar el upload para asociarlo con la motocicleta
    const upload = await this.uploadService.updateFileEntity(
      body.uploadId,
      EntityType.MOTORCYCLE,
      motorcycleId,
    );

    // Agregar la URL de la imagen al array imageUrls de la motocicleta
    const motorcycle = await this.motorcyclesService.addImageUrl(motorcycleId, upload.url);

    return { 
      message: 'Imagen asociada correctamente a la motocicleta',
      motorcycleId,
      uploadId: body.uploadId,
      imageUrl: upload.url
    };
  }

  @Post('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  async linkImageToCustomer(
    @Param('customerId') customerId: string,
    @Body() body: { uploadId: string },
    @Request() req,
  ) {
    // Verificar que el usuario puede modificar este cliente
    if (req.user.role === UserRole.CUSTOMER && req.user.customerId !== customerId) {
      throw new Error('No autorizado para modificar este cliente');
    }

    // Actualizar el upload para asociarlo con el cliente
    const upload = await this.uploadService.updateFileEntity(
      body.uploadId,
      EntityType.CUSTOMER,
      customerId,
    );

    // Actualizar el campo profileImageUrl en la entidad Customer
    const customer = await this.customersService.updateProfileImage(customerId, upload.url);

    return { 
      message: 'Imagen de perfil actualizada correctamente',
      customerId,
      uploadId: body.uploadId,
      profileImageUrl: upload.url
    };
  }
}

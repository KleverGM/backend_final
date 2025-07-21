import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto, RestockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { InventoryStatus } from './entities/inventory.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    const inventory = await this.inventoryService.create(createInventoryDto);
    return {
      message: 'Inventory created successfully',
      data: inventory,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async findAll(
    @Query('status') status?: InventoryStatus,
    @Query('lowStock') lowStock?: string,
    @Query('motorcycleId') motorcycleId?: string,
  ) {
    const filters = {
      status,
      lowStock: lowStock === 'true',
      motorcycleId,
    };

    const inventory = await this.inventoryService.findAll(filters);
    return {
      message: 'Inventory retrieved successfully',
      data: inventory,
    };
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async getLowStockItems() {
    const items = await this.inventoryService.getLowStockItems();
    return {
      message: 'Low stock items retrieved successfully',
      data: items,
    };
  }

  @Get('motorcycle/:motorcycleId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async findByMotorcycle(@Param('motorcycleId') motorcycleId: string) {
    const inventory = await this.inventoryService.findByMotorcycle(motorcycleId);
    return {
      message: 'Inventory retrieved successfully',
      data: inventory,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async findOne(@Param('id') id: string) {
    const inventory = await this.inventoryService.findOne(id);
    return {
      message: 'Inventory retrieved successfully',
      data: inventory,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    const inventory = await this.inventoryService.update(id, updateInventoryDto);
    return {
      message: 'Inventory updated successfully',
      data: inventory,
    };
  }

  @Post(':id/restock')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async restock(@Param('id') id: string, @Body() restockDto: RestockDto) {
    const inventory = await this.inventoryService.restock(id, restockDto);
    return {
      message: 'Inventory restocked successfully',
      data: inventory,
    };
  }

  @Post(':id/reserve')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async reserve(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    const inventory = await this.inventoryService.reserve(id, quantity);
    return {
      message: 'Inventory reserved successfully',
      data: inventory,
    };
  }

  @Post(':id/release')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async releaseReservation(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    const inventory = await this.inventoryService.releaseReservation(id, quantity);
    return {
      message: 'Reservation released successfully',
      data: inventory,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.inventoryService.remove(id);
    return {
      message: 'Inventory deleted successfully',
    };
  }
}

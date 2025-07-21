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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { RequestWithUser } from '../common/interfaces/auth.interfaces';
import { SaleStatus } from './entities/sale.entity';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new sale (Admin/Seller only)' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @Request() req: RequestWithUser,
  ) {
    const sale = await this.salesService.create(createSaleDto, req.user.id);
    return {
      message: 'Sale created successfully',
      data: sale,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sales (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() req: RequestWithUser,
    @Query('status') status?: SaleStatus,
    @Query('customerId') customerId?: string,
  ) {
    const sales = await this.salesService.findAll({
      status,
      customerId,
      sellerId: req.user.role === UserRole.SELLER ? req.user.id : undefined,
    });
    return {
      message: 'Sales retrieved successfully',
      data: sales,
    };
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sales by customer' })
  @ApiResponse({ status: 200, description: 'Customer sales retrieved successfully' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @Request() req: RequestWithUser,
  ) {
    // Customers can only see their own sales
    if (req.user.role === UserRole.CUSTOMER && req.user.customerId !== customerId) {
      customerId = req.user.customerId || req.user.id;
    }
    
    // Sellers can only see sales they've created
    const sellerId = req.user.role === UserRole.SELLER ? req.user.id : undefined;
    
    const sales = await this.salesService.findByCustomer(customerId, sellerId);
    return {
      message: 'Customer sales retrieved successfully',
      data: sales,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const sale = await this.salesService.findOne(id, req.user);
    return {
      message: 'Sale retrieved successfully',
      data: sale,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update sale (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @Request() req: RequestWithUser,
  ) {
    const sale = await this.salesService.update(id, updateSaleDto, req.user);
    return {
      message: 'Sale updated successfully',
      data: sale,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete sale (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async remove(@Param('id') id: string) {
    await this.salesService.remove(id);
    return {
      message: 'Sale deleted successfully'
    };
  }
}

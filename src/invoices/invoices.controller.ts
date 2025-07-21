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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { InvoiceStatus } from './entities/invoice.entity';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Create a new invoice (Admin/Seller only)' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    const invoice = await this.invoicesService.create(createInvoiceDto, req.user.id);
    return {
      message: 'Invoice created successfully',
      data: invoice,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get all invoices (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
  ) {
    const invoices = await this.invoicesService.findAll({ status, customerId });
    return {
      message: 'Invoices retrieved successfully',
      data: invoices,
    };
  }

  @Get('customer/:customerId')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer invoices' })
  @ApiResponse({ status: 200, description: 'Customer invoices retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Customers can only access their own invoices' })
  @ApiParam({ name: 'customerId', description: 'ID of the customer' })
  async findByCustomer(@Param('customerId') customerId: string, @Request() req) {
    // Customers can only see their own invoices
    if (req.user.role === UserRole.CUSTOMER && req.user.customerId !== customerId) {
      customerId = req.user.customerId || req.user.id;
    }
    
    const invoices = await this.invoicesService.findByCustomer(customerId);
    return {
      message: 'Customer invoices retrieved successfully',
      data: invoices,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'id', description: 'ID of the invoice' })
  async findOne(@Param('id') id: string, @Request() req) {
    const invoice = await this.invoicesService.findOne(id, req.user);
    return {
      message: 'Invoice retrieved successfully',
      data: invoice,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update invoice (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'id', description: 'ID of the invoice' })
  async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    const invoice = await this.invoicesService.update(id, updateInvoiceDto);
    return {
      message: 'Invoice updated successfully',
      data: invoice,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete invoice (Admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'id', description: 'ID of the invoice' })
  async remove(@Param('id') id: string) {
    await this.invoicesService.remove(id);
    return {
      message: 'Invoice deleted successfully',
    };
  }
}

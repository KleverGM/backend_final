import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Invoice } from './entities/invoice.entity';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ApiTags('Invoice Items')
@Controller('invoices/:invoiceId/items')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoiceItemsController {
  constructor(
    @InjectRepository(InvoiceItem)
    private readonly itemRepository: Repository<InvoiceItem>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List items for an invoice' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  async findAll(@Param('invoiceId') invoiceId: string, @Request() req) {
    // Validar ownership para customer
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });
    if (!invoice) return { message: 'Invoice not found', data: null };
    if (
      req.user.role === UserRole.CUSTOMER &&
      invoice.customerId !== req.user.customerId &&
      invoice.customerId !== req.user.id
    ) {
      return { message: 'Forbidden', data: null };
    }
    const items = await this.itemRepository.find({ where: { invoiceId } });
    return { message: 'Items retrieved successfully', data: items };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Add item to invoice (Admin/Seller only)' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('invoiceId') invoiceId: string, @Body() body: Partial<InvoiceItem>) {
    // Validar existencia de la factura
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });
    if (!invoice) return { message: 'Invoice not found', data: null };
    // Validar existencia de producto
    const product = await this.motorcycleRepository.findOne({ where: { id: body.productId } });
    if (!product) return { message: 'Product not found', data: null };
    // Validar cantidad y precios
    if (!body.quantity || body.quantity <= 0) return { message: 'Quantity must be greater than 0', data: null };
    if (!body.unitPrice || body.unitPrice < 0) return { message: 'Unit price must be >= 0', data: null };
    if (!body.totalPrice || body.totalPrice < 0) return { message: 'Total price must be >= 0', data: null };
    // Validar duplicados
    const existing = await this.itemRepository.findOne({ where: { invoiceId, productId: body.productId } });
    if (existing) return { message: 'Product already exists in invoice', data: null };
    const item = this.itemRepository.create({ ...body, invoiceId });
    await this.itemRepository.save(item);
    return { message: 'Item added successfully', data: item };
  }

  @Patch(':itemId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update item (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  async update(@Param('invoiceId') invoiceId: string, @Param('itemId') itemId: string, @Body() body: Partial<InvoiceItem>) {
    const item = await this.itemRepository.findOne({ where: { id: itemId, invoiceId } });
    if (!item) return { message: 'Item not found', data: null };
    // Validar existencia de producto si se actualiza
    if (body.productId) {
      const product = await this.motorcycleRepository.findOne({ where: { id: body.productId } });
      if (!product) return { message: 'Product not found', data: null };
    }
    if (body.quantity !== undefined && body.quantity <= 0) return { message: 'Quantity must be greater than 0', data: null };
    if (body.unitPrice !== undefined && body.unitPrice < 0) return { message: 'Unit price must be >= 0', data: null };
    if (body.totalPrice !== undefined && body.totalPrice < 0) return { message: 'Total price must be >= 0', data: null };
    Object.assign(item, body);
    await this.itemRepository.save(item);
    return { message: 'Item updated successfully', data: item };
  }

  @Delete(':itemId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Delete item (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  async remove(@Param('invoiceId') invoiceId: string, @Param('itemId') itemId: string, @Request() req) {
    // Validar ownership para customer
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });
    if (!invoice) return { message: 'Invoice not found', data: null };
    if (
      req.user.role === UserRole.CUSTOMER &&
      invoice.customerId !== req.user.customerId &&
      invoice.customerId !== req.user.id
    ) {
      return { message: 'Forbidden', data: null };
    }
    await this.itemRepository.delete({ id: itemId, invoiceId });
    return { message: 'Item deleted successfully' };
  }
}

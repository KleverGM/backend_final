import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Motorcycle } from '../motorcycles/entities/motorcycle.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceItemDto } from './dto/invoice.dto';
import { UserRole } from '../auth/entities/user.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Motorcycle)
    private readonly motorcycleRepository: Repository<Motorcycle>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, createdById: string): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a new invoice entity with the required fields
    const newInvoice = new Invoice();
    newInvoice.invoiceNumber = invoiceNumber;
    newInvoice.customerId = createInvoiceDto.customerId;
    
    // Para el saleId, necesitamos verificar si es opcional en la entidad
    if (createInvoiceDto.saleId) {
      newInvoice.saleId = createInvoiceDto.saleId;
    } else {
      // Generamos un UUID aleatorio si es necesario, ya que la columna no permite nulos
      newInvoice.saleId = '00000000-0000-0000-0000-000000000000';
    }
    
    newInvoice.subtotal = createInvoiceDto.subtotal;
    newInvoice.taxAmount = createInvoiceDto.tax;
    newInvoice.totalAmount = createInvoiceDto.total;
    newInvoice.status = createInvoiceDto.status || InvoiceStatus.DRAFT;
    newInvoice.issueDate = createInvoiceDto.issueDate ? new Date(createInvoiceDto.issueDate) : new Date();
    newInvoice.dueDate = createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Para notes, que es nullable pero debe ser string si se proporciona
    newInvoice.notes = createInvoiceDto.notes || '';

    // Validaciones de items
    if (!createInvoiceDto.items || !Array.isArray(createInvoiceDto.items) || createInvoiceDto.items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }
    const { InvoiceItem } = await import('./entities/invoice-item.entity');
    const productIds = new Set();
    newInvoice.items = [];
    let subtotalCalc = 0;
    for (const itemDto of createInvoiceDto.items) {
      // Validar duplicados
      if (productIds.has(itemDto.productId)) {
        throw new Error('Duplicate product in items');
      }
      productIds.add(itemDto.productId);
      // Validar existencia de producto
      const product = await this.motorcycleRepository.findOne({ where: { id: itemDto.productId } });
      if (!product) throw new Error(`Product not found: ${itemDto.productId}`);
      // Validar cantidad y precios
      if (!itemDto.quantity || itemDto.quantity <= 0) throw new Error('Quantity must be greater than 0');
      if (!itemDto.unitPrice || itemDto.unitPrice < 0) throw new Error('Unit price must be >= 0');
      if (!itemDto.totalPrice || itemDto.totalPrice < 0) throw new Error('Total price must be >= 0');
      subtotalCalc += itemDto.totalPrice;
      const item = new InvoiceItem();
      item.productId = itemDto.productId;
      item.productName = itemDto.productName;
      item.quantity = itemDto.quantity;
      item.unitPrice = itemDto.unitPrice;
      item.totalPrice = itemDto.totalPrice;
      newInvoice.items.push(item);
    }

    // Validar totales
    if (Math.abs(subtotalCalc - createInvoiceDto.subtotal) > 0.01) {
      throw new Error('Subtotal does not match sum of item totals');
    }
    if (Math.abs((createInvoiceDto.subtotal + createInvoiceDto.tax) - createInvoiceDto.total) > 0.01) {
      throw new Error('Total does not match subtotal + tax');
    }

    // Save the new invoice
    return await this.invoiceRepository.save(newInvoice);
  }

  async findAll(filters: { status?: InvoiceStatus; customerId?: string }) {
    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (filters.status) {
      query.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      query.andWhere('invoice.customerId = :customerId', { customerId: filters.customerId });
    }

    return await query.getMany();
  }

  async findByCustomer(customerId: string): Promise<Invoice[]> {
    return await this.invoiceRepository.find({ where: { customerId } });
  }

  async findOne(id: string, user: any): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Only allow customers to view their own invoices
    if (user.role === UserRole.CUSTOMER && invoice.customerId !== user.customerId && invoice.customerId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this invoice');
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id, { role: UserRole.ADMIN }); // Use admin role to bypass customer check

    // Actualizar campos básicos
    if (updateInvoiceDto.customerId !== undefined) invoice.customerId = updateInvoiceDto.customerId;
    if (updateInvoiceDto.saleId !== undefined) invoice.saleId = updateInvoiceDto.saleId;
    if (updateInvoiceDto.status !== undefined) invoice.status = updateInvoiceDto.status;
    if (updateInvoiceDto.subtotal !== undefined) invoice.subtotal = updateInvoiceDto.subtotal;
    if (updateInvoiceDto.tax !== undefined) invoice.taxAmount = updateInvoiceDto.tax;
    if (updateInvoiceDto.total !== undefined) invoice.totalAmount = updateInvoiceDto.total;
    if (updateInvoiceDto.notes !== undefined) invoice.notes = updateInvoiceDto.notes || '';
    if (updateInvoiceDto.issueDate) invoice.issueDate = new Date(updateInvoiceDto.issueDate);
    if (updateInvoiceDto.dueDate) invoice.dueDate = new Date(updateInvoiceDto.dueDate);

    // Si se reciben items, reemplazar los existentes por los nuevos (solo Admin/Seller)
    if (updateInvoiceDto.items && Array.isArray(updateInvoiceDto.items)) {
      if (updateInvoiceDto.items.length === 0) throw new Error('Invoice must have at least one item');
      const { InvoiceItem } = await import('./entities/invoice-item.entity');
      const productIds = new Set();
      const items: any[] = [];
      let subtotalCalc = 0;
      for (const itemDto of updateInvoiceDto.items) {
        if (productIds.has(itemDto.productId)) {
          throw new Error('Duplicate product in items');
        }
        productIds.add(itemDto.productId);
        const product = await this.motorcycleRepository.findOne({ where: { id: itemDto.productId } });
        if (!product) throw new Error(`Product not found: ${itemDto.productId}`);
        if (!itemDto.quantity || itemDto.quantity <= 0) throw new Error('Quantity must be greater than 0');
        if (!itemDto.unitPrice || itemDto.unitPrice < 0) throw new Error('Unit price must be >= 0');
        if (!itemDto.totalPrice || itemDto.totalPrice < 0) throw new Error('Total price must be >= 0');
        subtotalCalc += itemDto.totalPrice;
        const item = new InvoiceItem();
        item.productId = itemDto.productId;
        item.productName = itemDto.productName;
        item.quantity = itemDto.quantity;
        item.unitPrice = itemDto.unitPrice;
        item.totalPrice = itemDto.totalPrice;
        items.push(item);
      }
      invoice.items = items;

      // Validar totales
      if (updateInvoiceDto.subtotal !== undefined && Math.abs(subtotalCalc - updateInvoiceDto.subtotal) > 0.01) {
        throw new Error('Subtotal does not match sum of item totals');
      }
      if (
        updateInvoiceDto.subtotal !== undefined &&
        updateInvoiceDto.tax !== undefined &&
        updateInvoiceDto.total !== undefined &&
        Math.abs((updateInvoiceDto.subtotal + updateInvoiceDto.tax) - updateInvoiceDto.total) > 0.01
      ) {
        throw new Error('Total does not match subtotal + tax');
      }
    }

    return await this.invoiceRepository.save(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id, { role: UserRole.ADMIN }); // Use admin role to bypass customer check
    await this.invoiceRepository.remove(invoice);
  }
}

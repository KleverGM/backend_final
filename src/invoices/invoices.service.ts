import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { UserRole } from '../auth/entities/user.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
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
    
    // Update only the fields that are present in the DTO
    if (updateInvoiceDto.customerId !== undefined) invoice.customerId = updateInvoiceDto.customerId;
    if (updateInvoiceDto.saleId !== undefined) invoice.saleId = updateInvoiceDto.saleId;
    if (updateInvoiceDto.status !== undefined) invoice.status = updateInvoiceDto.status;
    if (updateInvoiceDto.subtotal !== undefined) invoice.subtotal = updateInvoiceDto.subtotal;
    if (updateInvoiceDto.tax !== undefined) invoice.taxAmount = updateInvoiceDto.tax;
    if (updateInvoiceDto.total !== undefined) invoice.totalAmount = updateInvoiceDto.total;
    if (updateInvoiceDto.notes !== undefined) invoice.notes = updateInvoiceDto.notes || '';
    if (updateInvoiceDto.issueDate) invoice.issueDate = new Date(updateInvoiceDto.issueDate);
    if (updateInvoiceDto.dueDate) invoice.dueDate = new Date(updateInvoiceDto.dueDate);

    return await this.invoiceRepository.save(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id, { role: UserRole.ADMIN }); // Use admin role to bypass customer check
    await this.invoiceRepository.remove(invoice);
  }
}

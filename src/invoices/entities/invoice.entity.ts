import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { OneToMany } from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  invoiceNumber: string;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column()
  issueDate: Date;

  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Sale, { onDelete: 'RESTRICT' })
  @JoinColumn()
  sale: Sale;

  @Column('uuid')
  saleId: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn()
  customer: Customer;

  @Column('uuid')
  customerId: string;

  @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true, eager: true })
  items: InvoiceItem[];

  // Computed properties
  get balanceAmount(): number {
    return this.totalAmount - this.paidAmount;
  }

  get isOverdue(): boolean {
    return new Date() > this.dueDate && this.status !== InvoiceStatus.PAID;
  }

  get isPaid(): boolean {
    return this.paidAmount >= this.totalAmount;
  }
}

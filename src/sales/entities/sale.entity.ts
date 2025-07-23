import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../auth/entities/user.entity';
import { SaleItem } from './sale-item.entity';

export enum SaleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  saleNumber: string; // Auto-generated sale number

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxRate: number; // Percentage

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ default: false })
  isDelivered: boolean;
  
  @Column({ default: false })
  isDeleted: boolean;
  
  @Column({ nullable: true })
  cancelledAt: Date;
  
  @Column({ nullable: true })
  estimatedDeliveryDate: Date;
  
  @Column({ nullable: true })
  trackingNumber: string;
  
  @Column({ nullable: true })
  shippingCarrier: string;
  
  @Column({ type: 'json', nullable: true })
  statusHistory: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn()
  customer: Customer;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn()
  seller: User | null; // The seller who made the sale

  @Column('uuid', { nullable: true })
  sellerId: string | null;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, {
    cascade: true,
    eager: true,
  })
  items: SaleItem[];

  // Computed properties
  get balanceAmount(): number {
    return this.totalAmount - this.paidAmount;
  }

  get isFullyPaid(): boolean {
    return this.paidAmount >= this.totalAmount;
  }
}

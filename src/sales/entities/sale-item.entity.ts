import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Motorcycle } from '../../motorcycles/entities/motorcycle.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  sale: Sale;

  @Column('uuid')
  saleId: string;

  @ManyToOne(() => Motorcycle, { onDelete: 'RESTRICT' })
  @JoinColumn()
  motorcycle: Motorcycle;

  @Column('uuid')
  motorcycleId: string;

  // Computed properties
  get finalPrice(): number {
    return this.totalPrice - this.discountAmount;
  }
}

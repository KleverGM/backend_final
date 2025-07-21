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
import { Motorcycle } from '../../motorcycles/entities/motorcycle.entity';

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  ON_ORDER = 'on_order',
  RESERVED = 'reserved',
  DAMAGED = 'damaged',
}

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sku: string; // Stock Keeping Unit

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  reservedQuantity: number;

  @Column({ default: 0 })
  minStockLevel: number;

  @Column({ default: 0 })
  maxStockLevel: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sellingPrice: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.IN_STOCK,
  })
  status: InventoryStatus;

  @Column({ nullable: true })
  location: string; // Warehouse location

  @Column({ nullable: true })
  supplier: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  lastRestockDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Motorcycle, { onDelete: 'CASCADE' })
  @JoinColumn()
  motorcycle: Motorcycle;

  @Column('uuid')
  motorcycleId: string;

  // Computed properties
  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  get isLowStock(): boolean {
    return this.quantity <= this.minStockLevel;
  }

  get isOutOfStock(): boolean {
    return this.quantity === 0;
  }
}

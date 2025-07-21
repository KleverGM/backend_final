import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { CartItem } from '../../cart/cart.entity';

export enum MotorcycleStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  DISCONTINUED = 'discontinued',
}

export enum FuelType {
  GASOLINE = 'gasoline',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SEMI_AUTOMATIC = 'semi_automatic',
}

@Entity('motorcycles')
export class Motorcycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  brand: string;

  @Column()
  @Index()
  model: string;

  @Column()
  year: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  vin: string;

  @Column()
  engine: string;

  @Column()
  displacement: number; // in cc

  @Column('decimal', { precision: 5, scale: 2 })
  power: number; // in HP

  @Column({
    type: 'enum',
    enum: FuelType,
    default: FuelType.GASOLINE,
  })
  fuelType: FuelType;

  @Column({
    type: 'enum',
    enum: TransmissionType,
    default: TransmissionType.MANUAL,
  })
  transmission: TransmissionType;

  @Column()
  color: string;

  @Column({ default: 0 })
  mileage: number;

  @Column({
    type: 'enum',
    enum: MotorcycleStatus,
    default: MotorcycleStatus.AVAILABLE,
  })
  status: MotorcycleStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  features: string[];

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Category, (category) => category.motorcycles)
  @JoinColumn()
  category: Category;

  @Column('uuid')
  categoryId: string;

  // Cart items relationship
  @OneToMany(() => CartItem, (cartItem) => cartItem.motorcycle, { cascade: true })
  cartItems: CartItem[];
}

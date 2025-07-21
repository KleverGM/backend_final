import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Motorcycle } from '../../motorcycles/entities/motorcycle.entity';

@Entity('wishlists')
@Unique(['customerId', 'motorcycleId'])
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  customerId: string;

  @Column('uuid')
  @Index()
  motorcycleId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Motorcycle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'motorcycleId' })
  motorcycle: Motorcycle;
}

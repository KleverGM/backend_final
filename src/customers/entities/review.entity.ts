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
import { Customer } from '../../customers/entities/customer.entity';
import { Motorcycle } from '../../motorcycles/entities/motorcycle.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  customerId: string;

  @Column('uuid')
  @Index()
  motorcycleId: string;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Motorcycle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'motorcycleId' })
  motorcycle: Motorcycle;
}

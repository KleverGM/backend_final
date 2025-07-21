import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CartItem } from '../../cart/cart.entity';
import { Wishlist } from './wishlist.entity';
import { Review } from './review.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => User, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  user: User;

  @Column('uuid')
  userId: string;

  // Cart items relationship
  @OneToMany(() => CartItem, (cartItem) => cartItem.customer, { cascade: true })
  cartItems: CartItem[];
  
  // Wishlist relationship
  @OneToMany(() => Wishlist, (wishlist) => wishlist.customer, { cascade: true })
  wishlistItems: Wishlist[];
  
  // Reviews relationship
  @OneToMany(() => Review, (review) => review.customer, { cascade: true })
  reviews: Review[];
  
  // Nuevos campos de perfil
  @Column({ nullable: true })
  preferredLanguage: string;
  
  @Column({ nullable: true })
  notificationPreference: string;
  
  @Column({ default: false })
  marketingOptIn: boolean;
  
  @Column({ type: 'json', nullable: true })
  preferences: any;

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

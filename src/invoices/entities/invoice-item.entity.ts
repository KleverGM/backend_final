import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  invoiceId: string;

  @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column('uuid')
  productId: string;

  @Column()
  productName: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalPrice: number;
}

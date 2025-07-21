import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  filename: string;

  @Column()
  mimetype: string;

  @Column('int')
  size: number;

  @Column()
  path: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  entityType: string; // 'motorcycle', 'customer', 'user'

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  uploadedBy: string; // User ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

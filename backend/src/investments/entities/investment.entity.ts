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
import { User } from '../../users/entities/user.entity';

@Entity('investments')
@Index(['userId']) // explicit index — every query filters by userId
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.investments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', nullable: false })
  investmentName: string;

  @Column({ type: 'varchar', nullable: false })
  investmentType: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
  investedAmount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
  currentValue: number;

  @Column({ type: 'date', nullable: false })
  purchaseDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity('stock_counts')
export class StockCount extends BaseEntity {
  @Index()
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  countDate!: Date;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int' })
  countedStock!: number;

  @Column({ type: 'int' })
  systemStock!: number;

  @Column({ type: 'int' })
  difference!: number;

  @Column({ type: 'varchar', length: 150 })
  counterName!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  approverName?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 50, default: 'COMPLETED' })
  status!: string;
}


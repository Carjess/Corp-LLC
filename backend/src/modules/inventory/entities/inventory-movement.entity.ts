import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { MovementType } from '../../../common/enums/movement-type.enum.js';
import { Product } from '../../products/entities/product.entity.js';

@Entity('inventory_movements')
export class InventoryMovement extends BaseEntity {
  @Index()
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  movementDate!: Date;

  @Index()
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type!: MovementType;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceDoc?: string;

  @Column({ type: 'varchar', length: 150 })
  responsible!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

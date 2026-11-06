import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder!: PurchaseOrder;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int' })
  quantityOrdered!: number;

  @Column({ type: 'int', default: 0 })
  quantityReceived!: number;
}


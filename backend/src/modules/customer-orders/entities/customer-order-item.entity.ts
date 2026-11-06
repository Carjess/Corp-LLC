import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { CustomerOrder } from './customer-order.entity.js';

@Entity('customer_order_items')
export class CustomerOrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => CustomerOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order!: CustomerOrder;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int' })
  quantityDemanded!: number;

  @Column({ type: 'int', default: 0 })
  quantityDispatched!: number;

  @Column({ type: 'int', default: 0 })
  quantityReserved!: number;
}


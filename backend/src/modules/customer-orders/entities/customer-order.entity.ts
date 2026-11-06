import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { OrderStatus } from '../../../common/enums/order-status.enum.js';
import { Customer } from '../../customers/entities/customer.entity.js';
import type { CustomerOrderItem } from './customer-order-item.entity.js';

@Entity('customer_orders')
export class CustomerOrder extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.customerOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  orderDate!: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany('CustomerOrderItem', 'order', { cascade: true })
  items!: CustomerOrderItem[];
}


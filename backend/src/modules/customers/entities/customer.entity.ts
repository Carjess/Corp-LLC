import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { CustomerOrder } from '../../customer-orders/entities/customer-order.entity.js';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactName?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @OneToMany('CustomerOrder', 'customer')
  customerOrders!: CustomerOrder[];
}

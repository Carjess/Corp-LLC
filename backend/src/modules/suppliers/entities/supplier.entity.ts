import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import type { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactName?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'int', default: 5 })
  leadTimeDays!: number;

  @OneToMany('PurchaseOrder', 'supplier')
  purchaseOrders!: PurchaseOrder[];
}

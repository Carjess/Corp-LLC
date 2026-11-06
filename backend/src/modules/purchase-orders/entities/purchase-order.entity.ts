import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { OrderStatus } from '../../../common/enums/order-status.enum.js';
import { Supplier } from '../../suppliers/entities/supplier.entity.js';
import type { PurchaseOrderItem } from './purchase-order-item.entity.js';
import type { GoodsReceipt } from '../../receipts/entities/goods-receipt.entity.js';

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  poNumber!: string;

  @Column({ type: 'uuid' })
  supplierId!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.purchaseOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'supplierId' })
  supplier!: Supplier;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  issueDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expectedDate?: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany('PurchaseOrderItem', 'purchaseOrder', { cascade: true })
  items!: PurchaseOrderItem[];

  @OneToMany('GoodsReceipt', 'purchaseOrder')
  receipts!: GoodsReceipt[];
}


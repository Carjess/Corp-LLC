import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';
import type { GoodsReceiptItem } from './goods-receipt-item.entity.js';

@Entity('goods_receipts')
export class GoodsReceipt extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  receiptNumber!: string;

  @Column({ type: 'uuid' })
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.receipts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder!: PurchaseOrder;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  receiptDate!: Date;

  @Column({ type: 'varchar', length: 150 })
  receiverName!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany('GoodsReceiptItem', 'receipt', { cascade: true })
  items!: GoodsReceiptItem[];
}


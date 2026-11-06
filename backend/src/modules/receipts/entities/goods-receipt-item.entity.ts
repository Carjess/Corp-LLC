import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { GoodsReceipt } from './goods-receipt.entity.js';

@Entity('goods_receipt_items')
export class GoodsReceiptItem extends BaseEntity {
  @Column({ type: 'uuid' })
  receiptId!: string;

  @ManyToOne(() => GoodsReceipt, (receipt) => receipt.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiptId' })
  receipt!: GoodsReceipt;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int' })
  quantityAccepted!: number;

  @Column({ type: 'int', default: 0 })
  quantityRejected!: number;
}


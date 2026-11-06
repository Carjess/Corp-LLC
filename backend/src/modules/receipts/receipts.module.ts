import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity.js';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { ReceiptsService } from './receipts.service.js';
import { ReceiptsController } from './receipts.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoodsReceipt,
      GoodsReceiptItem,
      PurchaseOrder,
      PurchaseOrderItem,
      InventoryMovement,
      Product,
    ]),
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService, TypeOrmModule],
})
export class ReceiptsModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { PurchaseOrdersController } from './purchase-orders.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderItem,
      Supplier,
      Product,
    ]),
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService, TypeOrmModule],
})
export class PurchaseOrdersModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ReplenishmentService } from './replenishment.service.js';
import { ReplenishmentController } from './replenishment.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      InventoryMovement,
      PurchaseOrderItem,
      Supplier,
    ]),
    InventoryModule,
  ],
  controllers: [ReplenishmentController],
  providers: [ReplenishmentService],
  exports: [ReplenishmentService],
})
export class ReplenishmentModule {}


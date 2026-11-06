import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity.js';
import { CustomerOrder } from '../customer-orders/entities/customer-order.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { StockCount } from '../stock-counts/entities/stock-count.entity.js';
import { ReplenishmentModule } from '../replenishment/replenishment.module.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      CustomerOrder,
      PurchaseOrder,
      InventoryMovement,
      StockCount,
    ]),
    ReplenishmentModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CustomerOrderItem } from '../customer-orders/entities/customer-order-item.entity.js';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovement,
      Product,
      CustomerOrderItem,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}


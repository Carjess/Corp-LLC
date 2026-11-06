import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrder } from './entities/customer-order.entity.js';
import { CustomerOrderItem } from './entities/customer-order-item.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { CustomerOrdersService } from './customer-orders.service.js';
import { CustomerOrdersController } from './customer-orders.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderItem,
      Customer,
      Product,
      InventoryMovement,
    ]),
  ],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService],
  exports: [CustomerOrdersService, TypeOrmModule],
})
export class CustomerOrdersModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockCount } from './entities/stock-count.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { StockCountsService } from './stock-counts.service.js';
import { StockCountsController } from './stock-counts.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockCount,
      Product,
      InventoryMovement,
    ]),
    InventoryModule,
  ],
  controllers: [StockCountsController],
  providers: [StockCountsService],
  exports: [StockCountsService, TypeOrmModule],
})
export class StockCountsModule {}


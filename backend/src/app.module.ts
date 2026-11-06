import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { databaseConfig } from './config/database.config.js';
import { SeedModule } from './database/seeds/seed.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { CustomerOrdersModule } from './modules/customer-orders/customer-orders.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot(databaseConfig()),
    SeedModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    CustomerOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}




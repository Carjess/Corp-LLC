import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as Entities from '../database/entities/index.js';

const entitiesList = [
  Entities.User,
  Entities.Category,
  Entities.Supplier,
  Entities.Customer,
  Entities.Product,
  Entities.InventoryMovement,
  Entities.CustomerOrder,
  Entities.CustomerOrderItem,
  Entities.PurchaseOrder,
  Entities.PurchaseOrderItem,
  Entities.GoodsReceipt,
  Entities.GoodsReceiptItem,
  Entities.StockCount,
];

export const buildDataSourceOptions = (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || process.env.DB_PORT || 5432),
  username: process.env.DATABASE_USER || process.env.DB_USER || 'juliam_user',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'juliam_secure_pass_2026',
  database: process.env.DATABASE_NAME || process.env.DB_NAME || 'juliam_inventory',
  entities: entitiesList,
  synchronize: true, // Sincronización automática de esquema relacional para el entorno de MVP
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const databaseConfig = (): TypeOrmModuleOptions => ({
  ...buildDataSourceOptions(),
  autoLoadEntities: true,
  retryAttempts: 5,
  retryDelay: 3000,
});

export const createAppDataSource = (): DataSource =>
  new DataSource(buildDataSourceOptions());


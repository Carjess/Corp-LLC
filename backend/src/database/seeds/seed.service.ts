import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity.js';
import { Category } from '../../modules/categories/entities/category.entity.js';
import { Supplier } from '../../modules/suppliers/entities/supplier.entity.js';
import { Customer } from '../../modules/customers/entities/customer.entity.js';
import { Product } from '../../modules/products/entities/product.entity.js';
import { InventoryMovement } from '../../modules/inventory/entities/inventory-movement.entity.js';
import { PurchaseOrder } from '../../modules/purchase-orders/entities/purchase-order.entity.js';
import { PurchaseOrderItem } from '../../modules/purchase-orders/entities/purchase-order-item.entity.js';
import { GoodsReceipt } from '../../modules/receipts/entities/goods-receipt.entity.js';
import { GoodsReceiptItem } from '../../modules/receipts/entities/goods-receipt-item.entity.js';
import { CustomerOrder } from '../../modules/customer-orders/entities/customer-order.entity.js';
import { CustomerOrderItem } from '../../modules/customer-orders/entities/customer-order-item.entity.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { MovementType } from '../../common/enums/movement-type.enum.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.seedAll();
  }

  async seedAll() {
    const userRepo = this.dataSource.getRepository(User);
    const existingAdmin = await userRepo.findOneBy({ email: 'admin@juliam.com' });

    if (existingAdmin) {
      this.logger.log('Base de datos ya inicializada con semillas previas.');
      return;
    }

    this.logger.log('Iniciando inyección de datos semilla (Semillas del Caso de Negocio)...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Usuario Administrador Predeterminado
      const admin = queryRunner.manager.create(User, {
        name: 'Administrador Juliam',
        email: 'admin@juliam.com',
        password: 'admin123',
        role: UserRole.ADMIN,
        isActive: true,
      });
      await queryRunner.manager.save(admin);

      // 2. Categorías Oficiales de Juliam Corp LLC
      const categoriesData = [
        { name: 'Vasos', description: 'Vasos descartables, térmicos y cristal' },
        { name: 'Envases', description: 'Contenedores plásticos, térmicos y de aluminio' },
        { name: 'Cubiertos', description: 'Cubiertos desechables individuales y en kit' },
        { name: 'Servilletas', description: 'Servilletas para mesa y dispensador' },
        { name: 'Empaques', description: 'Bolsas kraft, cajas y papel para envolver' },
      ];

      const categoriesMap = new Map<string, Category>();
      for (const catData of categoriesData) {
        const cat = queryRunner.manager.create(Category, catData);
        const savedCat = await queryRunner.manager.save(cat);
        categoriesMap.set(savedCat.name, savedCat);
      }

      // 3. Catálogo Maestro de Productos Oficiales (5 SKUs Base)
      const productsData = [
        {
          sku: 'VAS-001',
          name: 'Vaso Plástico Transparente 12 oz',
          description: 'Paquete x 50 unidades para bebidas frías',
          category: categoriesMap.get('Vasos')!,
          unitMeasure: 'Paquete',
          conversionFactor: 50,
          minStock: 100,
          securityStock: 120,
        },
        {
          sku: 'ENV-001',
          name: 'Contenedor Térmico para Alimentos #1',
          description: 'Fardo x 100 unidades térmico con tapa bisagra',
          category: categoriesMap.get('Envases')!,
          unitMeasure: 'Fardo',
          conversionFactor: 100,
          minStock: 80,
          securityStock: 90,
        },
        {
          sku: 'CUB-001',
          name: 'Juego de Cubiertos Desechables 3 en 1',
          description: 'Caja x 250 kits (tenedor, cuchillo, servilleta)',
          category: categoriesMap.get('Cubiertos')!,
          unitMeasure: 'Caja',
          conversionFactor: 250,
          minStock: 60,
          securityStock: 70,
        },
        {
          sku: 'SER-001',
          name: 'Servilleta Blanca Dispensador 100u',
          description: 'Paquete x 100 servilletas interplegadas',
          category: categoriesMap.get('Servilletas')!,
          unitMeasure: 'Paquete',
          conversionFactor: 100,
          minStock: 120,
          securityStock: 150,
        },
        {
          sku: 'EMP-001',
          name: 'Bolsa de Papel Kraft Mediana #8',
          description: 'Millar x 1000 bolsas de fondo plano',
          category: categoriesMap.get('Empaques')!,
          unitMeasure: 'Millar',
          conversionFactor: 1000,
          minStock: 50,
          securityStock: 60,
        },
      ];

      const productsMap = new Map<string, Product>();
      for (const prodData of productsData) {
        const prod = queryRunner.manager.create(Product, {
          ...prodData,
          categoryId: prodData.category.id,
        });
        const savedProd = await queryRunner.manager.save(prod);
        productsMap.set(savedProd.sku, savedProd);
      }

      // 4. Proveedor Oficial de Suministros
      const supplier = queryRunner.manager.create(Supplier, {
        name: 'Distribuidora Plásticos del Norte C.A.',
        contactName: 'Ing. Roberto Méndez',
        email: 'ventas@plasticosnorte.com',
        phone: '+58 412 1234567',
        leadTimeDays: 5,
      });
      await queryRunner.manager.save(supplier);

      // 5. Cliente Distribuidor
      const customer = queryRunner.manager.create(Customer, {
        name: 'Distribuidora Gastronómica Express',
        contactName: 'Lcda. Mariana Salazar',
        email: 'pedidos@gastroexpress.com',
        phone: '+58 414 7654321',
        address: 'Av. Principal Los Restaurantes, Local 4B',
      });
      await queryRunner.manager.save(customer);

      // 6. Kardex Inicial (Conteo físico inicial auditado del Día 1)
      const initialStock = [
        { sku: 'VAS-001', qty: 80 },  // 80 iniciales del caso de estudio
        { sku: 'ENV-001', qty: 150 },
        { sku: 'CUB-001', qty: 100 },
        { sku: 'SER-001', qty: 180 },
        { sku: 'EMP-001', qty: 90 },
      ];

      for (const item of initialStock) {
        const product = productsMap.get(item.sku)!;
        const initialMov = queryRunner.manager.create(InventoryMovement, {
          productId: product.id,
          type: MovementType.ENTRADA,
          quantity: item.qty,
          referenceDoc: 'CONTEO-INI',
          responsible: 'Auditor Almacén Día 1',
          notes: 'Conteo físico verificado de arranque operativo',
        });
        await queryRunner.manager.save(initialMov);
      }

      // 7. Escenario de los 500 Vasos (Abastecimiento y Recepción Parcial):
      // - Orden de compra COM-001 por 500 vasos VAS-001
      // - Recepción REC-001 de 300 unidades físicas verificadas
      // - Saldo abierto: 200 en tránsito
      const po = queryRunner.manager.create(PurchaseOrder, {
        poNumber: 'COM-001',
        supplierId: supplier.id,
        status: OrderStatus.PARTIAL,
        expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: 'Pedido mensual de vasos plásticos para distribuidores',
      });
      const savedPo = await queryRunner.manager.save(po);

      const vasProduct = productsMap.get('VAS-001')!;
      const poItem = queryRunner.manager.create(PurchaseOrderItem, {
        purchaseOrderId: savedPo.id,
        productId: vasProduct.id,
        quantityOrdered: 500,
        quantityReceived: 300,
      });
      await queryRunner.manager.save(poItem);

      // Acta de Recepción Física (REC-001)
      const receipt = queryRunner.manager.create(GoodsReceipt, {
        receiptNumber: 'REC-001',
        purchaseOrderId: savedPo.id,
        receiverName: 'Carlos Gómez (Recepción)',
        notes: 'Entrega parcial en buen estado. Pendientes 200 paquetes según guía de remisión.',
      });
      const savedReceipt = await queryRunner.manager.save(receipt);

      const receiptItem = queryRunner.manager.create(GoodsReceiptItem, {
        receiptId: savedReceipt.id,
        productId: vasProduct.id,
        quantityAccepted: 300,
        quantityRejected: 0,
      });
      await queryRunner.manager.save(receiptItem);

      // Movimiento en Kardex por la recepción de las 300 unidades físicas
      const receiptMovement = queryRunner.manager.create(InventoryMovement, {
        productId: vasProduct.id,
        type: MovementType.ENTRADA,
        quantity: 300,
        referenceDoc: 'REC-001',
        responsible: 'Carlos Gómez (Recepción)',
        notes: 'Ingreso al almacén por recepción física verificada (COM-001)',
      });
      await queryRunner.manager.save(receiptMovement);

      // 8. Escenario de Demanda y Reserva (Pedido Distribuidor PED-001):
      // - Cliente solicita 60 paquetes de vasos VAS-001
      // - Unidades reservadas: 60 (no pueden despacharse a nadie más)
      const customerOrder = queryRunner.manager.create(CustomerOrder, {
        orderNumber: 'PED-001',
        customerId: customer.id,
        status: OrderStatus.PENDING,
        notes: 'Pedido semanal para cadena de pizzerías aliadas',
      });
      const savedCustomerOrder = await queryRunner.manager.save(customerOrder);

      const orderItem = queryRunner.manager.create(CustomerOrderItem, {
        orderId: savedCustomerOrder.id,
        productId: vasProduct.id,
        quantityDemanded: 60,
        quantityDispatched: 0,
        quantityReserved: 60,
      });
      await queryRunner.manager.save(orderItem);

      await queryRunner.commitTransaction();
      this.logger.log('Semillas inyectadas exitosamente: Catálogo, Kardex, 500 Vasos, Recepción y Reservas listos.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al inyectar semillas en la base de datos:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}


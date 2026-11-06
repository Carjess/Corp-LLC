import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { MovementType } from '../../common/enums/movement-type.enum.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import { InventoryService } from '../inventory/inventory.service.js';
import {
  FilterReplenishmentDto,
  ReplenishmentStatusFilter,
} from './dto/filter-replenishment.dto.js';

export interface ProductReplenishmentRop {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  unitMeasure: string;
  dailyDemand: number;
  leadTimeDays: number;
  securityStock: number;
  reorderPoint: number;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  inTransitStock: number;
  inventoryPosition: number;
  status: 'REORDEN' | 'OK';
  suggestedOrderQty: number;
  supplierName: string;
  supplierId?: string;
}

export interface ReplenishmentDashboardSummary {
  totalActiveSkus: number;
  criticalReorderCount: number;
  safeStockCount: number;
  totalInTransitUnits: number;
  items: ProductReplenishmentRop[];
}

@Injectable()
export class ReplenishmentService {
  private readonly logger = new Logger(ReplenishmentService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly inventoryService: InventoryService,
  ) {}

  // ==========================================
  // Análisis de Reposición y Punto de Reorden
  // ==========================================
  async getReplenishmentAnalysis(
    filter?: FilterReplenishmentDto,
  ): Promise<ReplenishmentDashboardSummary> {
    // 1. Catálogo activo de productos
    const productQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    if (filter?.categoryId) {
      productQuery.andWhere('product.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    productQuery.orderBy('product.sku', 'ASC');
    const products = await productQuery.getMany();

    // 2. Parámetros de proveedor por defecto
    const suppliers = await this.supplierRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    const defaultSupplier = suppliers[0] || null;
    const defaultLeadTime = defaultSupplier?.leadTimeDays || 5;
    const defaultSupplierName = defaultSupplier?.name || 'Distribuidora Principal';
    const defaultSupplierId = defaultSupplier?.id;

    // 3. Mercancía en tránsito (Órdenes de compra abiertas)
    const transitRows = await this.poItemRepository
      .createQueryBuilder('poi')
      .innerJoin('poi.purchaseOrder', 'po')
      .select('poi.productId', 'productId')
      .addSelect(
        'COALESCE(SUM(poi.quantityOrdered - poi.quantityReceived), 0)',
        'inTransit',
      )
      .where('po.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.PARTIAL],
      })
      .groupBy('poi.productId')
      .getRawMany<{ productId: string; inTransit: string }>();

    const transitMap = new Map<string, number>();
    for (const row of transitRows) {
      transitMap.set(row.productId, Math.max(0, parseInt(row.inTransit, 10) || 0));
    }

    // 4. Demanda histórica de salidas
    const demandRows = await this.movementRepository
      .createQueryBuilder('mov')
      .select('mov.productId', 'productId')
      .addSelect('COALESCE(SUM(mov.quantity), 0)', 'totalSalidas')
      .where('mov.type = :type', { type: MovementType.SALIDA })
      .groupBy('mov.productId')
      .getRawMany<{ productId: string; totalSalidas: string }>();

    const demandMap = new Map<string, number>();
    for (const row of demandRows) {
      demandMap.set(row.productId, parseInt(row.totalSalidas, 10) || 0);
    }

    // 5. Saldos consolidados de stock
    const stockSummaries = await this.inventoryService.getStockSummary();
    const stockMap = new Map<string, (typeof stockSummaries)[0]>();
    for (const s of stockSummaries) {
      stockMap.set(s.productId, s);
    }

    // 6. Cálculo del modelo ROP por producto
    const allItems: ProductReplenishmentRop[] = [];

    for (const prod of products) {
      const stock = stockMap.get(prod.id);
      const physicalStock = stock ? stock.physicalStock : 0;
      const reservedStock = stock ? stock.reservedStock : 0;
      const availableStock = stock ? stock.availableStock : 0;

      const inTransitStock = transitMap.get(prod.id) || 0;
      const totalSalidas = demandMap.get(prod.id) || 0;
      const dailyDemand = totalSalidas > 0
        ? Math.max(1, Math.round(totalSalidas / 7))
        : Math.max(1, Math.round(prod.minStock / 10));

      const leadTimeDays = defaultLeadTime;
      const securityStock = prod.securityStock;
      const reorderPoint = (dailyDemand * leadTimeDays) + securityStock;
      const inventoryPosition = availableStock + inTransitStock;

      const isReorder = inventoryPosition <= reorderPoint;
      const status: 'REORDEN' | 'OK' = isReorder ? 'REORDEN' : 'OK';

      let suggestedOrderQty = 0;
      if (isReorder) {
        const optimalLevel = reorderPoint + securityStock;
        suggestedOrderQty = Math.max(0, optimalLevel - inventoryPosition);
      }

      allItems.push({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        categoryName: prod.category?.name || 'General',
        unitMeasure: prod.unitMeasure,
        dailyDemand,
        leadTimeDays,
        securityStock,
        reorderPoint,
        physicalStock,
        reservedStock,
        availableStock,
        inTransitStock,
        inventoryPosition,
        status,
        suggestedOrderQty,
        supplierName: defaultSupplierName,
        supplierId: defaultSupplierId,
      });
    }

    // 7. Filtros de búsqueda y estado
    let filteredItems = allItems;

    if (filter?.status && filter.status !== ReplenishmentStatusFilter.ALL) {
      filteredItems = filteredItems.filter((i) => i.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      filteredItems = filteredItems.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.categoryName.toLowerCase().includes(q),
      );
    }

    const totalActiveSkus = allItems.length;
    const criticalReorderCount = allItems.filter((i) => i.status === 'REORDEN').length;
    const safeStockCount = allItems.filter((i) => i.status === 'OK').length;
    const totalInTransitUnits = allItems.reduce(
      (sum, i) => sum + i.inTransitStock,
      0,
    );

    return {
      totalActiveSkus,
      criticalReorderCount,
      safeStockCount,
      totalInTransitUnits,
      items: filteredItems,
    };
  }

  // ==========================================
  // Alertas Críticas de Reposición
  // ==========================================
  async getUrgentAlerts(): Promise<ProductReplenishmentRop[]> {
    const analysis = await this.getReplenishmentAnalysis({
      status: ReplenishmentStatusFilter.REORDEN,
    });
    return analysis.items;
  }
}
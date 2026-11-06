import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity.js';
import { CustomerOrder } from '../customer-orders/entities/customer-order.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { StockCount } from '../stock-counts/entities/stock-count.entity.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import {
  ProductReplenishmentRop,
  ReplenishmentService,
} from '../replenishment/replenishment.service.js';

export interface DashboardKpis {
  totalActiveSkus: number;
  criticalReorderSkus: number;
  safeStockSkus: number;
  pendingCustomerOrders: number;
  inTransitPurchaseOrders: number;
  totalInTransitUnits: number;
  recentAuditsCount: number;
}

export interface DashboardResponse {
  kpis: DashboardKpis;
  criticalAlerts: ProductReplenishmentRop[];
  recentMovements: InventoryMovement[];
  ordersSummary: {
    pendingCount: number;
    completedCount: number;
    cancelledCount: number;
  };
  purchasesSummary: {
    inTransitCount: number;
    completedCount: number;
  };
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CustomerOrder)
    private readonly customerOrderRepository: Repository<CustomerOrder>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(StockCount)
    private readonly stockCountRepository: Repository<StockCount>,
    private readonly replenishmentService: ReplenishmentService,
  ) {}

  // ==========================================
  // Estadísticas y Métricas Consolidadas
  // ==========================================
  async getDashboardStats(): Promise<DashboardResponse> {
    // 1. Resumen de Reposición y ROP
    const replenishment = await this.replenishmentService.getReplenishmentAnalysis();
    const urgentAlerts = await this.replenishmentService.getUrgentAlerts();

    // 2. Conteo de pedidos de clientes por estado
    const customerOrders = await this.customerOrderRepository.find({
      select: { id: true, status: true },
    });
    const pendingCustomerOrders = customerOrders.filter(
      (o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PARTIAL,
    ).length;
    const completedCustomerOrders = customerOrders.filter(
      (o) => o.status === OrderStatus.COMPLETED,
    ).length;
    const cancelledCustomerOrders = customerOrders.filter(
      (o) => o.status === OrderStatus.CANCELLED,
    ).length;

    // 3. Conteo de órdenes de compra a proveedores
    const purchaseOrders = await this.purchaseOrderRepository.find({
      select: { id: true, status: true },
    });
    const inTransitPurchaseOrders = purchaseOrders.filter(
      (po) => po.status === OrderStatus.PENDING || po.status === OrderStatus.PARTIAL,
    ).length;
    const completedPurchaseOrders = purchaseOrders.filter(
      (po) => po.status === OrderStatus.COMPLETED,
    ).length;

    // 4. Conteo de auditorías físicas registradas
    const recentAuditsCount = await this.stockCountRepository.count();

    // 5. Últimos movimientos registrados en el Kardex
    const recentMovements = await this.movementRepository.find({
      relations: {
        product: {
          category: true,
        },
      },
      order: {
        movementDate: 'DESC',
      },
      take: 8,
    });

    return {
      kpis: {
        totalActiveSkus: replenishment.totalActiveSkus,
        criticalReorderSkus: replenishment.criticalReorderCount,
        safeStockSkus: replenishment.safeStockCount,
        pendingCustomerOrders,
        inTransitPurchaseOrders,
        totalInTransitUnits: replenishment.totalInTransitUnits,
        recentAuditsCount,
      },
      criticalAlerts: urgentAlerts.slice(0, 5),
      recentMovements,
      ordersSummary: {
        pendingCount: pendingCustomerOrders,
        completedCount: completedCustomerOrders,
        cancelledCount: cancelledCustomerOrders,
      },
      purchasesSummary: {
        inTransitCount: inTransitPurchaseOrders,
        completedCount: completedPurchaseOrders,
      },
    };
  }
}


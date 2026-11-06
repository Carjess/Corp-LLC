import type { ProductReplenishmentRop } from '../replenishment/replenishment.types.js';
import type { InventoryMovement } from '../inventory/inventory.types.js';

export interface DashboardKpis {
  totalActiveSkus: number;
  criticalReorderSkus: number;
  safeStockSkus: number;
  pendingCustomerOrders: number;
  inTransitPurchaseOrders: number;
  totalInTransitUnits: number;
  recentAuditsCount: number;
}

export interface DashboardStats {
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


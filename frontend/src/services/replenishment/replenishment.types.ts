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

export interface FilterReplenishmentParams {
  status?: 'ALL' | 'REORDEN' | 'OK';
  categoryId?: string;
  search?: string;
}


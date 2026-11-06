import type { Product } from '../products/products.types.js';

export interface StockCount {
  id: string;
  countDate: string;
  productId: string;
  product?: Product;
  countedStock: number;
  systemStock: number;
  difference: number;
  counterName: string;
  approverName?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockCountInput {
  productId: string;
  countedStock: number;
  counterName?: string;
  approverName?: string;
  notes?: string;
  applyAdjustment?: boolean;
}

export interface FilterStockCountParams {
  productId?: string;
  search?: string;
  status?: string;
}


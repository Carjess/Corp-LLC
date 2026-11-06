import type { Product } from '../products/products.types.js';

export interface ProductStockSummary {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  unitMeasure: string;
  conversionFactor: number;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  securityStock: number;
  statusAlert: 'CRITICO' | 'BAJO' | 'OK';
}

export type MovementType =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO';

export interface InventoryMovement {
  id: string;
  movementDate: string;
  productId: string;
  product?: Product;
  type: MovementType;
  quantity: number;
  referenceDoc?: string;
  responsible: string;
  notes?: string;
  createdAt: string;
}

export interface CreateMovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  referenceDoc?: string;
  responsible: string;
  notes?: string;
}

export interface MovementQueryParams {
  productId?: string;
  type?: MovementType;
  limit?: number;
}


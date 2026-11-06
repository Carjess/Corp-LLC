import { httpClient } from '../../lib/http/http-client.js';
import type {
  CreateMovementInput,
  InventoryMovement,
  MovementQueryParams,
  ProductStockSummary,
} from './inventory.types.js';

export const inventoryService = {
  getStockSummary(): Promise<ProductStockSummary[]> {
    return httpClient.get<ProductStockSummary[]>('/inventory/stock');
  },

  getProductStock(productId: string): Promise<ProductStockSummary> {
    return httpClient.get<ProductStockSummary>(`/inventory/stock/${productId}`);
  },

  getMovements(params?: MovementQueryParams): Promise<InventoryMovement[]> {
    const query = new URLSearchParams();
    if (params?.productId) query.append('productId', params.productId);
    if (params?.type) query.append('type', params.type);
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());

    const qs = query.toString();
    return httpClient.get<InventoryMovement[]>(`/inventory/movements${qs ? `?${qs}` : ''}`);
  },

  createMovement(data: CreateMovementInput): Promise<InventoryMovement> {
    return httpClient.post<InventoryMovement>('/inventory/movements', data);
  },
};


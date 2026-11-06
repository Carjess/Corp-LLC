import { httpClient } from '../../lib/http/http-client.js';
import type {
  CreatePurchaseOrderInput,
  FilterPurchaseOrderParams,
  PurchaseOrder,
} from './purchase-orders.types.js';

export const purchaseOrdersService = {
  getOrders(params?: FilterPurchaseOrderParams): Promise<PurchaseOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return httpClient.get<PurchaseOrder[]>(`/purchase-orders${qs ? `?${qs}` : ''}`);
  },

  getOrderById(id: string): Promise<PurchaseOrder> {
    return httpClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  },

  createOrder(data: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    return httpClient.post<PurchaseOrder>('/purchase-orders', data);
  },

  cancelOrder(id: string, notes?: string): Promise<PurchaseOrder> {
    return httpClient.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`, { notes });
  },
};


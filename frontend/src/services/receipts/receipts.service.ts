import { httpClient } from '../../lib/http/http-client.js';
import type {
  CreateGoodsReceiptInput,
  FilterGoodsReceiptParams,
  GoodsReceipt,
} from './receipts.types.js';

export const receiptsService = {
  getReceipts(params?: FilterGoodsReceiptParams): Promise<GoodsReceipt[]> {
    const query = new URLSearchParams();
    if (params?.purchaseOrderId) query.append('purchaseOrderId', params.purchaseOrderId);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return httpClient.get<GoodsReceipt[]>(`/receipts${qs ? `?${qs}` : ''}`);
  },

  getReceiptById(id: string): Promise<GoodsReceipt> {
    return httpClient.get<GoodsReceipt>(`/receipts/${id}`);
  },

  createReceipt(data: CreateGoodsReceiptInput): Promise<GoodsReceipt> {
    return httpClient.post<GoodsReceipt>('/receipts', data);
  },
};


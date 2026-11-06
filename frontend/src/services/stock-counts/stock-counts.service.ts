import { httpClient } from '../../lib/http/http-client.js';
import type {
  CreateStockCountInput,
  FilterStockCountParams,
  StockCount,
} from './stock-counts.types.js';

export const stockCountsService = {
  getCounts(params?: FilterStockCountParams): Promise<StockCount[]> {
    const query = new URLSearchParams();
    if (params?.productId) query.append('productId', params.productId);
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);

    const qs = query.toString();
    return httpClient.get<StockCount[]>(`/stock-counts${qs ? `?${qs}` : ''}`);
  },

  getCountById(id: string): Promise<StockCount> {
    return httpClient.get<StockCount>(`/stock-counts/${id}`);
  },

  createCount(data: CreateStockCountInput): Promise<StockCount> {
    return httpClient.post<StockCount>('/stock-counts', data);
  },
};


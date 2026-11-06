import { httpClient } from '../../lib/http/http-client.js';
import type {
  CreateCustomerOrderInput,
  CustomerOrder,
  DispatchOrderInput,
  FilterCustomerOrderParams,
} from './customer-orders.types.js';

export const customerOrdersService = {
  getOrders(params?: FilterCustomerOrderParams): Promise<CustomerOrder[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return httpClient.get<CustomerOrder[]>(`/customer-orders${qs ? `?${qs}` : ''}`);
  },

  getOrderById(id: string): Promise<CustomerOrder> {
    return httpClient.get<CustomerOrder>(`/customer-orders/${id}`);
  },

  createOrder(data: CreateCustomerOrderInput): Promise<CustomerOrder> {
    return httpClient.post<CustomerOrder>('/customer-orders', data);
  },

  dispatchOrder(id: string, data: DispatchOrderInput): Promise<CustomerOrder> {
    return httpClient.post<CustomerOrder>(`/customer-orders/${id}/dispatch`, data);
  },

  cancelOrder(id: string, notes?: string): Promise<CustomerOrder> {
    return httpClient.post<CustomerOrder>(`/customer-orders/${id}/cancel`, { notes });
  },
};


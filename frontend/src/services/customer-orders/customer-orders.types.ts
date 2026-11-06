import type { Customer } from '../customers/customers.types.js';
import type { Product } from '../products/products.types.js';

export type OrderStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';

export interface CustomerOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantityDemanded: number;
  quantityDispatched: number;
  quantityReserved: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  orderDate: string;
  status: OrderStatus;
  notes?: string;
  items: CustomerOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderItemInput {
  productId: string;
  quantityDemanded: number;
}

export interface CreateCustomerOrderInput {
  customerId: string;
  orderNumber?: string;
  notes?: string;
  items: CustomerOrderItemInput[];
}

export interface DispatchItemInput {
  itemId: string;
  quantity: number;
}

export interface DispatchOrderInput {
  responsible?: string;
  notes?: string;
  items?: DispatchItemInput[];
}

export interface FilterCustomerOrderParams {
  status?: OrderStatus;
  customerId?: string;
  search?: string;
}


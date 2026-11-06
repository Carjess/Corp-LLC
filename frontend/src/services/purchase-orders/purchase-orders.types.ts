import type { Supplier } from '../suppliers/suppliers.types.js';
import type { Product } from '../products/products.types.js';
import type { OrderStatus } from '../customer-orders/customer-orders.types.js';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  quantityOrdered: number;
  quantityReceived: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  receiverName: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  issueDate: string;
  expectedDate?: string;
  status: OrderStatus;
  notes?: string;
  items: PurchaseOrderItem[];
  receipts?: PurchaseOrderReceipt[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemInput {
  productId: string;
  quantityOrdered: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  poNumber?: string;
  expectedDate?: string;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export interface FilterPurchaseOrderParams {
  status?: OrderStatus;
  supplierId?: string;
  search?: string;
}


import type { Product } from '../products/products.types.js';
import type { PurchaseOrder } from '../purchase-orders/purchase-orders.types.js';

export interface GoodsReceiptItem {
  id: string;
  receiptId: string;
  productId: string;
  product?: Product;
  quantityAccepted: number;
  quantityRejected: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  receiptDate: string;
  receiverName: string;
  notes?: string;
  items: GoodsReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptItemInput {
  productId: string;
  quantityAccepted: number;
  quantityRejected?: number;
}

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string;
  receiptNumber?: string;
  receiverName?: string;
  notes?: string;
  items: GoodsReceiptItemInput[];
}

export interface FilterGoodsReceiptParams {
  purchaseOrderId?: string;
  search?: string;
}


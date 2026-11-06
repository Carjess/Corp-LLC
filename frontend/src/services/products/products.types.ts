import type { Category } from '../categories/categories.types.js';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  unitMeasure: string;
  conversionFactor: number;
  minStock: number;
  securityStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitMeasure: string;
  conversionFactor?: number;
  minStock?: number;
  securityStock?: number;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  unitMeasure?: string;
  conversionFactor?: number;
  minStock?: number;
  securityStock?: number;
  isActive?: boolean;
}

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  isActive?: string;
}


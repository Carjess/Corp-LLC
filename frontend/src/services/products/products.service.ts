import { httpClient } from '../../lib/http/http-client.js';
import type {
  CreateProductInput,
  Product,
  ProductQueryParams,
  UpdateProductInput,
} from './products.types.js';

export const productsService = {
  getProducts(params?: ProductQueryParams): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.isActive !== undefined) query.append('isActive', params.isActive);

    const qs = query.toString();
    return httpClient.get<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProductById(id: string): Promise<Product> {
    return httpClient.get<Product>(`/products/${id}`);
  },

  createProduct(data: CreateProductInput): Promise<Product> {
    return httpClient.post<Product>('/products', data);
  },

  updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    return httpClient.patch<Product>(`/products/${id}`, data);
  },

  toggleProductStatus(id: string): Promise<Product> {
    return httpClient.patch<Product>(`/products/${id}/toggle-status`, {});
  },
};


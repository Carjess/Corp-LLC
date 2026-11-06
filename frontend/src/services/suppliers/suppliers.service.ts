import { httpClient } from '../../lib/http/http-client.js';
import type { CreateSupplierInput, Supplier } from './suppliers.types.js';

export const suppliersService = {
  getSuppliers(): Promise<Supplier[]> {
    return httpClient.get<Supplier[]>('/suppliers');
  },

  getSupplierById(id: string): Promise<Supplier> {
    return httpClient.get<Supplier>(`/suppliers/${id}`);
  },

  createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    return httpClient.post<Supplier>('/suppliers', data);
  },
};


import { httpClient } from '../../lib/http/http-client.js';
import type { CreateCustomerInput, Customer } from './customers.types.js';

export const customersService = {
  getCustomers(): Promise<Customer[]> {
    return httpClient.get<Customer[]>('/customers');
  },

  getCustomerById(id: string): Promise<Customer> {
    return httpClient.get<Customer>(`/customers/${id}`);
  },

  createCustomer(data: CreateCustomerInput): Promise<Customer> {
    return httpClient.post<Customer>('/customers', data);
  },
};


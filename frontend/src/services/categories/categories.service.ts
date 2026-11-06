import { httpClient } from '../../lib/http/http-client.js';
import type { Category } from './categories.types.js';

export const categoriesService = {
  getCategories(): Promise<Category[]> {
    return httpClient.get<Category[]>('/categories');
  },

  getCategoryById(id: string): Promise<Category> {
    return httpClient.get<Category>(`/categories/${id}`);
  },
};


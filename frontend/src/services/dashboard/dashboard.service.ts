import { httpClient } from '../../lib/http/http-client.js';
import type { DashboardStats } from './dashboard.types.js';

export const dashboardService = {
  // 1. Consulta de métricas consolidadas en tiempo real
  getStats(): Promise<DashboardStats> {
    return httpClient.get<DashboardStats>('/dashboard/stats');
  },
};


import { httpClient } from '../../lib/http/http-client.js';
import type {
  FilterReplenishmentParams,
  ProductReplenishmentRop,
  ReplenishmentDashboardSummary,
} from './replenishment.types.js';

export const replenishmentService = {
  // 1. Resumen y análisis general ROP
  getReplenishmentSummary(
    params?: FilterReplenishmentParams,
  ): Promise<ReplenishmentDashboardSummary> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return httpClient.get<ReplenishmentDashboardSummary>(
      `/replenishment${qs ? `?${qs}` : ''}`,
    );
  },

  // 2. Alertas críticas de compra urgente
  getUrgentAlerts(): Promise<ProductReplenishmentRop[]> {
    return httpClient.get<ProductReplenishmentRop[]>('/replenishment/alerts');
  },
};


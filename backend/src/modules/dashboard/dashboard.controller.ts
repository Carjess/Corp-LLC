import { Controller, Get } from '@nestjs/common';
import { DashboardResponse, DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // 1. Consulta de estadísticas operativas y gerenciales
  @Get('stats')
  async getStats(): Promise<DashboardResponse> {
    return this.dashboardService.getDashboardStats();
  }
}


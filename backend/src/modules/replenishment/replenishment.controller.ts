import { Controller, Get, Query } from '@nestjs/common';
import { ReplenishmentService } from './replenishment.service.js';
import { FilterReplenishmentDto } from './dto/filter-replenishment.dto.js';

@Controller('replenishment')
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  @Get()
  async getAnalysis(@Query() filter: FilterReplenishmentDto) {
    return this.replenishmentService.getReplenishmentAnalysis(filter);
  }

  @Get('alerts')
  async getAlerts() {
    return this.replenishmentService.getUrgentAlerts();
  }
}


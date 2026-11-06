import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { FilterMovementDto } from './dto/filter-movement.dto.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Obtiene los saldos de inventario consolidados (Físico, Reservado, Disponible)
   */
  @Get('stock')
  getStockSummary(@Query('productId') productId?: string) {
    return this.inventoryService.getStockSummary(productId);
  }

  /**
   * Obtiene el saldo consolidado de un producto específico
   */
  @Get('stock/:productId')
  getProductStock(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.getStockSummary(productId);
  }

  /**
   * Consulta el libro mayor / Kardex inmutable
   */
  @Get('movements')
  getMovements(@Query() filter: FilterMovementDto) {
    return this.inventoryService.getMovements(filter);
  }

  /**
   * Registra una transacción física unitaria en el Kardex
   */
  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.inventoryService.createMovement(dto);
  }
}


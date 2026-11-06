import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  async findAll(@Query() filter: FilterPurchaseOrderDto): Promise<PurchaseOrder[]> {
    return this.poService.findAll(filter);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<PurchaseOrder> {
    return this.poService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    return this.poService.create(dto);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ): Promise<PurchaseOrder> {
    return this.poService.cancel(id, notes);
  }
}


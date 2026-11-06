import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { StockCountsService } from './stock-counts.service.js';
import { CreateStockCountDto } from './dto/create-stock-count.dto.js';
import { FilterStockCountDto } from './dto/filter-stock-count.dto.js';

@Controller('stock-counts')
export class StockCountsController {
  constructor(private readonly stockCountsService: StockCountsService) {}

  @Get()
  async findAll(@Query() filter: FilterStockCountDto) {
    return this.stockCountsService.findAll(filter);
  }

  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.stockCountsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateStockCountDto) {
    return this.stockCountsService.create(dto);
  }
}


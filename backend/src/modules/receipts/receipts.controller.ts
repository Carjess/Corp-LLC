import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service.js';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto.js';
import { FilterGoodsReceiptDto } from './dto/filter-goods-receipt.dto.js';

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  async findAll(@Query() filter: FilterGoodsReceiptDto) {
    return this.receiptsService.findAll(filter);
  }

  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.receiptsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateGoodsReceiptDto) {
    return this.receiptsService.create(dto);
  }
}


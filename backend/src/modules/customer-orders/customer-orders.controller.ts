import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service.js';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto.js';
import { DispatchOrderDto } from './dto/dispatch-order.dto.js';
import { FilterCustomerOrderDto } from './dto/filter-customer-order.dto.js';
import { CustomerOrder } from './entities/customer-order.entity.js';

@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly ordersService: CustomerOrdersService) {}

  @Get()
  async findAll(@Query() filter: FilterCustomerOrderDto): Promise<CustomerOrder[]> {
    return this.ordersService.findAll(filter);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOrder> {
    return this.ordersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateCustomerOrderDto): Promise<CustomerOrder> {
    return this.ordersService.create(dto);
  }

  @Post(':id/dispatch')
  async dispatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispatchOrderDto,
  ): Promise<CustomerOrder> {
    return this.ordersService.dispatch(id, dto);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ): Promise<CustomerOrder> {
    return this.ordersService.cancel(id, notes);
  }
}


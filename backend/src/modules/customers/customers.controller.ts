import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { Customer } from './entities/customer.entity.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customersService.findById(id);
  }

  @Post()
  async create(@Body() createDto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(createDto);
  }
}


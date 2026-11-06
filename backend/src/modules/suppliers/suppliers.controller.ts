import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { Supplier } from './entities/supplier.entity.js';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(): Promise<Supplier[]> {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Supplier> {
    return this.suppliersService.findById(id);
  }

  @Post()
  async create(@Body() createDto: CreateSupplierDto): Promise<Supplier> {
    return this.suppliersService.create(createDto);
  }
}


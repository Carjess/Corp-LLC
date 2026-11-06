import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOneBy({ id });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado.`);
    }
    return supplier;
  }

  async create(createDto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      ...createDto,
      leadTimeDays: createDto.leadTimeDays ?? 5,
    });
    return this.supplierRepository.save(supplier);
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID "${id}" no encontrado.`);
    }
    return customer;
  }

  async create(createDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createDto);
    return this.customerRepository.save(customer);
  }
}


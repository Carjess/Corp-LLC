import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { FilterProductDto } from './dto/filter-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(filter: FilterProductDto): Promise<Product[]> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (filter.search) {
      const searchTerm = `%${filter.search.trim()}%`;
      query.andWhere(
        '(product.sku ILIKE :search OR product.name ILIKE :search)',
        { search: searchTerm },
      );
    }

    if (filter.categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.isActive !== undefined) {
      const activeBool = filter.isActive === 'true';
      query.andWhere('product.isActive = :activeBool', { activeBool });
    }

    query.orderBy('product.sku', 'ASC');

    return query.getMany();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { sku: sku.trim().toUpperCase() },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con SKU ${sku} no encontrado`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const formattedSku = dto.sku.trim().toUpperCase();

    const existing = await this.productRepository.findOne({
      where: { sku: formattedSku },
    });

    if (existing) {
      throw new ConflictException(
        `El SKU '${formattedSku}' ya se encuentra registrado`,
      );
    }

    const category = await this.categoryRepository.findOneBy({
      id: dto.categoryId,
    });
    if (!category) {
      throw new NotFoundException(
        `La categoría con ID ${dto.categoryId} no existe`,
      );
    }

    const product = this.productRepository.create({
      ...dto,
      sku: formattedSku,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      unitMeasure: dto.unitMeasure.trim(),
      conversionFactor: dto.conversionFactor ?? 1,
      minStock: dto.minStock ?? 50,
      securityStock: dto.securityStock ?? 100,
      isActive: true,
    });

    const saved = await this.productRepository.save(product);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (dto.sku && dto.sku.trim().toUpperCase() !== product.sku) {
      const formattedSku = dto.sku.trim().toUpperCase();
      const existing = await this.productRepository.findOne({
        where: { sku: formattedSku },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `El SKU '${formattedSku}' ya pertenece a otro producto`,
        );
      }
      product.sku = formattedSku;
    }

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: dto.categoryId,
      });
      if (!category) {
        throw new NotFoundException(
          `La categoría con ID ${dto.categoryId} no existe`,
        );
      }
      product.categoryId = dto.categoryId;
    }

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.description !== undefined) product.description = dto.description?.trim();
    if (dto.unitMeasure !== undefined) product.unitMeasure = dto.unitMeasure.trim();
    if (dto.conversionFactor !== undefined) product.conversionFactor = dto.conversionFactor;
    if (dto.minStock !== undefined) product.minStock = dto.minStock;
    if (dto.securityStock !== undefined) product.securityStock = dto.securityStock;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    await this.productRepository.save(product);
    return this.findById(id);
  }

  async toggleStatus(id: string): Promise<Product> {
    const product = await this.findById(id);
    product.isActive = !product.isActive;
    await this.productRepository.save(product);
    return this.findById(id);
  }
}

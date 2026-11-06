import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CustomerOrderItem } from '../customer-orders/entities/customer-order-item.entity.js';
import { MovementType } from '../../common/enums/movement-type.enum.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { FilterMovementDto } from './dto/filter-movement.dto.js';

export interface ProductStockSummary {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  unitMeasure: string;
  conversionFactor: number;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  securityStock: number;
  statusAlert: 'CRITICO' | 'BAJO' | 'OK';
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CustomerOrderItem)
    private readonly orderItemRepository: Repository<CustomerOrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Calcula los saldos consolidados de inventario en tiempo real
   * Stock Físico = Entradas + Ajustes Positivos - Salidas - Ajustes Negativos
   * Stock Reservado = Pedidos comprometidos no despachados
   * Stock Disponible = Stock Físico - Stock Reservado
   */
  async getStockSummary(productId?: string): Promise<ProductStockSummary[]> {
    const productQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    if (productId) {
      productQuery.andWhere('product.id = :productId', { productId });
    }

    productQuery.orderBy('product.sku', 'ASC');
    const products = await productQuery.getMany();

    const summaries: ProductStockSummary[] = [];

    for (const prod of products) {
      // 1. Cálculo de Stock Físico desde el Kardex inmutable
      const positiveMovements = await this.movementRepository
        .createQueryBuilder('mov')
        .select('COALESCE(SUM(mov.quantity), 0)', 'total')
        .where('mov.productId = :productId', { productId: prod.id })
        .andWhere('mov.type IN (:...types)', {
          types: [MovementType.ENTRADA, MovementType.AJUSTE_POSITIVO],
        })
        .getRawOne<{ total: string }>();

      const negativeMovements = await this.movementRepository
        .createQueryBuilder('mov')
        .select('COALESCE(SUM(mov.quantity), 0)', 'total')
        .where('mov.productId = :productId', { productId: prod.id })
        .andWhere('mov.type IN (:...types)', {
          types: [MovementType.SALIDA, MovementType.AJUSTE_NEGATIVO],
        })
        .getRawOne<{ total: string }>();

      const totalPositive = Number(positiveMovements?.total || 0);
      const totalNegative = Number(negativeMovements?.total || 0);
      const physicalStock = totalPositive - totalNegative;

      // 2. Cálculo de Stock Reservado (demanda pendiente de despacho)
      const reservedResult = await this.orderItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.order', 'order')
        .select('COALESCE(SUM(item.quantityReserved), 0)', 'totalReserved')
        .where('item.productId = :productId', { productId: prod.id })
        .andWhere('order.status IN (:...statuses)', {
          statuses: [OrderStatus.PENDING, OrderStatus.PARTIAL],
        })
        .getRawOne<{ totalReserved: string }>();

      const reservedStock = Number(reservedResult?.totalReserved || 0);
      const availableStock = Math.max(0, physicalStock - reservedStock);

      // 3. Determinación de la condición de alerta
      let statusAlert: 'CRITICO' | 'BAJO' | 'OK' = 'OK';
      if (availableStock <= 0) {
        statusAlert = 'CRITICO';
      } else if (availableStock <= prod.minStock) {
        statusAlert = 'BAJO';
      }

      summaries.push({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        categoryName: prod.category?.name || 'General',
        unitMeasure: prod.unitMeasure,
        conversionFactor: prod.conversionFactor,
        physicalStock,
        reservedStock,
        availableStock,
        minStock: prod.minStock,
        securityStock: prod.securityStock,
        statusAlert,
      });
    }

    return summaries;
  }

  /**
   * Obtiene el historial de movimientos de inventario (Kardex Inmutable)
   */
  async getMovements(filter: FilterMovementDto): Promise<InventoryMovement[]> {
    const query = this.movementRepository
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.product', 'product')
      .leftJoinAndSelect('product.category', 'category');

    if (filter.productId) {
      query.andWhere('mov.productId = :productId', {
        productId: filter.productId,
      });
    }

    if (filter.type) {
      query.andWhere('mov.type = :type', { type: filter.type });
    }

    query.orderBy('mov.movementDate', 'DESC');
    query.take(filter.limit || 50);

    return query.getMany();
  }

  /**
   * Registra una transacción física en el Kardex validando saldos
   */
  async createMovement(dto: CreateMovementDto): Promise<InventoryMovement> {
    const product = await this.productRepository.findOneBy({
      id: dto.productId,
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${dto.productId} no encontrado`);
    }

    // Regla de integridad: Las salidas no pueden superar el stock físico en almacén
    if (
      dto.type === MovementType.SALIDA ||
      dto.type === MovementType.AJUSTE_NEGATIVO
    ) {
      const summary = await this.getStockSummary(product.id);
      const currentPhysical = summary[0]?.physicalStock || 0;

      if (dto.quantity > currentPhysical) {
        throw new BadRequestException(
          `Operación rechazada: la cantidad solicitada (${dto.quantity}) excede el stock físico existente en almacén (${currentPhysical}).`,
        );
      }
    }

    const movement = this.movementRepository.create({
      productId: dto.productId,
      type: dto.type,
      quantity: dto.quantity,
      referenceDoc: dto.referenceDoc?.trim() || 'MANUAL',
      responsible: dto.responsible.trim(),
      notes: dto.notes?.trim(),
      movementDate: new Date(),
    });

    return this.movementRepository.save(movement);
  }
}


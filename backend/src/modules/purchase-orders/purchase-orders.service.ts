import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { Supplier } from '../suppliers/entities/supplier.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto.js';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Consulta todas las órdenes de compra con filtros
   */
  async findAll(filter?: FilterPurchaseOrderDto): Promise<PurchaseOrder[]> {
    const query = this.poRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('order.receipts', 'receipts');

    if (filter?.status) {
      query.andWhere('order.status = :status', { status: filter.status });
    }

    if (filter?.supplierId) {
      query.andWhere('order.supplierId = :supplierId', { supplierId: filter.supplierId });
    }

    if (filter?.search) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        '(order.poNumber ILIKE :search OR supplier.name ILIKE :search)',
        { search },
      );
    }

    query.orderBy('order.issueDate', 'DESC');
    return query.getMany();
  }

  /**
   * Consulta una orden de compra por ID con sus ítems, recepciones y proveedor
   */
  async findById(id: string): Promise<PurchaseOrder> {
    const order = await this.poRepository.findOne({
      where: { id },
      relations: {
        supplier: true,
        items: {
          product: {
            category: true,
          },
        },
        receipts: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Orden de compra con ID "${id}" no encontrada.`);
    }

    return order;
  }

  /**
   * Emite una nueva orden de compra a proveedor.
   * Regla de negocio estricta (Paso 6):
   * La orden en estado PENDING NO altera el stock físico en el almacén.
   * Las unidades solicitadas se contabilizan únicamente como Mercancía en Tránsito.
   */
  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    // 1. Validar existencia del proveedor
    const supplier = await this.supplierRepository.findOneBy({ id: dto.supplierId });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID "${dto.supplierId}" no encontrado.`);
    }

    // 2. Generar o validar número de orden de compra
    let poNumber = dto.poNumber?.trim();
    if (!poNumber) {
      const count = await this.poRepository.count();
      poNumber = `COM-${String(count + 1).padStart(3, '0')}`;
    }

    const existing = await this.poRepository.findOneBy({ poNumber });
    if (existing) {
      throw new ConflictException(
        `Ya existe una orden de compra registrada con el número "${poNumber}".`,
      );
    }

    // 3. Calcular fecha estimada de entrega según el tiempo de entrega del fabricante
    const issueDate = new Date();
    let expectedDate: Date;
    if (dto.expectedDate) {
      expectedDate = new Date(dto.expectedDate);
    } else {
      expectedDate = new Date(
        issueDate.getTime() + supplier.leadTimeDays * 24 * 60 * 60 * 1000,
      );
    }

    // 4. Validar productos dentro de una transacción atómica
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, isActive: true },
        });

        if (!product) {
          throw new NotFoundException(
            `Producto con ID "${item.productId}" no encontrado o inactivo.`,
          );
        }
      }

      // Crear cabecera de la orden de compra
      const newPo = queryRunner.manager.create(PurchaseOrder, {
        poNumber,
        supplierId: supplier.id,
        issueDate,
        expectedDate,
        status: OrderStatus.PENDING,
        notes: dto.notes?.trim() || undefined,
      });

      const savedPo = await queryRunner.manager.save(newPo);

      // Crear ítems de la orden (quantityReceived arranca en 0)
      for (const item of dto.items) {
        const poItem = queryRunner.manager.create(PurchaseOrderItem, {
          purchaseOrderId: savedPo.id,
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
        });
        await queryRunner.manager.save(poItem);
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Orden de compra ${poNumber} emitida a ${supplier.name} con fecha esperada ${expectedDate.toISOString().slice(0, 10)}. Stock físico inalterado.`,
      );

      return this.findById(savedPo.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancela una orden de compra pendiente
   */
  async cancel(id: string, notes?: string): Promise<PurchaseOrder> {
    const order = await this.findById(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        `No es posible cancelar la orden ${order.poNumber} porque ya fue recibida en su totalidad.`,
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        `La orden de compra ${order.poNumber} ya se encuentra cancelada.`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    if (notes) {
      order.notes = order.notes ? `${order.notes} | Cancelación: ${notes}` : `Cancelación: ${notes}`;
    }

    return this.poRepository.save(order);
  }
}

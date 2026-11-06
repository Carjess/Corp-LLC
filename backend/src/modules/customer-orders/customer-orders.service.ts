import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity.js';
import { CustomerOrderItem } from './entities/customer-order-item.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { MovementType } from '../../common/enums/movement-type.enum.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto.js';
import { DispatchOrderDto } from './dto/dispatch-order.dto.js';
import { FilterCustomerOrderDto } from './dto/filter-customer-order.dto.js';

@Injectable()
export class CustomerOrdersService {
  private readonly logger = new Logger(CustomerOrdersService.name);

  constructor(
    @InjectRepository(CustomerOrder)
    private readonly orderRepository: Repository<CustomerOrder>,
    @InjectRepository(CustomerOrderItem)
    private readonly orderItemRepository: Repository<CustomerOrderItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Consulta todas las órdenes de clientes aplicando filtros opcionales
   */
  async findAll(filter?: FilterCustomerOrderDto): Promise<CustomerOrder[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category');

    if (filter?.status) {
      query.andWhere('order.status = :status', { status: filter.status });
    }

    if (filter?.customerId) {
      query.andWhere('order.customerId = :customerId', { customerId: filter.customerId });
    }

    if (filter?.search) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        '(order.orderNumber ILIKE :search OR customer.name ILIKE :search)',
        { search },
      );
    }

    query.orderBy('order.orderDate', 'DESC');
    return query.getMany();
  }

  /**
   * Consulta una orden específica por ID con sus ítems y cliente
   */
  async findById(id: string): Promise<CustomerOrder> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        items: {
          product: {
            category: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido de cliente con ID "${id}" no encontrado.`);
    }

    return order;
  }

  /**
   * Crea un nuevo pedido de cliente reservando stock disponible en una transacción atómica.
   * Regla de negocio: Si algún producto no cuenta con Stock Disponible suficiente, rechaza la operación.
   */
  async create(dto: CreateCustomerOrderDto): Promise<CustomerOrder> {
    // 1. Validar que el cliente exista
    const customer = await this.customerRepository.findOneBy({ id: dto.customerId });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID "${dto.customerId}" no encontrado.`);
    }

    // 2. Generar o validar número de orden
    let orderNumber = dto.orderNumber?.trim();
    if (!orderNumber) {
      const count = await this.orderRepository.count();
      orderNumber = `PED-${String(count + 1).padStart(3, '0')}`;
    }

    const existing = await this.orderRepository.findOneBy({ orderNumber });
    if (existing) {
      throw new ConflictException(
        `Ya existe un pedido registrado con el número "${orderNumber}".`,
      );
    }

    // 3. Ejecutar verificación de disponibilidad y reserva dentro de una transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar disponibilidad de stock para cada producto
      for (const item of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, isActive: true },
        });

        if (!product) {
          throw new NotFoundException(
            `Producto con ID "${item.productId}" no encontrado o inactivo.`,
          );
        }

        // Calcular stock físico actual
        const posMov = await queryRunner.manager
          .createQueryBuilder(InventoryMovement, 'mov')
          .select('COALESCE(SUM(mov.quantity), 0)', 'total')
          .where('mov.productId = :productId', { productId: product.id })
          .andWhere('mov.type IN (:...types)', {
            types: [MovementType.ENTRADA, MovementType.AJUSTE_POSITIVO],
          })
          .getRawOne<{ total: string }>();

        const negMov = await queryRunner.manager
          .createQueryBuilder(InventoryMovement, 'mov')
          .select('COALESCE(SUM(mov.quantity), 0)', 'total')
          .where('mov.productId = :productId', { productId: product.id })
          .andWhere('mov.type IN (:...types)', {
            types: [MovementType.SALIDA, MovementType.AJUSTE_NEGATIVO],
          })
          .getRawOne<{ total: string }>();

        const physicalStock =
          Number(posMov?.total || 0) - Number(negMov?.total || 0);

        // Calcular stock reservado actual
        const resQuery = await queryRunner.manager
          .createQueryBuilder(CustomerOrderItem, 'item')
          .innerJoin('item.order', 'order')
          .select('COALESCE(SUM(item.quantityReserved), 0)', 'totalReserved')
          .where('item.productId = :productId', { productId: product.id })
          .andWhere('order.status IN (:...statuses)', {
            statuses: [OrderStatus.PENDING, OrderStatus.PARTIAL],
          })
          .getRawOne<{ totalReserved: string }>();

        const currentReserved = Number(resQuery?.totalReserved || 0);
        const availableStock = Math.max(0, physicalStock - currentReserved);

        // Criterio de Éxito del Plan: No prometer unidades si el disponible es insuficiente
        if (item.quantityDemanded > availableStock) {
          throw new BadRequestException(
            `Stock disponible insuficiente para el producto [${product.sku}] ${product.name}. Solicitado: ${item.quantityDemanded}, Disponible para venta: ${availableStock} (Stock Físico: ${physicalStock}, Reservado: ${currentReserved}).`,
          );
        }
      }

      // Crear cabecera del pedido
      const newOrder = queryRunner.manager.create(CustomerOrder, {
        orderNumber,
        customerId: customer.id,
        orderDate: new Date(),
        status: OrderStatus.PENDING,
        notes: dto.notes?.trim() || undefined,
      });

      const savedOrder = await queryRunner.manager.save(newOrder);

      // Crear ítems con reserva de inventario
      for (const item of dto.items) {
        const orderItem = queryRunner.manager.create(CustomerOrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantityDemanded: item.quantityDemanded,
          quantityDispatched: 0,
          quantityReserved: item.quantityDemanded, // Reserva inmediata
        });
        await queryRunner.manager.save(orderItem);
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Pedido de cliente ${orderNumber} creado exitosamente con reserva de inventario.`,
      );

      return this.findById(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Registra el despacho (total o parcial) de un pedido de cliente.
   * Regla de negocio:
   * - Descuenta del stock físico registrando una transacción de SALIDA en el Kardex.
   * - Libera la reserva correspondiente (quantityReserved).
   * - Actualiza el estado del pedido a COMPLETED o PARTIAL.
   */
  async dispatch(id: string, dto: DispatchOrderDto): Promise<CustomerOrder> {
    const order = await this.findById(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        `El pedido ${order.orderNumber} ya se encuentra completado en su totalidad.`,
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        `No es posible despachar el pedido ${order.orderNumber} porque está cancelado.`,
      );
    }

    const responsible = dto.responsible?.trim() || 'Administrador (juliam@admin.com)';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Determinar qué ítems y qué cantidades se van a despachar
      for (const item of order.items) {
        let qtyToDispatch = item.quantityReserved; // Por defecto despacha el saldo reservado restante

        if (dto.items && dto.items.length > 0) {
          const specifiedItem = dto.items.find((i) => i.itemId === item.id);
          if (specifiedItem) {
            qtyToDispatch = specifiedItem.quantity;
          } else {
            qtyToDispatch = 0; // Si se especificaron ítems y este no está, no se despacha
          }
        }

        if (qtyToDispatch <= 0) {
          continue;
        }

        if (qtyToDispatch > item.quantityReserved) {
          throw new BadRequestException(
            `La cantidad a despachar (${qtyToDispatch}) supera las unidades reservadas (${item.quantityReserved}) para el producto [${item.product.sku}].`,
          );
        }

        // 1. Generar movimiento inmutable de SALIDA en el Kardex
        const movement = queryRunner.manager.create(InventoryMovement, {
          productId: item.productId,
          type: MovementType.SALIDA,
          quantity: qtyToDispatch,
          referenceDoc: order.orderNumber,
          responsible,
          notes: `Despacho de pedido de cliente ${order.orderNumber}. ${dto.notes ? `(${dto.notes.trim()})` : ''}`,
        });
        await queryRunner.manager.save(movement);

        // 2. Actualizar cantidades en el ítem del pedido y liberar reserva
        item.quantityDispatched += qtyToDispatch;
        item.quantityReserved -= qtyToDispatch;
        await queryRunner.manager.save(item);
      }

      // 3. Determinar el nuevo estado del pedido
      const allCompleted = order.items.every(
        (i) => i.quantityDispatched >= i.quantityDemanded,
      );
      order.status = allCompleted ? OrderStatus.COMPLETED : OrderStatus.PARTIAL;

      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Despacho registrado para pedido ${order.orderNumber}. Estado actualizado a: ${order.status}.`,
      );

      return this.findById(order.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancela un pedido de cliente pendiente liberando de inmediato las unidades reservadas
   */
  async cancel(id: string, notes?: string): Promise<CustomerOrder> {
    const order = await this.findById(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        `No es posible cancelar el pedido ${order.orderNumber} porque ya fue despachado en su totalidad.`,
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        `El pedido ${order.orderNumber} ya se encuentra cancelado.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Liberar reservas de todos los ítems
      for (const item of order.items) {
        item.quantityReserved = 0;
        await queryRunner.manager.save(item);
      }

      order.status = OrderStatus.CANCELLED;
      if (notes) {
        order.notes = order.notes ? `${order.notes} | Cancelación: ${notes}` : `Cancelación: ${notes}`;
      }
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      this.logger.log(`Pedido ${order.orderNumber} cancelado y reservas liberadas.`);

      return this.findById(order.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}


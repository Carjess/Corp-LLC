import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GoodsReceipt } from './entities/goods-receipt.entity.js';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { MovementType } from '../../common/enums/movement-type.enum.js';
import { OrderStatus } from '../../common/enums/order-status.enum.js';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto.js';
import { FilterGoodsReceiptDto } from './dto/filter-goods-receipt.dto.js';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    @InjectRepository(GoodsReceipt)
    private readonly receiptRepository: Repository<GoodsReceipt>,
    @InjectRepository(GoodsReceiptItem)
    private readonly receiptItemRepository: Repository<GoodsReceiptItem>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Consulta todas las recepciones de mercancía con sus líneas, orden de compra y proveedor
   */
  async findAll(filter?: FilterGoodsReceiptDto): Promise<GoodsReceipt[]> {
    const query = this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.purchaseOrder', 'po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('receipt.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category');

    if (filter?.purchaseOrderId) {
      query.andWhere('receipt.purchaseOrderId = :purchaseOrderId', {
        purchaseOrderId: filter.purchaseOrderId,
      });
    }

    if (filter?.search) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        '(receipt.receiptNumber ILIKE :search OR po.poNumber ILIKE :search OR supplier.name ILIKE :search OR receipt.receiverName ILIKE :search)',
        { search },
      );
    }

    query.orderBy('receipt.receiptDate', 'DESC');
    return query.getMany();
  }

  /**
   * Consulta una recepción específica por su ID
   */
  async findById(id: string): Promise<GoodsReceipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
      relations: {
        purchaseOrder: {
          supplier: true,
          items: {
            product: true,
          },
        },
        items: {
          product: {
            category: true,
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException(`Comprobante de recepción con ID "${id}" no encontrado.`);
    }

    return receipt;
  }

  /**
   * Registra una recepción en muelle dentro de una transacción atómica:
   * 1. Valida que la orden de compra esté abierta (PENDING o PARTIAL).
   * 2. Valida que las cantidades aceptadas no superen el saldo pendiente en la orden.
   * 3. Crea el GoodsReceipt y GoodsReceiptItems.
   * 4. Actualiza quantityReceived en los ítems de la orden.
   * 5. Emite un movimiento ENTRADA en inventory_movements (Kardex inmutable) por las unidades aceptadas.
   * 6. Actualiza el estado de la orden (COMPLETED si se recibió todo, PARTIAL si restan unidades en tránsito).
   */
  async create(dto: CreateGoodsReceiptDto): Promise<GoodsReceipt> {
    // 1. Validar orden de compra y sus líneas
    const po = await this.poRepository.findOne({
      where: { id: dto.purchaseOrderId },
      relations: {
        items: {
          product: true,
        },
        supplier: true,
      },
    });

    if (!po) {
      throw new NotFoundException(
        `Orden de compra con ID "${dto.purchaseOrderId}" no encontrada.`,
      );
    }

    if (po.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        `No se puede recibir mercancía de la orden "${po.poNumber}" porque se encuentra CANCELADA.`,
      );
    }

    if (po.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        `La orden de compra "${po.poNumber}" ya ha sido recibida en su totalidad.`,
      );
    }

    // 2. Validar que los productos pertenezcan a la orden y no excedan el saldo pendiente
    const poItemsMap = new Map<string, PurchaseOrderItem>();
    for (const poi of po.items) {
      poItemsMap.set(poi.productId, poi);
    }

    let totalAccepted = 0;
    for (const item of dto.items) {
      const poi = poItemsMap.get(item.productId);
      if (!poi) {
        throw new BadRequestException(
          `El producto con ID "${item.productId}" no pertenece a las líneas de la orden "${po.poNumber}".`,
        );
      }

      const pending = poi.quantityOrdered - poi.quantityReceived;
      if (item.quantityAccepted > pending) {
        throw new BadRequestException(
          `La cantidad aceptada (${item.quantityAccepted}) supera el saldo pendiente (${pending}) para el producto "${poi.product?.name || item.productId}".`,
        );
      }

      totalAccepted += item.quantityAccepted;
    }

    if (totalAccepted === 0) {
      throw new BadRequestException(
        'Debe registrar al menos una unidad aceptada para dar entrada física al almacén.',
      );
    }

    // 3. Generar número correlativo REC-XXX si no se especificó
    let receiptNumber = dto.receiptNumber?.trim().toUpperCase();
    if (!receiptNumber) {
      receiptNumber = await this.generateNextReceiptNumber();
    } else {
      const existing = await this.receiptRepository.findOne({
        where: { receiptNumber },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un comprobante de recepción con el número "${receiptNumber}".`,
        );
      }
    }

    const receiverName = dto.receiverName?.trim() || 'juliam@admin.com';

    // 4. Ejecución atómica en base de datos
    return this.dataSource.transaction(async (manager) => {
      // 4.1 Crear cabecera GoodsReceipt
      const receipt = manager.create(GoodsReceipt, {
        receiptNumber,
        purchaseOrderId: po.id,
        receiptDate: new Date(),
        receiverName,
        notes: dto.notes?.trim() || undefined,
      });

      const savedReceipt = await manager.save(GoodsReceipt, receipt);

      // 4.2 Procesar cada línea de recepción
      for (const item of dto.items) {
        const poi = poItemsMap.get(item.productId)!;

        // Crear línea de recepción
        const receiptItem = manager.create(GoodsReceiptItem, {
          receiptId: savedReceipt.id,
          productId: item.productId,
          quantityAccepted: item.quantityAccepted,
          quantityRejected: item.quantityRejected || 0,
        });
        await manager.save(GoodsReceiptItem, receiptItem);

        // Actualizar cantidades recibidas en la orden de compra
        poi.quantityReceived += item.quantityAccepted;
        await manager.save(PurchaseOrderItem, poi);

        // Emitir movimiento de entrada en Kardex si hubo unidades aceptadas
        if (item.quantityAccepted > 0) {
          const movement = manager.create(InventoryMovement, {
            productId: item.productId,
            type: MovementType.ENTRADA,
            quantity: item.quantityAccepted,
            referenceDoc: savedReceipt.receiptNumber,
            responsible: receiverName,
            notes: `Recepción en muelle desde OC ${po.poNumber}${dto.notes ? ` — ${dto.notes}` : ''}`,
          });
          await manager.save(InventoryMovement, movement);
        }
      }

      // 4.3 Actualizar estado de la orden de compra
      const allFullyReceived = po.items.every(
        (poi) => poi.quantityReceived >= poi.quantityOrdered,
      );

      po.status = allFullyReceived ? OrderStatus.COMPLETED : OrderStatus.PARTIAL;
      await manager.save(PurchaseOrder, po);

      this.logger.log(
        `Recepción ${savedReceipt.receiptNumber} procesada con éxito para OC ${po.poNumber}. Nuevo estado de OC: ${po.status}.`,
      );

      // 4.4 Retornar el comprobante guardado con sus relaciones completas
      return manager.findOneOrFail(GoodsReceipt, {
        where: { id: savedReceipt.id },
        relations: {
          purchaseOrder: {
            supplier: true,
            items: {
              product: true,
            },
          },
          items: {
            product: {
              category: true,
            },
          },
        },
      });
    });
  }

  /**
   * Genera el siguiente número correlativo de comprobante de recepción (REC-001, REC-002, ...)
   */
  private async generateNextReceiptNumber(): Promise<string> {
    const receipts = await this.receiptRepository.find({
      select: { receiptNumber: true },
    });

    let maxNumber = 0;
    const regex = /^REC-(\d+)$/i;

    for (const r of receipts) {
      const match = r.receiptNumber.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextNum = maxNumber + 1;
    return `REC-${String(nextNum).padStart(3, '0')}`;
  }
}

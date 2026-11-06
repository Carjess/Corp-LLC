import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockCount } from './entities/stock-count.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity.js';
import { MovementType } from '../../common/enums/movement-type.enum.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { CreateStockCountDto } from './dto/create-stock-count.dto.js';
import { FilterStockCountDto } from './dto/filter-stock-count.dto.js';

@Injectable()
export class StockCountsService {
  private readonly logger = new Logger(StockCountsService.name);

  constructor(
    @InjectRepository(StockCount)
    private readonly countRepository: Repository<StockCount>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Consulta todos los conteos y auditorías de inventario aplicando filtros opcionales
   */
  async findAll(filter?: FilterStockCountDto): Promise<StockCount[]> {
    const query = this.countRepository
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.product', 'product')
      .leftJoinAndSelect('product.category', 'category');

    if (filter?.productId) {
      query.andWhere('sc.productId = :productId', { productId: filter.productId });
    }

    if (filter?.status) {
      query.andWhere('sc.status = :status', { status: filter.status });
    }

    if (filter?.search) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR sc.counterName ILIKE :search OR sc.approverName ILIKE :search)',
        { search },
      );
    }

    query.orderBy('sc.countDate', 'DESC');
    return query.getMany();
  }

  /**
   * Consulta un conteo de inventario por su identificador UUID
   */
  async findById(id: string): Promise<StockCount> {
    const count = await this.countRepository.findOne({
      where: { id },
      relations: {
        product: {
          category: true,
        },
      },
    });

    if (!count) {
      throw new NotFoundException(`Conteo físico con ID "${id}" no encontrado.`);
    }

    return count;
  }

  /**
   * Registra un conteo físico en estantería y, si procede, aplica el ajuste auditado al Kardex
   */
  async create(dto: CreateStockCountDto): Promise<StockCount> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID "${dto.productId}" no encontrado.`);
    }

    // 1. Obtener el saldo físico actual desde el Kardex inmutable
    const [summary] = await this.inventoryService.getStockSummary(product.id);
    const systemStock = summary ? summary.physicalStock : 0;

    // 2. Calcular variación (diferencia)
    const difference = dto.countedStock - systemStock;

    // 3. Validaciones de justificación si se desea aplicar el ajuste
    const shouldApply = dto.applyAdjustment ?? (difference !== 0);

    if (difference !== 0 && shouldApply) {
      if (!dto.notes || !dto.notes.trim()) {
        throw new BadRequestException(
          'La aplicación de ajustes por discrepancia de inventario exige un motivo o justificación obligatoria.',
        );
      }
      if (!dto.approverName || !dto.approverName.trim()) {
        throw new BadRequestException(
          'La aplicación de ajustes de inventario exige el nombre del auditor o responsable que aprueba.',
        );
      }
    }

    const counterName = dto.counterName?.trim() || 'juliam@admin.com';
    const approverName = dto.approverName?.trim() || undefined;
    const notes = dto.notes?.trim() || undefined;

    let finalStatus = 'CONCILIATED';
    if (difference !== 0) {
      finalStatus = shouldApply ? 'APPLIED' : 'PENDING_AUDIT';
    }

    // 4. Ejecución atómica en base de datos
    return this.dataSource.transaction(async (manager) => {
      // 4.1 Crear registro StockCount
      const stockCount = manager.create(StockCount, {
        productId: product.id,
        countDate: new Date(),
        countedStock: dto.countedStock,
        systemStock,
        difference,
        counterName,
        approverName,
        notes,
        status: finalStatus,
      });

      const savedCount = await manager.save(StockCount, stockCount);

      // 4.2 Si hay variación y se solicitó aplicar, emitir movimiento de ajuste en Kardex
      if (difference !== 0 && shouldApply) {
        const movementType =
          difference > 0 ? MovementType.AJUSTE_POSITIVO : MovementType.AJUSTE_NEGATIVO;

        const docRef = `AUD-${savedCount.id.substring(0, 8).toUpperCase()}`;

        const movement = manager.create(InventoryMovement, {
          productId: product.id,
          type: movementType,
          quantity: Math.abs(difference),
          referenceDoc: docRef,
          responsible: approverName || counterName,
          notes: `Ajuste por conteo físico: Sistema=${systemStock}, Conteo=${dto.countedStock}, Dif=${difference > 0 ? `+${difference}` : difference}. Justificación: ${notes}`,
        });

        await manager.save(InventoryMovement, movement);

        this.logger.log(
          `Ajuste auditado aplicado a [${product.sku}]: ${movementType} de ${Math.abs(difference)} unidades. Ref: ${docRef}.`,
        );
      }

      // 4.3 Retornar el conteo con el producto poblado
      return manager.findOneOrFail(StockCount, {
        where: { id: savedCount.id },
        relations: {
          product: {
            category: true,
          },
        },
      });
    });
  }
}


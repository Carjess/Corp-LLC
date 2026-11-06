import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum.js';

export class FilterPurchaseOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'El estado debe ser PENDING, PARTIAL, COMPLETED o CANCELLED',
  })
  status?: OrderStatus;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  supplierId?: string;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  search?: string;
}


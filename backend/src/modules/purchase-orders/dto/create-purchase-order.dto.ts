import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderItemDto } from './purchase-order-item.dto.js';

export class CreatePurchaseOrderDto {
  @IsNotEmpty({ message: 'El proveedor es obligatorio' })
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  supplierId!: string;

  @IsOptional()
  @IsString({ message: 'El número de orden debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El número de orden no puede superar 50 caracteres' })
  poNumber?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha esperada debe ser una fecha válida (ISO 8601)' })
  expectedDate?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @IsArray({ message: 'Debe especificar una lista de productos a comprar' })
  @ArrayMinSize(1, { message: 'La orden de compra debe incluir al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}


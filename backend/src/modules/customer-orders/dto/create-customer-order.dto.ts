import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerOrderItemDto } from './customer-order-item.dto.js';

export class CreateCustomerOrderDto {
  @IsNotEmpty({ message: 'El cliente es obligatorio' })
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  customerId!: string;

  @IsOptional()
  @IsString({ message: 'El número de orden debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El número de orden no puede superar 50 caracteres' })
  orderNumber?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;

  @IsArray({ message: 'Debe especificar una lista de productos' })
  @ArrayMinSize(1, { message: 'El pedido debe incluir al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderItemDto)
  items!: CustomerOrderItemDto[];
}


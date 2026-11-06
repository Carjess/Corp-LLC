import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GoodsReceiptItemDto } from './goods-receipt-item.dto.js';

export class CreateGoodsReceiptDto {
  @IsNotEmpty({ message: 'El ID de la orden de compra es obligatorio' })
  @IsUUID('4', { message: 'El ID de la orden de compra debe ser un UUID válido' })
  purchaseOrderId!: string;

  @IsOptional()
  @IsString({ message: 'El número de comprobante debe ser un texto' })
  receiptNumber?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del receptor debe ser un texto' })
  receiverName?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  notes?: string;

  @IsArray({ message: 'Los ítems de recepción deben enviarse como una lista' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un ítem a recibir' })
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items!: GoodsReceiptItemDto[];
}


import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterGoodsReceiptDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden de compra debe ser un UUID válido' })
  purchaseOrderId?: string;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;
}


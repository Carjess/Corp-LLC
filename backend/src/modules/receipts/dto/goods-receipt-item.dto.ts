import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class GoodsReceiptItemDto {
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId!: string;

  @IsNotEmpty({ message: 'La cantidad aceptada es obligatoria' })
  @IsInt({ message: 'La cantidad aceptada debe ser un número entero' })
  @Min(0, { message: 'La cantidad aceptada no puede ser negativa' })
  quantityAccepted!: number;

  @IsOptional()
  @IsInt({ message: 'La cantidad rechazada debe ser un número entero' })
  @Min(0, { message: 'La cantidad rechazada no puede ser negativa' })
  quantityRejected?: number;
}


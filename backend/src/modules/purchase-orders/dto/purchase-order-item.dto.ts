import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class PurchaseOrderItemDto {
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId!: string;

  @IsNotEmpty({ message: 'La cantidad a pedir es obligatoria' })
  @IsInt({ message: 'La cantidad a pedir debe ser un número entero' })
  @Min(1, { message: 'La cantidad a pedir debe ser al menos 1 unidad' })
  quantityOrdered!: number;
}


import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CustomerOrderItemDto {
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId!: string;

  @IsNotEmpty({ message: 'La cantidad solicitada es obligatoria' })
  @IsInt({ message: 'La cantidad solicitada debe ser un número entero' })
  @Min(1, { message: 'La cantidad solicitada debe ser de al menos 1 unidad' })
  quantityDemanded!: number;
}


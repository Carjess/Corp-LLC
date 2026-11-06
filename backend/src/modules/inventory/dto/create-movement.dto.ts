import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { MovementType } from '../../../common/enums/movement-type.enum.js';

export class CreateMovementDto {
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId!: string;

  @IsNotEmpty({ message: 'El tipo de movimiento es obligatorio' })
  @IsEnum(MovementType, {
    message:
      'El tipo de movimiento debe ser ENTRADA, SALIDA, AJUSTE_POSITIVO o AJUSTE_NEGATIVO',
  })
  type!: MovementType;

  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a cero' })
  quantity!: number;

  @IsOptional()
  @IsString({ message: 'El documento de referencia debe ser texto' })
  referenceDoc?: string;

  @IsNotEmpty({ message: 'El responsable del movimiento es obligatorio' })
  @IsString({ message: 'El responsable debe ser texto' })
  responsible!: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  notes?: string;
}


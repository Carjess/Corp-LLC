import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DispatchItemDto {
  @IsNotEmpty({ message: 'El ID del ítem es obligatorio' })
  @IsUUID('4', { message: 'El ID del ítem debe ser un UUID válido' })
  itemId!: string;

  @IsNotEmpty({ message: 'La cantidad a despachar es obligatoria' })
  @IsInt({ message: 'La cantidad a despachar debe ser un número entero' })
  @Min(1, { message: 'La cantidad a despachar debe ser de al menos 1 unidad' })
  quantity!: number;
}

export class DispatchOrderDto {
  @IsOptional()
  @IsString({ message: 'El responsable debe ser una cadena de texto' })
  responsible?: string;

  @IsOptional()
  @IsString({ message: 'Las notas del despacho deben ser una cadena de texto' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Los ítems a despachar deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => DispatchItemDto)
  items?: DispatchItemDto[];
}


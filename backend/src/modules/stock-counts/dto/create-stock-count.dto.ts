import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateStockCountDto {
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId!: string;

  @IsNotEmpty({ message: 'El conteo físico observado es obligatorio' })
  @IsInt({ message: 'El conteo físico debe ser un número entero' })
  @Min(0, { message: 'El conteo físico no puede ser negativo' })
  countedStock!: number;

  @IsOptional()
  @IsString({ message: 'El nombre del operador contador debe ser un texto' })
  counterName?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del aprobador debe ser un texto' })
  approverName?: string;

  @IsOptional()
  @IsString({ message: 'La justificación o motivo debe ser un texto' })
  notes?: string;

  @IsOptional()
  @IsBoolean({ message: 'El indicador de aplicación de ajuste debe ser booleano' })
  applyAdjustment?: boolean;
}


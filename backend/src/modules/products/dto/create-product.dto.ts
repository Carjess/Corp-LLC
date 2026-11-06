import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El SKU es obligatorio' })
  @IsString({ message: 'El SKU debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El SKU no puede exceder 50 caracteres' })
  sku!: string;

  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido' })
  categoryId!: string;

  @IsNotEmpty({ message: 'La unidad de medida es obligatoria' })
  @IsString({ message: 'La unidad de medida debe ser texto' })
  @MaxLength(50, { message: 'La unidad de medida no puede exceder 50 caracteres' })
  unitMeasure!: string;

  @IsOptional()
  @IsInt({ message: 'El factor de conversión debe ser un número entero' })
  @Min(1, { message: 'El factor de conversión debe ser al menos 1' })
  conversionFactor?: number = 1;

  @IsOptional()
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  minStock?: number = 50;

  @IsOptional()
  @IsInt({ message: 'El stock de seguridad debe ser un número entero' })
  @Min(0, { message: 'El stock de seguridad no puede ser negativo' })
  securityStock?: number = 100;
}


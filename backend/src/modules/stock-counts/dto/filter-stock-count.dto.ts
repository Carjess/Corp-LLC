import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterStockCountDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  productId?: string;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'El estado debe ser un texto' })
  status?: string;
}


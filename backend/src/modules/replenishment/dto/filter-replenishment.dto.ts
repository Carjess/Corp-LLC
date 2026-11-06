import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ReplenishmentStatusFilter {
  ALL = 'ALL',
  REORDEN = 'REORDEN',
  OK = 'OK',
}

export class FilterReplenishmentDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser un texto' })
  search?: string;

  @IsOptional()
  @IsEnum(ReplenishmentStatusFilter, {
    message: 'El estado de filtro debe ser ALL, REORDEN u OK',
  })
  status?: ReplenishmentStatusFilter;
}


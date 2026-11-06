import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '../../../common/enums/movement-type.enum.js';

export class FilterMovementDto {
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}


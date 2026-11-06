import { IsBooleanString, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterProductDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}


import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplierDto {
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'El nombre del contacto debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El contacto no puede exceder 150 caracteres' })
  contactName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @MaxLength(150, { message: 'El correo no puede exceder 150 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono no puede exceder 50 caracteres' })
  phone?: string;

  @IsOptional()
  @IsInt({ message: 'El tiempo de entrega debe ser un número entero de días' })
  @Min(1, { message: 'El tiempo de entrega debe ser de al menos 1 día' })
  leadTimeDays?: number;
}


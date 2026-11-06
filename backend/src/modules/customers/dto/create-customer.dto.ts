import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'El nombre o razón social del cliente es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'El nombre de contacto debe ser una cadena de texto' })
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
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;
}


import { PartialType } from '@nestjs/mapped-types';
import { CreateGestionUsuarioDto } from './create-gestion-usuario.dto';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  IsBoolean,
  IsInt,
  IsDecimal,
} from 'class-validator';

// CreateGestionUsuarioDto debe definir todos los campos posibles
export class BaseGestionUsuarioDto {
  @IsString()
  @IsOptional()
  nombre_usuario?: string;

  @IsString()
  @IsOptional()
  apellido_usuario?: string;

  @IsString()
  @IsOptional()
  identificacion_usuario?: string;

  @IsDecimal()
  @IsOptional()
  @Length(10, 10, { message: 'El celular debe tener exactamente 10 dígitos' })
  celular?: string;

  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsInt()
  @IsOptional()
  id_rol?: number;

  // Campos adicionales para usuarios con rol 4 (Logística)
  @IsString()
  @IsOptional()
  nombre_empresa?: string;

  @IsString()
  @IsOptional()
  placa_vehiculo?: string;
}

// Usamos PartialType para hacer todos los campos opcionales para la actualización
export class UpdateGestionUsuarioDto extends PartialType(BaseGestionUsuarioDto) {}

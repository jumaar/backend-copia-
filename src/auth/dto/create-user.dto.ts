import { IsString, IsNotEmpty, MinLength, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre_usuario: string;

  @IsString()
  @IsOptional()
  apellido_usuario?: string;

  @IsString()
  @IsNotEmpty()
  identificacion_usuario: string;

  @IsNumber()
  @IsNotEmpty()
  celular: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsNumber()
  @IsNotEmpty()
  id_rol: number;

  @IsString()
  @IsNotEmpty()
  turnstileToken: string;
}
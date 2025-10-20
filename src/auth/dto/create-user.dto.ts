import { IsString, IsNotEmpty, MinLength, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  nombre_usuario?: string;

  @IsString()
  @IsOptional()
  apellido_usuario?: string;

  @IsString()
  @IsOptional()
  identificacion_usuario?: string;

  @IsNumber()
  @IsOptional()
  celular?: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  turnstileToken: string;

  @IsString()
  @IsNotEmpty()
  registrationToken: string;
}
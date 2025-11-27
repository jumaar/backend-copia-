import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional, Matches, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre_usuario?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  apellido_usuario?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]+$/, { message: 'La identificación solo debe contener números' })
  @MinLength(6, { message: 'La identificación debe tener al menos 6 dígitos' })
  identificacion_usuario?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]+$/, { message: 'El celular solo debe contener números' })
  @Length(10, 10, { message: 'El celular debe tener exactamente 10 dígitos' })
  celular?: string;

  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  email: string;

  @IsString()
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres' })
  @Matches(/(?=.*[A-Z])(?=.*\d)(?=.*\W+).*/, {
    message: 'La contraseña debe contener al menos una mayúscula, un número y un símbolo.',
  })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El token de Turnstile no puede estar vacío' })
  turnstileToken: string;

  @IsString()
  @IsNotEmpty({ message: 'El token de registro no puede estar vacío' })
  registrationToken: string;
}
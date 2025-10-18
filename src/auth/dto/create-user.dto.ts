import { IsString, IsNotEmpty, MinLength, IsIn, IsEmail } from 'class-validator';
import { ROLES } from '../../config/roles.config';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(ROLES))
  role: string;

  @IsString()
  @IsNotEmpty()
  turnstileToken: string;
}
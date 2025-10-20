import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateRegistrationTokenDto {
  @IsInt()
  @IsNotEmpty()
  id_rol_nuevo_usuario: number;
}

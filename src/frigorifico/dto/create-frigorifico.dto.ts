import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateFrigorificoDto {
  @IsString()
  @IsNotEmpty()
  nombre_frigorifico: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsInt()
  @IsNotEmpty()
  id_ciudad: number;
}

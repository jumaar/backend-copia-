import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateTiendaDto {
  @IsString()
  @IsNotEmpty()
  nombre_tienda: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsInt()
  @IsNotEmpty()
  id_ciudad: number;
}

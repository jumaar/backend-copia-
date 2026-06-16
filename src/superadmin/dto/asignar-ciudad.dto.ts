import { IsInt, IsOptional } from 'class-validator';

export class AsignarCiudadDto {
  @IsInt()
  id_ciudad: number;

  @IsInt()
  @IsOptional()
  id_admin: number | null;
}

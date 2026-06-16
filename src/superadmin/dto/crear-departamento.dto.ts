import { IsString, IsArray, ArrayMinSize } from 'class-validator';

export class CrearDepartamentoDto {
  @IsString()
  nombre_departamento: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ciudades: string[];
}

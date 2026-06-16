import { IsInt, IsArray, IsString, ArrayMinSize } from 'class-validator';

export class AgregarCiudadesDto {
  @IsInt()
  id__departamento: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ciudades: string[];
}

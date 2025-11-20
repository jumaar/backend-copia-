import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateNeveraDto {
  @IsInt()
  @IsNotEmpty()
  id_tienda: number;
}

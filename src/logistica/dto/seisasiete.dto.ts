import { IsNotEmpty, IsNumber } from 'class-validator';

export class SeisasieteDto {
  @IsNumber()
  @IsNotEmpty()
  id_empaque: number;
}

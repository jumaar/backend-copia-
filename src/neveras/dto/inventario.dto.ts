import { IsNotEmpty, IsNumber, IsString, ArrayNotEmpty, ValidateNested, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class EmpaqueInventarioDto {
  @ValidateIf(o => !o.epc)
  @IsNumber()
  id_empaque?: number;

  @ValidateIf(o => !o.id_empaque)
  @IsString()
  epc?: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_venta: string;
}

export class InventarioDto {
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => EmpaqueInventarioDto)
  empaques: EmpaqueInventarioDto[];
}
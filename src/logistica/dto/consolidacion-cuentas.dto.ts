import { IsNumber, IsString, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsolidacionCuentasDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  monto: number;

  @IsOptional()
  @IsString()
  nota_opcional?: string;

  @IsString()
  @IsIn(['ingreso', 'consolidacion', 'egreso'])
  tipo_movimiento: string;
}
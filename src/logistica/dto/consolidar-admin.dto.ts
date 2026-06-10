import { IsNumber, IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsolidarAdminDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  monto: number;

  @IsOptional()
  @IsString()
  nota_opcional?: string;

  @IsString()
  @IsIn(['ingreso', 'consolidacion'])
  tipo_movimiento: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_logistica?: number;
}

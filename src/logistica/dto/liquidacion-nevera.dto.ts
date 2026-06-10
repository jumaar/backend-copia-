import { IsNumber, IsString, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LiquidacionNeveraDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El monto debe ser mayor o igual a 0' })
  monto: number;

  @IsOptional()
  @IsString()
  nota_opcional?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  empaques?: number[];
}

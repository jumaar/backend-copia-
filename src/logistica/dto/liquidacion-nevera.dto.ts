import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class LiquidacionNeveraDto {
  @Type(() => Number)
  @IsNumber()
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

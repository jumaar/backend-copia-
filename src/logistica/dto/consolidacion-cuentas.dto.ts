import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConsolidacionCuentasDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto: number;

  @IsOptional()
  @IsString()
  nota_opcional?: string;
}
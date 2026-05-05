import { IsNumber, IsString, IsOptional, IsArray, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LiquidacionNeveraDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto: number;

  @IsOptional()
  @IsString()
  nota_opcional?: string;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  empaques: number[];
}

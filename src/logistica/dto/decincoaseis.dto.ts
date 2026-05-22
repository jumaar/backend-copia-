import { IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class PendingPackageDto {
  @IsOptional()
  @IsString()
  epc?: string;

  @IsOptional()
  @IsNumber()
  id_empaque?: number;
}

export class DecincoaseisDto {
  @IsNumber()
  @IsNotEmpty()
  timestamp: number;

  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => PendingPackageDto)
  pending_packages: PendingPackageDto[];
}

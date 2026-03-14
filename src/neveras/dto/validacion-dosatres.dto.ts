import { IsNotEmpty, IsNumber, IsString, ArrayNotEmpty, ValidateNested, IsOptional as IsOptionalValidator, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class PendingPackageDto {
  @IsOptionalValidator()
  @ValidateIf(o => o.epc !== null && o.epc !== undefined)
  @IsString()
  epc?: string | null;

  @IsOptionalValidator()
  @ValidateIf(o => o.id_empaque !== null && o.id_empaque !== undefined)
  @IsNumber()
  id_empaque?: number | null;
}

export class ValidacionDosaTresDto {
  @IsNumber()
  @IsNotEmpty()
  timestamp: number;

  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => PendingPackageDto)
  pending_packages: PendingPackageDto[];
}
import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateFrigorificoDto } from './create-frigorifico.dto';

export class UpdateFrigorificoDto extends PartialType(CreateFrigorificoDto) {
  @IsInt()
  @IsNotEmpty()
  id_frigorifico: number;
}

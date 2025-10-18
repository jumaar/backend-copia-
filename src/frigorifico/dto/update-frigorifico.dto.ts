import { PartialType } from '@nestjs/mapped-types';
import { CreateFrigorificoDto } from './create-frigorifico.dto';

export class UpdateFrigorificoDto extends PartialType(CreateFrigorificoDto) {}

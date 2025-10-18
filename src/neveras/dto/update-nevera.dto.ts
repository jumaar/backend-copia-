import { PartialType } from '@nestjs/mapped-types';
import { CreateNeveraDto } from './create-nevera.dto';

export class UpdateNeveraDto extends PartialType(CreateNeveraDto) {}

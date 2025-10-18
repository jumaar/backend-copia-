import { PartialType } from '@nestjs/mapped-types';
import { CreateLogisticaDto } from './create-logistica.dto';

export class UpdateLogisticaDto extends PartialType(CreateLogisticaDto) {}

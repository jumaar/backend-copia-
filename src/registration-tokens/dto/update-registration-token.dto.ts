import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistrationTokenDto } from './create-registration-token.dto';

export class UpdateRegistrationTokenDto extends PartialType(CreateRegistrationTokenDto) {}

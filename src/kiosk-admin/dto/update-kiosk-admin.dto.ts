import { PartialType } from '@nestjs/mapped-types';
import { CreateKioskAdminDto } from './create-kiosk-admin.dto';

export class UpdateKioskAdminDto extends PartialType(CreateKioskAdminDto) {}

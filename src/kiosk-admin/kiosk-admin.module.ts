import { Module } from '@nestjs/common';
import { KioskAdminService } from './kiosk-admin.service';
import { KioskAdminController } from './kiosk-admin.controller';

@Module({
  controllers: [KioskAdminController],
  providers: [KioskAdminService],
})
export class KioskAdminModule {}

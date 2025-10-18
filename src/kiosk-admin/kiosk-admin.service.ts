import { Injectable } from '@nestjs/common';
import { CreateKioskAdminDto } from './dto/create-kiosk-admin.dto';
import { UpdateKioskAdminDto } from './dto/update-kiosk-admin.dto';

@Injectable()
export class KioskAdminService {
  create(createKioskAdminDto: CreateKioskAdminDto) {
    return 'This action adds a new kioskAdmin';
  }

  findAll() {
    return `This action returns all kioskAdmin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} kioskAdmin`;
  }

  update(id: number, updateKioskAdminDto: UpdateKioskAdminDto) {
    return `This action updates a #${id} kioskAdmin`;
  }

  remove(id: number) {
    return `This action removes a #${id} kioskAdmin`;
  }
}

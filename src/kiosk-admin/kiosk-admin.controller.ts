import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { KioskAdminService } from './kiosk-admin.service';
import { CreateKioskAdminDto } from './dto/create-kiosk-admin.dto';
import { UpdateKioskAdminDto } from './dto/update-kiosk-admin.dto';

@Controller('kiosk-admin')
export class KioskAdminController {
  constructor(private readonly kioskAdminService: KioskAdminService) {}

  @Post()
  create(@Body() createKioskAdminDto: CreateKioskAdminDto) {
    return this.kioskAdminService.create(createKioskAdminDto);
  }

  @Get()
  findAll() {
    return this.kioskAdminService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kioskAdminService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKioskAdminDto: UpdateKioskAdminDto) {
    return this.kioskAdminService.update(+id, updateKioskAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kioskAdminService.remove(+id);
  }
}

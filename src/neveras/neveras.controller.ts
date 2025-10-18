import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';

@Controller('neveras')
export class NeverasController {
  constructor(private readonly neverasService: NeverasService) {}

  @Post()
  create(@Body() createNeveraDto: CreateNeveraDto) {
    return this.neverasService.create(createNeveraDto);
  }

  @Get()
  findAll() {
    return this.neverasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neverasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNeveraDto: UpdateNeveraDto) {
    return this.neverasService.update(+id, updateNeveraDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neverasService.remove(+id);
  }
}

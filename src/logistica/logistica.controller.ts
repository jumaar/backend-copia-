import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LogisticaService } from './logistica.service';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';

@Controller('logistica')
export class LogisticaController {
  constructor(private readonly logisticaService: LogisticaService) {}

  @Post()
  create(@Body() createLogisticaDto: CreateLogisticaDto) {
    return this.logisticaService.create(createLogisticaDto);
  }

  @Get()
  findAll() {
    return this.logisticaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logisticaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogisticaDto: UpdateLogisticaDto) {
    return this.logisticaService.update(+id, updateLogisticaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logisticaService.remove(+id);
  }
}

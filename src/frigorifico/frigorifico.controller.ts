import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FrigorificoService } from './frigorifico.service';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';

@Controller('frigorifico')
export class FrigorificoController {
  constructor(private readonly frigorificoService: FrigorificoService) {}

  @Post()
  create(@Body() createFrigorificoDto: CreateFrigorificoDto) {
    return this.frigorificoService.create(createFrigorificoDto);
  }

  @Get()
  findAll() {
    return this.frigorificoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.frigorificoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFrigorificoDto: UpdateFrigorificoDto) {
    return this.frigorificoService.update(+id, updateFrigorificoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.frigorificoService.remove(+id);
  }
}

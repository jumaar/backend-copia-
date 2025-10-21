import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/neveras')
export class NeverasController {
  private readonly logger = new Logger(NeverasController.name);

  constructor(private readonly neverasService: NeverasService) {}

  @Get('count/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2) // 1: Super_Admin, 2: admin (ajustar si es necesario)
  countActiveNeveras() {
    this.logger.debug('Endpoint countActiveNeveras llamado');
    return this.neverasService.countActiveNeveras();
  }

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

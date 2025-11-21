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

}

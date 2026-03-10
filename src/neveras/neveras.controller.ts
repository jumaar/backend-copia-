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
  Query,
  Req,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// Esta línea es redundante y debe ser eliminada
// import { Post, Body } from '@nestjs/common';

@Controller('api/neveras')
export class NeverasController {
  private readonly logger = new Logger(NeverasController.name);

  constructor(private readonly neverasService: NeverasService) {}


  @Get('surtir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4)
  async surtirNeveras( @Query('id_ciudad') idCiudad: string,@Req() req: any)
  { const idUsuario = req.user.id_usuario;
    return this.neverasService.surtirNeveras(idCiudad, idUsuario);
  }

  /**
   * GET /api/neveras/count-active
   * Cuenta las neveras activas
   */
  @Get('count-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4)
  countActiveNeveras() {
    this.logger.debug('Endpoint countActiveNeveras llamado');
    return this.neverasService.countActiveNeveras();
  }
  
  /**
   * POST /api/neveras/activacion
   * Endpoint para activar nevera con contraseña
   */
  @Post('activacion')
  async activarNevera(@Body('contrasena') contrasena: string) {
    this.logger.debug('Endpoint activacion llamado');
    return this.neverasService.activarNevera(contrasena);
  }

  /**
   * GET /api/neveras/actualizacion
   * Endpoint para obtener información de todas las neveras activas
   */
  @Get('actualizacion')
  async actualizarNeveras() {
    this.logger.debug('Endpoint actualizacion llamado');
    return this.neverasService.actualizarNeveras();
  }


}

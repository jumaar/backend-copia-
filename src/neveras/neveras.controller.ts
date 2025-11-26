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

@Controller('api/neveras')
export class NeverasController {
  private readonly logger = new Logger(NeverasController.name);

  constructor(private readonly neverasService: NeverasService) {}

  /**
   * GET /api/neveras/surtir?id_ciudad=1,3
   * Endpoint principal de surtido de neveras
   * Solo accesible por usuarios con rol 4 (Supervisor)
   */
  @Get('surtir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4)
  async surtirNeveras(
    @Query('id_ciudad') idCiudad: string,
    @Req() req: any
  ) {
    this.logger.debug(`Endpoint surtirNeveras llamado con id_ciudad: ${idCiudad}`);
    
    if (!idCiudad) {
      throw new HttpException({
        success: false,
        error: 'El parámetro id_ciudad es requerido',
        code: 'MISSING_CIUDAD_PARAM'
      }, HttpStatus.BAD_REQUEST);
    }

    const idUsuario = req.user.id_usuario;
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
}

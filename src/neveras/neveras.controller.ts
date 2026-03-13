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
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ValidacionDosaTresDto } from './dto/validacion-dosatres.dto';
import { ParseIntPipe } from '@nestjs/common';
// Esta línea es redundante y debe ser eliminada
// import { Post, Body } from '@nestjs/common';

@Controller('api/neveras')
export class NeverasController {
  private readonly logger = new Logger(NeverasController.name);

  constructor(private readonly neverasService: NeverasService) {}


  @Get('surtir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(4)
  async surtirNeveras(@Query('id_ciudad') idCiudad: string, @Req() req: any) {
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

  /**
   * POST /api/neveras/activacion
   * Endpoint para activar nevera con contraseña este end point se usa en real como en el simulador
   */
  @Post('activacion')
  async activarNevera(@Body('contrasena') contrasena: string) {
    this.logger.debug('Endpoint activacion llamado');
    return this.neverasService.activarNevera(contrasena);
  }

  /**
   * GET /api/neveras/actualizacion
   * OJO ELIMINAR ESTE Endpoint para obtener información de todas las neveras activasetse end poin solo se utiliza para el simuador
   */
  @Get('actualizacion')
  async actualizarNeveras() {
    this.logger.debug('Endpoint actualizacion llamado');
    return this.neverasService.actualizarNeveras();
  }

 /**
  * POST /api/neveras/validacionDosaTres
  * Endpoint para validar empaques que entran a una nevera.
  * Este endpoint actualiza el estado del empaque a "EN NEVERA" (estado 3),
  * lo que dispara el trigger 'update_stock_nevera' que automáticamente incrementa
  * el campo 'stock_en_tiempo_real' en la tabla STOCK_NEVERA para el producto correspondiente.
  */
 @Post('validacionDosaTres')
 @UseGuards(JwtAuthGuard)
 @HttpCode(200)
 async validacionDosaTres(@Body() dto: ValidacionDosaTresDto) {
   this.logger.debug('Endpoint validacionDosaTres llamado');
   return this.neverasService.validacionDosaTres(dto);
 }

 /**
  * GET /api/neveras/inventario/:id_nevera
  * Endpoint para obtener el inventario de empaques en una nevera.
  * Actualiza la última conexión de la nevera y devuelve todos los empaques
  * en estado 3 (en nevera) con su información completa.
  */
 @Get('inventario/:id_nevera')
 @UseGuards(JwtAuthGuard)
 async inventarioNevera(@Param('id_nevera', ParseIntPipe) idNevera: number) {
   this.logger.debug(`Endpoint inventarioNevera llamado para nevera ${idNevera}`);
   return this.neverasService.inventarioNevera(idNevera);
 }


}

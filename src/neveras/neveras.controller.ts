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
import { InventarioDto } from './dto/inventario.dto';

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
  * PATCH /api/neveras/validacionDosaTres
  * Endpoint para validar empaques que entran a una nevera que vienen de logistica.
  * Este endpoint actualiza el estado del empaque a "EN NEVERA" (estado 3),
  * lo que dispara el trigger 'update_stock_nevera' que automáticamente incrementa
  * el campo 'stock_en_tiempo_real' en la tabla STOCK_NEVERA para el producto correspondiente.
  */
@Patch('validacionDosaTres')
@UseGuards(JwtAuthGuard)
async validacionDosaTres(@Body() dto: ValidacionDosaTresDto, @Req() req: any) {
  const idNevera = req.user.id_nevera;
  return this.neverasService.validacionDosaTres(idNevera, dto);
}

 /**
  * GET /api/neveras/inventario
  * Endpoint para obtener el inventario de empaques en la nevera autenticada.
  * Actualiza la última conexión de la nevera y devuelve todos los empaques
  * en estado 3 (en nevera) con su información completa.
  */
 @Get('inventario')
 @UseGuards(JwtAuthGuard)
 async inventarioNevera(@Req() req: any) {
   const idNevera = req.user.id_nevera;
   return this.neverasService.inventarioNevera(idNevera);
 }

 /**
  * PATCH /api/neveras/inventario
  * Endpoint para procesar el inventario de empaques, cambiando su estado de 3 a 4.
  * Recibe una lista de empaques con id_empaque, epc y fecha_venta.
  * Verifica que los empaques estén en estado 3 y pertenezcan a la nevera autenticada.
  */
 @Patch('inventario')
 @UseGuards(JwtAuthGuard)
 async procesarInventario(@Body() dto: InventarioDto, @Req() req: any) {
   const idNevera = req.user.id_nevera;
   return this.neverasService.procesarInventario(idNevera, dto);
 }


}

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
  HttpCode,
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

  constructor(
    private readonly neverasService: NeverasService,
  ) {}


  /**
   * POST /api/neveras/calificacion
   * Endpoint GLOBAL — no requiere parámetros.
   * Ejecuta: escaneo de vencimiento (empaques >75% → PARA CAMBIO) +
   * creación de STOCK_NEVERA faltantes + calificación ALTA/MEDIA/BAJA
   * para todas las neveras activas accesibles por herencia.
   */
  @Post('calificacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4)
  async ejecutarCalificacion(@Req() req: any) {
    return this.neverasService.ejecutarCalificacion(
      req.user.id_usuario,
      req.user.idAdmin,
      req.user.roleId,
    );
  }

  /**
   * GET /api/neveras/surtir?id_nevera=X&id_ciudad=1,3&dias_excluir=Z
   * Calcula la cantidad a surtir en una nevera específica considerando:
   * - Empaques en logística del usuario (estado 2 + estado 6 prioritarios)
   * - Calificación de la nevera (ALTA/MEDIA/BAJA, previamente calculada por /calificacion)
   * - Neveras competidoras (excluyendo surtidas recientemente según dias_excluir)
   * - Herencia: solo neveras de tiendas en la jerarquía del usuario
   *
   * id_ciudad = opcional. Si no se envía: TODAS las ciudades. "4": una sola. "1,3,4": varias.
   * dias_excluir = 0 o no enviado: incluye TODAS las neveras, incluso las surtidas hoy.
   */
  @Get('surtir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4)
  async surtirNevera(
    @Query('id_nevera') idNevera: string,
    @Req() req: any,
    @Query('id_ciudad') idCiudad?: string,
    @Query('dias_excluir') diasExcluir?: string,
  ) {
    const idUsuario = req.user.id_usuario;
    return this.neverasService.surtirNevera(
      Number(idNevera),
      idCiudad || null,
      diasExcluir ? Number(diasExcluir) : 0,
      idUsuario,
      req.user.idAdmin,
    );
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
   * Endpoint para validar empaques que entran a una nevera desde logística (estado 2),
   * devolución (estado 4), para cambio (estado 5) o logística prioridad (estado 6).
   * Este endpoint actualiza el estado del empaque a "EN NEVERA" (estado 3),
   * lo que dispara el trigger 'update_stock_nevera' que automáticamente incrementa
   * el campo 'stock_en_tiempo_real' en la tabla STOCK_NEVERA para el producto correspondiente.
   * Para estado 6, también registra id_nevera_anterior y hora_surtido_final_6.
   */
@Patch('validacionDosaTres')
@UseGuards(JwtAuthGuard)
async validacionDosaTres(@Body() dto: ValidacionDosaTresDto, @Req() req: any) {
  const idNevera = dto.id_nevera ?? req.user.id_nevera;
  if (!idNevera) {
    throw new HttpException(
      { success: false, error: 'id_nevera es requerido', code: 'ID_NEVERA_REQUERIDO' },
      HttpStatus.BAD_REQUEST,
    );
  }
  return this.neverasService.validacionDosaTres(idNevera, dto);
}

 /**
  * GET /api/neveras/inventario
  * Endpoint para obtener el inventario de empaques en la nevera autenticada.
  * Actualiza la última conexión de la nevera y devuelve todos los empaques
  * en estado 3 (en nevera) y estado 4 (pendiente pago) con su información completa.
  */
 @Get('inventario')
 @UseGuards(JwtAuthGuard)
 async inventarioNevera(@Req() req: any) {
   const idNevera = req.user.id_nevera;
   return this.neverasService.inventarioNevera(idNevera);
 }

 /**
   * PATCH /api/neveras/inventario
   * Endpoint para procesar el inventario de empaques, cambiando su estado de 3 o 5 a 4.
   * Recibe una lista de empaques con id_empaque, epc y fecha_venta.
   * Verifica que los empaques estén en estado 3 o 5 y pertenezcan a la nevera autenticada.
  */
 @Patch('inventario')
 @UseGuards(JwtAuthGuard)
 async procesarInventario(@Body() dto: InventarioDto, @Req() req: any) {
   const idNevera = req.user.id_nevera;
   return this.neverasService.procesarInventario(idNevera, dto);
 }


}

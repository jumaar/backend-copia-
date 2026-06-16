import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { LogisticaService } from './logistica.service';
import { CuentasDto } from './dto/cuentas.dto';
import { ConsolidacionCuentasDto } from './dto/consolidacion-cuentas.dto';
import { LiquidacionNeveraDto } from './dto/liquidacion-nevera.dto';
import { DecincoaseisDto } from './dto/decincoaseis.dto';
import { SeisasieteDto } from './dto/seisasiete.dto';
import { FinanzasDto } from './dto/finanzas.dto';
import { ConsolidarAdminDto } from './dto/consolidar-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/logistica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticaController {
  constructor(private readonly logisticaService: LogisticaService) {}

  @Get()
  @Roles(1, 2, 4)
  getProductosPorLogistica(
    @Req() req: any,
    @Query('id_usuario') idUsuarioParam?: string,
  ) {
    const id_usuario_jwt = req.user.id_usuario;
    const id_rol_jwt = req.user.roleId;
    const idUsuarioTarget = idUsuarioParam ? Number(idUsuarioParam) : undefined;
    return this.logisticaService.getProductosPorLogistica(
      id_usuario_jwt,
      id_rol_jwt,
      req.user.idAdmin,
      idUsuarioTarget,
    );
  }

  @Get('cuentas')
  @Roles(1, 2, 3, 4, 5)
  getCuentasTransacciones(@Query() cuentasDto: CuentasDto) {
    return this.logisticaService.getCuentasTransacciones(cuentasDto);
  }

  @Get('finanzas')
  @Roles(1, 2, 4)
  getFinanzas(@Query() dto: FinanzasDto, @Req() req: any) {
    const idUsuario = dto.id_usuario ?? req.user.id_usuario;
    return this.logisticaService.getFinanzas({ ...dto, id_usuario: idUsuario });
  }

  @Get('hermanos')
  @Roles(1, 2, 4)
  getHermanosLogistica(@Req() req: any) {
    return this.logisticaService.getHermanosLogisticaPorScope(req.user.id_usuario, req.user.roleId, req.user.idAdmin);
  }

  @Post('consolidar-admin')
  @Roles(2, 4)
  consolidarAdmin(
    @Body() dto: ConsolidarAdminDto,
    @Req() req: any,
  ) {
    const id_usuario = req.user.id_usuario;
    const id_rol = req.user.roleId;
    return this.logisticaService.consolidarAdmin(id_usuario, id_rol, dto);
  }

  @Post('cuentas')
  @Roles(2, 4)
  consolidarCuentas(
    @Query('id_usuario') id_usuario: number,
    @Body() consolidacionDto: ConsolidacionCuentasDto,
    @Req() req: any,
  ) {
    const id_usuario_credenciales = req.user.id_usuario;
    return this.logisticaService.consolidarCuentas(
      Number(id_usuario),
      Number(id_usuario_credenciales),
      consolidacionDto,
    );
  }

  @Patch('surtir/:id_nevera')
  @Roles(2, 4)
  iniciarSurtido(@Param('id_nevera') id_nevera: string, @Req() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.logisticaService.iniciarSurtido(Number(id_nevera), id_usuario);
  }

  @Patch('surtir/:id_nevera/finalizar')
  @Roles(2, 4)
  finalizarSurtido(@Param('id_nevera') id_nevera: string) {
    return this.logisticaService.finalizarSurtido(Number(id_nevera));
  }

  @Get('cuentas/nevera/:id_nevera')
  @Roles(1, 2, 4, 5)
  async getCuentasNevera(
    @Param('id_nevera') idNevera: string,
    @Query('mes') mes?: string,
    @Query('año') año?: string,
  ) {
    const idNeveraNum = Number(idNevera);
    return this.logisticaService.getEmpaquesPendientesPorNevera(
      idNeveraNum,
      mes ? Number(mes) : undefined,
      año ? Number(año) : undefined,
    );
  }

  @Get('historial/tienda/:id_usuario')
  @Roles(1, 2, 4, 5)
  async getHistorialTienda(
    @Param('id_usuario') idUsuario: string,
    @Query('mes') mes?: string,
    @Query('año') año?: string,
  ) {
    const idUsuarioNum = Number(idUsuario);
    return this.logisticaService.getHistorialTienda(
      idUsuarioNum,
      mes ? Number(mes) : undefined,
      año ? Number(año) : undefined,
    );
  }

  @Post('cuentas/nevera/:id_nevera')
  @Roles(2, 4)
  async liquidarNevera(
    @Param('id_nevera') idNevera: string,
    @Body() liquidacionDto: LiquidacionNeveraDto,
    @Req() req: any,
  ) {
    const idNeveraNum = Number(idNevera);
    const idUsuarioLogistico = req.user.id_usuario;
    return this.logisticaService.liquidarNevera(
      idNeveraNum,
      idUsuarioLogistico,
      liquidacionDto,
    );
  }

  @Patch('decincoaseis')
  @Roles(2, 4)
  async decincoaseis(@Body() dto: DecincoaseisDto, @Req() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.logisticaService.decincoaseis(id_usuario, dto);
  }

  @Patch('seisasiete')
  @Roles(1, 2)
  async seisasiete(@Body() dto: SeisasieteDto) {
    return this.logisticaService.seisasiete(dto);
  }
}

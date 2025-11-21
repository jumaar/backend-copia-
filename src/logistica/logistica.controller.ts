import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { LogisticaService } from './logistica.service';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';
import { CuentasDto } from './dto/cuentas.dto';
import { ConsolidacionCuentasDto } from './dto/consolidacion-cuentas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/logistica')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticaController {
  constructor(private readonly logisticaService: LogisticaService) {}

  @Get()
  @Roles(1, 2, 4)
  getProductosPorLogistica(@Req() req: any) {
    const id_usuario = req.user.id_usuario; // Obtener id_usuario del JWT
    return this.logisticaService.getProductosPorLogistica(id_usuario);
  }

  @Get('surtir')
  @Roles(2, 4)
  getNeverasActivas(@Req() req: any) {
    const id_usuario = req.user.id_usuario; // Obtener id_usuario del JWT
    return this.logisticaService.getNeverasActivas(id_usuario);
  }

  @Get('cuentas')
  @Roles(1, 2, 3, 4)
  getCuentasTransacciones(@Query() cuentasDto: CuentasDto) {
    return this.logisticaService.getCuentasTransacciones(cuentasDto);
  }

  @Post('cuentas')
  @Roles(2, 4) // Solo roles 2 y 4 pueden consolidar cuentas
  consolidarCuentas(
    @Query('id_usuario') id_usuario: number,
    @Body() consolidacionDto: ConsolidacionCuentasDto,
    @Req() req: any
  ) {
    const id_usuario_credenciales = req.user.id_usuario; // Usuario del JWT
    return this.logisticaService.consolidarCuentas(
      Number(id_usuario),
      Number(id_usuario_credenciales),
      consolidacionDto
    );
  }

   
}

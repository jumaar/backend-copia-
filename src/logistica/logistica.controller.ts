import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { LogisticaService } from './logistica.service';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';
import { CuentasDto } from './dto/cuentas.dto';
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

  @Get('cuentas')
  @Roles(1, 2, 3, 4)
  getCuentasTransacciones(@Query() cuentasDto: CuentasDto) {
    return this.logisticaService.getCuentasTransacciones(cuentasDto);
  }

  
}

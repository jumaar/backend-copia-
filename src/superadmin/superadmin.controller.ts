import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CrearDepartamentoDto } from './dto/crear-departamento.dto';
import { AgregarCiudadesDto } from './dto/agregar-ciudades.dto';
import { AsignarCiudadDto } from './dto/asignar-ciudad.dto';

@Controller('api/superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('departamentos-ciudades')
  getDepartamentosCiudades() {
    return this.superadminService.getDepartamentosCiudades();
  }

  @Get('admins')
  getAdmins() {
    return this.superadminService.getAdmins();
  }

  @Post('crear-departamento')
  crearDepartamento(@Body() dto: CrearDepartamentoDto) {
    return this.superadminService.crearDepartamento(dto);
  }

  @Post('agregar-ciudades')
  agregarCiudades(@Body() dto: AgregarCiudadesDto) {
    return this.superadminService.agregarCiudades(dto);
  }

  @Post('asignar-ciudad')
  asignarCiudad(@Body() dto: AsignarCiudadDto) {
    return this.superadminService.asignarCiudad(dto);
  }

  @Delete('ciudad/:id')
  eliminarCiudad(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.eliminarCiudad(id);
  }

  @Delete('departamento/:id')
  eliminarDepartamento(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.eliminarDepartamento(id);
  }
}

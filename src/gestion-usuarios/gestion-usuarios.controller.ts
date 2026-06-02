import { Controller, Get, Param, Req, UseGuards, Patch, Body, Delete, ParseIntPipe } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateGestionUsuarioDto } from './dto/update-gestion-usuario.dto';
import { HerenciaGuard, Herencia } from '../herencia';

@Controller('api/gestion-usuarios')
export class GestionUsuariosController {
  constructor(private readonly gestionUsuariosService: GestionUsuariosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, HerenciaGuard)
  @Roles(1, 2, 3, 4, 5)
  @Herencia({ tipo: 'resolver', scope: 'descendientes', entidad: 'usuario' })
  findAll(@Req() req: any) {
    return this.gestionUsuariosService.findAll({
      id_usuario: req.user.id_usuario,
      roleId: req.user.roleId,
    }, req.accessibleUserIds);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const requester = req.user;
    return this.gestionUsuariosService.findOne(id, requester);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGestionUsuarioDto: UpdateGestionUsuarioDto, @Req() req: any) {
    const requester = req.user;
    return this.gestionUsuariosService.update(id, updateGestionUsuarioDto, requester);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, HerenciaGuard)
  @Roles(1, 2, 4)
  @Herencia({ tipo: 'verificar', scope: 'hijos', entidad: 'usuario', paramKey: 'id' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.gestionUsuariosService.remove(id, {
      id: req.user.id_usuario,
      roleId: req.user.roleId,
    });
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4)
  toggleUserStatus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const requesterId = req.user.id_usuario;
    return this.gestionUsuariosService.toggleStatus(id, requesterId);
  }
}

import { Controller, Get, Param, Req, UseGuards, Patch, Body, Delete, ParseIntPipe } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateGestionUsuarioDto } from './dto/update-gestion-usuario.dto';

@Controller('api/gestion-usuarios')
export class GestionUsuariosController {
  constructor(private readonly gestionUsuariosService: GestionUsuariosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 3, 4, 5) // Permitimos a todos los roles autenticados
  findAll(@Req() req) {
    // El objeto 'user' (con id y roleId) es adjuntado por la JwtStrategy
    return this.gestionUsuariosService.findAll(req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // La lógica de roles se mueve al servicio
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const requester = req.user;
    return this.gestionUsuariosService.findOne(id, requester);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Usamos un guard personalizado en el servicio para la lógica compleja
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGestionUsuarioDto: UpdateGestionUsuarioDto, @Req() req) {
    const requester = req.user;
    return this.gestionUsuariosService.update(id, updateGestionUsuarioDto, requester);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2) // Super Admin y Admin pueden eliminar
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const remover = req.user; // Obtenemos el usuario completo (id y roleId)
    return this.gestionUsuariosService.remove(id, remover);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2) // Admins y Super Admins pueden cambiar el estado
  toggleUserStatus(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const requesterId = req.user.id_usuario;
    return this.gestionUsuariosService.toggleStatus(id, requesterId);
  }
}

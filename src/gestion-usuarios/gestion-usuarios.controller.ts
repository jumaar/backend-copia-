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
  @Roles(1, 2, 4) // 1: Super Admin, 2: Admin, 4: Logistica
  findAll(@Req() req) {
    // El objeto 'user' (con id y roleId) es adjuntado por la JwtStrategy
    return this.gestionUsuariosService.findAll(req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2) // Solo Super Admin y Admin pueden ver detalles completos
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gestionUsuariosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2) // Solo Super Admin y Admin pueden actualizar
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGestionUsuarioDto: UpdateGestionUsuarioDto) {
    return this.gestionUsuariosService.update(id, updateGestionUsuarioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1) // Solo Super Admin puede eliminar
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const removerId = req.user.id; // Obtenemos el ID del usuario que ejecuta la acción
    return this.gestionUsuariosService.remove(id, removerId);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2) // Admins y Super Admins pueden cambiar el estado
  toggleUserStatus(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const requesterId = req.user.id;
    return this.gestionUsuariosService.toggleStatus(id, requesterId);
  }
}

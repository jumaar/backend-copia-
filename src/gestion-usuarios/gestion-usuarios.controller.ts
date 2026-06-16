import { Controller, Get, Param, Req, UseGuards, Patch, Body, Delete, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateGestionUsuarioDto } from './dto/update-gestion-usuario.dto';
import { DatabaseService } from '../database/database.service';

@Controller('api/gestion-usuarios')
export class GestionUsuariosController {
  constructor(
    private readonly gestionUsuariosService: GestionUsuariosService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  findAll(@Req() req: any) {
    return this.gestionUsuariosService.findAll({
      id_usuario: req.user.id_usuario,
      roleId: req.user.roleId,
    }, req.user.idAdmin);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (req.user.idAdmin !== 0) {
      const targetUser = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: id },
        select: { id_admin: true },
      });
      const allowedAdmins = req.user.roleId === 2
        ? [req.user.id_usuario, req.user.idAdmin]
        : [req.user.idAdmin];
      if (!targetUser || !allowedAdmins.includes(targetUser.id_admin)) {
        throw new ForbiddenException('No tienes permiso para eliminar este usuario');
      }
    }
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

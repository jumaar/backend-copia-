import { ConflictException, Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateGestionUsuarioDto } from './dto/update-gestion-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class GestionUsuariosService {
  private readonly logger = new Logger(GestionUsuariosService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private formatUser(user) {
    if (!user) return null;
    return {
      id: user.id_usuario,
      nombre_completo: `${user.nombre_usuario || ''} ${user.apellido_usuario || ''}`.trim(),
      celular: user.celular,
      rol: user.rol?.nombre_rol,
      activo: user.activo,
    };
  }

  async findAll(user: { id: number; roleId: number }) {
    const userRole = user.roleId;
    this.logger.debug(`Iniciando findAll para el usuario ID: ${user.id} con Rol ID: ${userRole}`);

    const currentUser = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: user.id },
      include: { rol: true },
    });

    // Vista simple para roles no jerárquicos
    if (userRole === 3 || userRole === 5) { // Frigorifico o Tienda
      return {
        usuario_actual: this.formatUser(currentUser),
        jerarquia: [],
        tokens: [],
      };
    }

    // Vista jerárquica para Super Admin, Admin, Logistica
    const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: { id_usuario_creador: user.id, es_usado: false, expira_en: { gte: new Date() } },
      select: {
        token: true,
        expira_en: true,
        rol_nuevo_usuario: { select: { nombre_rol: true } },
      },
    });

    // Función recursiva para construir el árbol de descendientes
    const getDescendants = async (creatorId: number) => {
      const createdTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
        where: {
          id_usuario_creador: creatorId,
          es_usado: true,
          id_usuario_nuevo: { not: null },
          nuevo_usuario: { email: { not: { endsWith: '@borrado.com' } } },
        },
        include: { nuevo_usuario: { include: { rol: true } } },
      });

      if (createdTokens.length === 0) {
        return [];
      }

      return Promise.all(
        createdTokens.map(async (token) => {
          const childUser = token.nuevo_usuario;
          if (!childUser) return null;

          const descendants = await getDescendants(childUser.id_usuario);
          return {
            ...this.formatUser(childUser),
            usuarios_creados: descendants,
          };
        }),
      );
    };

    const hierarchy = await getDescendants(user.id);

    return {
      usuario_actual: this.formatUser(currentUser),
      jerarquia: hierarchy.filter(Boolean),
      tokens,
    };
  }
  
  async findOne(id: number, requester: { id: number; roleId: number }) {
    const isOwner = requester.id === id;
    const isAdmin = requester.roleId === 1 || requester.roleId === 2;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para ver los detalles de este usuario.');
    }

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
      include: {
        rol: true,
        tiendas: true,
        frigorificos: true,
        logisticas: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const { contraseña, ...result } = usuario;
    return result;
  }

  async update(id: number, updateGestionUsuarioDto: UpdateGestionUsuarioDto, requester: { id: number; roleId: number }) {
    const isOwner = requester.id === id;
    const isAdmin = requester.roleId === 1 || requester.roleId === 2;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para modificar a este usuario.');
    }

    const { email, identificacion_usuario, celular } = updateGestionUsuarioDto;
    if (email) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({ where: { email, NOT: { id_usuario: id } } });
      if (existingUser) throw new ConflictException(`El email '${email}' ya está en uso.`);
    }
    if (identificacion_usuario) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({ where: { identificacion_usuario, NOT: { id_usuario: id } } });
      if (existingUser) throw new ConflictException(`La identificación '${identificacion_usuario}' ya está en uso.`);
    }
    if (celular) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({ where: { celular, NOT: { id_usuario: id } } });
      if (existingUser) throw new ConflictException(`El celular '${celular}' ya está en uso.`);
    }

    const updatedUser = await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: updateGestionUsuarioDto,
    });

    const { contraseña, ...result } = updatedUser;
    return result;
  }

  async remove(id: number, remover: { id: number; roleId: number }) {
    if (id === remover.id) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta.');
    }

    if (remover.roleId === 2) {
      const tokenLink = await this.databaseService.tOKEN_REGISTRO.findFirst({
        where: { id_usuario_nuevo: id, id_usuario_creador: remover.id },
      });
      if (!tokenLink) {
        throw new ForbiddenException('No tienes permiso para eliminar a este usuario.');
      }
    }

    const childrenTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: { id_usuario_creador: id, es_usado: true },
      select: { id_usuario_nuevo: true },
    });
    const childrenIds = childrenTokens.map(t => t.id_usuario_nuevo).filter((id): id is number => id !== null);

    if (childrenIds.length > 0) {
      const activeChildrenCount = await this.databaseService.uSUARIOS.count({
        where: { id_usuario: { in: childrenIds }, activo: true },
      });
      if (activeChildrenCount > 0) {
        throw new ForbiddenException('Este usuario no puede ser eliminado porque tiene otros usuarios activos a su cargo.');
      }
    }

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const timestamp = Date.now();
    const deletedEmail = `borrado_${timestamp}_${id}@borrado.com`;
    const hashedPassword = await bcrypt.hash(timestamp.toString(), 10);

    await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: {
        activo: false,
        email: deletedEmail,
        contraseña: hashedPassword,
        identificacion_usuario: null,
        celular: null,
      },
    });

    return { message: `Usuario con ID ${id} ha sido borrado lógicamente.` };
  }

  async toggleStatus(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException('No puedes cambiar tu propio estado de activación.');
    }

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const newStatus = !usuario.activo;

    const updatedUser = await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: { activo: newStatus },
    });

    const { contraseña, ...result } = updatedUser;
    return result;
  }
}

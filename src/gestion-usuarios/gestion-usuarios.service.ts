import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateGestionUsuarioDto } from './dto/update-gestion-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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
    // 1. Obtener solo los tokens de registro creados por el solicitante.
    const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: {
        id_usuario_creador: user.id,
        es_usado: false,
        expira_en: { gte: new Date() },
      },
      select: {
        token: true,
        expira_en: true,
        rol_nuevo_usuario: { select: { nombre_rol: true } },
        creador: { select: { nombre_usuario: true } },
      },
    });

    // 2. Construir la estructura jerárquica de usuarios
    this.logger.debug(`Iniciando findAll para el usuario ID: ${user.id} con Rol ID: ${user.roleId}`);

    const currentUser = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: user.id },
      include: { rol: true },
    });
    this.logger.debug(`Usuario actual encontrado: ${currentUser?.email}`);

    // 1. Encontrar los tokens que el usuario actual ha creado y que han sido usados.
    const createdTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: {
        id_usuario_creador: user.id,
        es_usado: true,
        id_usuario_nuevo: { not: null },
        // Excluimos los hijos que ya han sido "borrados"
        nuevo_usuario: {
          email: {
            not: {
              endsWith: '@borrado.com',
            },
          },
        },
      },
      include: {
        nuevo_usuario: { include: { rol: true } },
      },
    });
    this.logger.debug(`Encontrados ${createdTokens.length} tokens usados creados por el usuario ${user.id}`);

    // 2. Para cada "hijo", encontrar a sus "nietos".
    const childrenWithGrandchildren = await Promise.all(
      createdTokens.map(async (token) => {
        const childUser = token.nuevo_usuario;
        if (!childUser) {
          this.logger.warn(`Token ID ${token.id} no tiene un usuario nuevo asociado.`);
          return null;
        }
        this.logger.debug(`Procesando hijo ID: ${childUser.id_usuario}`);

        const grandchildrenTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
          where: {
            id_usuario_creador: childUser.id_usuario,
            es_usado: true,
            id_usuario_nuevo: { not: null },
          },
          include: {
            nuevo_usuario: { include: { rol: true } },
          },
        });
        this.logger.debug(`Hijo ID ${childUser.id_usuario} ha creado ${grandchildrenTokens.length} nietos.`);

        const grandchildren = grandchildrenTokens
          .map(gt => this.formatUser(gt.nuevo_usuario))
          .filter(Boolean);

        return {
          ...this.formatUser(childUser),
          usuarios_creados: grandchildren,
        };
      }),
    );

    const finalResponse = {
      usuario_actual: this.formatUser(currentUser),
      admins_creados: childrenWithGrandchildren.filter(Boolean),
      tokens,
    };

    this.logger.debug(`Respuesta final construida: ${JSON.stringify(finalResponse)}`);
    return finalResponse;
  }

  async findOne(id: number) {
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

  async update(id: number, updateGestionUsuarioDto: UpdateGestionUsuarioDto) {
    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const { email, identificacion_usuario, celular } = updateGestionUsuarioDto;

    if (email) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({
        where: { email, NOT: { id_usuario: id } },
      });
      if (existingUser) {
        throw new ConflictException(`El email '${email}' ya está en uso por otro usuario.`);
      }
    }
    if (identificacion_usuario) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({
        where: { identificacion_usuario, NOT: { id_usuario: id } },
      });
      if (existingUser) {
        throw new ConflictException(`La identificación '${identificacion_usuario}' ya está en uso por otro usuario.`);
      }
    }
    if (celular) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({
        where: { celular, NOT: { id_usuario: id } },
      });
      if (existingUser) {
        throw new ConflictException(`El celular '${celular}' ya está en uso por otro usuario.`);
      }
    }

    const updatedUser = await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: updateGestionUsuarioDto,
    });

    const { contraseña, ...result } = updatedUser;
    return result;
  }

  async remove(id: number, removerId: number) {
    // Regla 1: No auto-eliminarse
    if (id === removerId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta.');
    }

    // Regla 2: Un admin no puede ser eliminado si tiene hijos activos
    const childrenTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: { id_usuario_creador: id, es_usado: true },
      select: { id_usuario_nuevo: true },
    });
    // Filtramos explícitamente los valores nulos para satisfacer a TypeScript
    const childrenIds = childrenTokens.map(t => t.id_usuario_nuevo).filter((id): id is number => id !== null);

    if (childrenIds.length > 0) {
      const activeChildrenCount = await this.databaseService.uSUARIOS.count({
        where: {
          id_usuario: { in: childrenIds },
          activo: true,
        },
      });
      if (activeChildrenCount > 0) {
        throw new ForbiddenException('Este usuario no puede ser eliminado porque tiene otros usuarios activos a su cargo.');
      }
    }

    // Proceso de borrado lógico y anonimización
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

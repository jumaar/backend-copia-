import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { HerenciaScope, HerenciaEntidad, ROL } from './herencia.types';

@Injectable()
export class HerenciaService {
  constructor(private readonly db: DatabaseService) {}

  async resolverUsuariosAccesibles(
    userId: number,
    roleId: number,
    scope: HerenciaScope,
  ): Promise<number[]> {
    switch (scope) {
      case 'propio':
        return [userId];
      case 'hijos':
        return this.resolverHijos(userId, roleId);
      case 'hermanos':
        return this.resolverHermanos(userId);
      case 'descendientes':
        return this.resolverDescendientes(userId, roleId);
      default:
        return [userId];
    }
  }

  async obtenerPadre(
    userId: number,
  ): Promise<{ id_usuario: number; id_rol: number } | null> {
    const token = await this.db.tOKEN_REGISTRO.findFirst({
      where: { id_usuario_nuevo: userId },
      select: { id_usuario_creador: true },
    });

    if (!token?.id_usuario_creador) return null;

    const padre = await this.db.uSUARIOS.findUnique({
      where: { id_usuario: token.id_usuario_creador },
      select: { id_usuario: true, id_rol: true },
    });

    return padre;
  }

  async obtenerHijos(
    userId: number,
    roleId?: number,
  ): Promise<{ id_usuario: number; id_rol: number }[]> {
    const where: any = {
      id_usuario_creador: userId,
      es_usado: true,
      id_usuario_nuevo: { not: null },
    };
    if (roleId !== undefined) {
      where.id_rol_nuevo_usuario = roleId;
    }

    const tokens = await this.db.tOKEN_REGISTRO.findMany({
      where,
      select: {
        id_usuario_nuevo: true,
        id_rol_nuevo_usuario: true,
      },
    });

    return tokens
      .filter((t) => t.id_usuario_nuevo !== null)
      .map((t) => ({
        id_usuario: t.id_usuario_nuevo!,
        id_rol: t.id_rol_nuevo_usuario,
      }));
  }

  async verificarAccesoEntidad(
    targetId: number,
    usuariosAccesibles: number[],
    entidad: HerenciaEntidad,
  ): Promise<boolean> {
    switch (entidad) {
      case 'usuario':
        return usuariosAccesibles.includes(targetId);
      case 'tienda': {
        const tienda = await this.db.tIENDAS.findUnique({
          where: { id_tienda: targetId },
          select: { id_usuario: true },
        });
        return tienda
          ? usuariosAccesibles.includes(tienda.id_usuario)
          : false;
      }
      case 'nevera': {
        const nevera = await this.db.nEVERAS.findUnique({
          where: { id_nevera: targetId },
          include: { tienda: { select: { id_usuario: true } } },
        });
        return nevera
          ? usuariosAccesibles.includes(nevera.tienda.id_usuario)
          : false;
      }
      default:
        return false;
    }
  }

  private async resolverHijos(
    userId: number,
    roleId: number,
  ): Promise<number[]> {
    if (roleId === ROL.SUPER_ADMIN) {
      const all = await this.db.uSUARIOS.findMany({
        where: { activo: true },
        select: { id_usuario: true },
      });
      return all.map((u) => u.id_usuario);
    }

    if (roleId === ROL.ADMIN || roleId === ROL.LOGISTICA) {
      const hijos = await this.obtenerHijos(userId);
      return [userId, ...hijos.map((h) => h.id_usuario)];
    }

    return [userId];
  }

  private async resolverHermanos(userId: number): Promise<number[]> {
    const padre = await this.obtenerPadre(userId);
    if (!padre) {
      return [userId];
    }

    const hermanos = await this.obtenerHijos(padre.id_usuario);
    return hermanos.map((h) => h.id_usuario);
  }

  private async resolverDescendientes(
    userId: number,
    roleId: number,
  ): Promise<number[]> {
    if (roleId === ROL.SUPER_ADMIN) {
      const all = await this.db.uSUARIOS.findMany({
        where: { activo: true },
        select: { id_usuario: true },
      });
      return all.map((u) => u.id_usuario);
    }

    if (roleId === ROL.ADMIN) {
      return this.resolverScopeAdmin(userId);
    }

    if (roleId === ROL.LOGISTICA) {
      const padre = await this.obtenerPadre(userId);
      if (!padre) {
        return [userId];
      }
      return this.resolverScopeAdmin(padre.id_usuario);
    }

    return [userId];
  }

  private async resolverScopeAdmin(adminId: number): Promise<number[]> {
    const hijos = await this.obtenerHijos(adminId);

    const idsHijos = hijos.map((h) => h.id_usuario);
    const hijosRol4 = hijos.filter((h) => h.id_rol === ROL.LOGISTICA);

    let idsNietos: number[] = [];
    if (hijosRol4.length > 0) {
      const nietosTokens = await this.db.tOKEN_REGISTRO.findMany({
        where: {
          id_usuario_creador: { in: hijosRol4.map((h) => h.id_usuario) },
          es_usado: true,
          id_usuario_nuevo: { not: null },
        },
        select: { id_usuario_nuevo: true },
      });
      idsNietos = nietosTokens
        .map((t) => t.id_usuario_nuevo)
        .filter((id): id is number => id !== null);
    }

    return [adminId, ...idsHijos, ...idsNietos];
  }
}

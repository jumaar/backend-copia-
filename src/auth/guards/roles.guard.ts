import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

@Injectable()
export class RolesGuard implements CanActivate {
  private prisma = new PrismaClient();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Viene del JwtAuthGuard
    const { id_rol: roleToCreate } = request.body;

    if (!user || !user.roleId) {
      throw new ForbiddenException('No se pudo determinar el rol del usuario.');
    }

    if (!roleToCreate) {
      throw new BadRequestException('El rol del nuevo usuario es requerido.');
    }

    const permission = await this.prisma.pERMISOS_ROLES.findUnique({
      where: {
        id_rol_creador_id_rol_creable: {
          id_rol_creador: user.roleId,
          id_rol_creable: roleToCreate,
        },
      },
    });

    if (permission) {
      return true;
    }

    throw new ForbiddenException(
      `No tienes permiso para crear usuarios con el rol especificado.`,
    );
  }
}
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<number[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    this.logger.debug(`Roles requeridos: ${JSON.stringify(requiredRoles)}`);

    if (!requiredRoles) {
      this.logger.debug('No se requieren roles específicos');
      return true; // No roles specified, access granted
    }

    const { user } = context.switchToHttp().getRequest();
    this.logger.debug(`Usuario en request: ${JSON.stringify(user)}`);

    if (!user || !user.roleId) {
      this.logger.warn('Usuario no encontrado o sin roleId');
      throw new ForbiddenException('No se pudo determinar el rol del usuario.');
    }

    const hasRole = requiredRoles.some((roleId) => user.roleId === roleId);
    this.logger.debug(`Usuario tiene rol requerido: ${hasRole}, roleId del usuario: ${user.roleId}`);

    if (hasRole) {
      return true;
    }

    this.logger.warn('Acceso denegado por falta de permisos');
    throw new ForbiddenException(
      'No tienes permiso para acceder a este recurso.',
    );
  }
}
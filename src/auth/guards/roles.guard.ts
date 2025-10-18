import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { creationPermissions } from '../../config/roles.config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { role: roleToCreate } = request.body;

    if (!roleToCreate) {
      throw new BadRequestException('El rol del nuevo usuario es requerido.');
    }

    const allowedRolesToCreate = creationPermissions[user.role];

    if (allowedRolesToCreate && allowedRolesToCreate.includes(roleToCreate)) {
      return true;
    }

    throw new ForbiddenException(
      `El rol '${user.role}' no tiene permiso para crear usuarios con el rol '${roleToCreate}'.`,
    );
  }
}
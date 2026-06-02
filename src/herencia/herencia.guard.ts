import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HerenciaService } from './herencia.service';
import { HERENCIA_KEY, HerenciaMetadata } from './herencia.types';

@Injectable()
export class HerenciaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly herenciaService: HerenciaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<HerenciaMetadata>(
      HERENCIA_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id_usuario || user.roleId === undefined) {
      throw new ForbiddenException(
        'No se pudo determinar la identidad del usuario.',
      );
    }

    const { id_usuario, roleId } = user;

    const usuariosAccesibles =
      await this.herenciaService.resolverUsuariosAccesibles(
        id_usuario,
        roleId,
        metadata.scope,
      );

    request.accessibleUserIds = usuariosAccesibles;

    if (metadata.tipo === 'verificar') {
      if (!metadata.paramKey) {
        throw new ForbiddenException(
          'Configuración de herencia incorrecta: falta paramKey.',
        );
      }

      const targetId = this.extraerTargetId(request, metadata.paramKey);

      if (targetId === null || targetId === undefined || isNaN(targetId)) {
        throw new ForbiddenException(
          `Parámetro '${metadata.paramKey}' no encontrado en la solicitud.`,
        );
      }

      const tieneAcceso = await this.herenciaService.verificarAccesoEntidad(
        targetId,
        usuariosAccesibles,
        metadata.entidad,
      );

      if (!tieneAcceso) {
        throw new ForbiddenException(
          `No tienes acceso a este recurso (${metadata.entidad} fuera de tu jerarquía).`,
        );
      }
    }

    return true;
  }

  private extraerTargetId(request: any, paramKey: string): number | null {
    if (request.params && request.params[paramKey] !== undefined) {
      return +request.params[paramKey];
    }
    if (request.query && request.query[paramKey] !== undefined) {
      return +request.query[paramKey];
    }
    if (request.body && request.body[paramKey] !== undefined) {
      return +request.body[paramKey];
    }
    return null;
  }
}

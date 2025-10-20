import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // El payload del JWT contiene 'sub', que es el id_usuario.
    // Verificamos si el ID del usuario es 1 (Super Admin).
    if (user && user.sub === 1) {
      return true;
    }

    throw new ForbiddenException(
      'Acceso denegado. Se requiere rol de Super Administrador.',
    );
  }
}
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          // Extraer token de cookies HttpOnly (para usuarios normales y estaciones)
          return request?.cookies?.accessToken || request?.cookies?.estacionToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          this.logger.error('JWT_SECRET no encontrado en ConfigService durante la verificación.');
        }
        done(null, secret);
      },
    });
  }

  async validate(payload: any) {
    // Para tokens de neveras (tipo: 'nevera_activacion' o 'nevera_actualizacion')
    if (payload.tipo === 'nevera_activacion' || payload.tipo === 'nevera_actualizacion') {
      if (!payload.sub || !payload.contrasena) {
        this.logger.error(`Token de nevera con payload inválido: ${JSON.stringify(payload)}`);
        throw new UnauthorizedException('Token de nevera con payload inválido o incompleto.');
      }
      return {
        type: 'nevera',
        id_nevera: payload.sub,
        contrasena: payload.contrasena,
      };
    }

    // Para tokens de estaciones (type: 'estacion')
    if (payload.type === 'estacion') {
      if (!payload.sub || !payload.frigorificoId) {
        throw new UnauthorizedException('Token de estación con payload inválido o incompleto.');
      }
      return {
        sub: payload.sub,
        type: payload.type,
        frigorificoId: payload.frigorificoId,
      };
    }

    // Para tokens de usuarios normales
    if (!payload || !payload.sub || payload.roleId === undefined) {
      throw new UnauthorizedException('Token con payload inválido o incompleto.');
    }

    // Confiar en el payload del token. Es seguro porque la firma ya fue verificada.
    // Esto es compatible con el RolesGuard, que espera un objeto `user` con `roleId`.
    return {
      id_usuario: payload.sub,
      email: payload.email,
      roleId: payload.roleId,
    };
  }
}
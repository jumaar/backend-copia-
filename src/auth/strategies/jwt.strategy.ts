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
          // Extraer token de cookies HttpOnly
          return request?.cookies?.accessToken;
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
    this.logger.debug(`Validando payload de JWT (versión final simple): ${JSON.stringify(payload)}`);

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
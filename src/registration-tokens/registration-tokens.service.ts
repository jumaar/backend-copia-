import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateRegistrationTokenDto } from './dto/create-registration-token.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RegistrationTokensService {
  constructor(private databaseService: DatabaseService) {}

  async createToken(
    createTokenDto: CreateRegistrationTokenDto,
    creator: { id: number; roleId: number },
  ) {
    // --- INICIO DEL LIMPIADOR (FIRE-AND-FORGET) ---
    this.databaseService.tOKEN_REGISTRO.deleteMany({
      where: {
        es_usado: false,
        expira_en: { lt: new Date() }, // lt = less than
      },
    }).catch((err) => {
      // Opcional: Loguear el error si la limpieza falla, pero no detener la operación principal.
      console.error('Error durante la limpieza de tokens de registro expirados:', err);
    });
    // --- FIN DEL LIMPIADOR ---

    // 1. Verificar permisos usando la tabla PERMISOS_DE_ROLES
    const canCreate = await this.databaseService.pERMISOS_ROLES.findUnique({
      where: {
        id_rol_creador_id_rol_creable: {
          id_rol_creador: creator.roleId,
          id_rol_creable: createTokenDto.id_rol_nuevo_usuario,
        },
      },
    });

    if (!canCreate) {
      throw new ForbiddenException(
        'No tienes permiso para crear un token de registro para este rol.',
      );
    }

    // 2. Si tiene permiso, proceder a crear el token
    const tokenString = crypto.randomBytes(24).toString('hex'); // Longitud reducida a 48 caracteres
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // El token expira en 1 hora

    const newToken = await this.databaseService.tOKEN_REGISTRO.create({
      data: {
        token: tokenString,
        expira_en: expiresAt,
        id_usuario_creador: creator.id,
        id_rol_nuevo_usuario: createTokenDto.id_rol_nuevo_usuario,
      },
    });

    // 3. Devolver la información del token creado
    return this.databaseService.tOKEN_REGISTRO.findUnique({
      where: { token: newToken.token },
      select: {
        token: true,
        expira_en: true,
        rol_nuevo_usuario: {
          select: {
            nombre_rol: true,
          },
        },
        creador: {
          select: {
            nombre_usuario: true,
          },
        },
      },
    });
  }

  async validateToken(token: string) {
    const foundToken = await this.databaseService.tOKEN_REGISTRO.findUnique({
      where: { token },
    });

    if (!foundToken) {
      throw new NotFoundException('Token de registro no encontrado.');
    }

    if (foundToken.es_usado) {
      throw new BadRequestException('Este token ya ha sido utilizado.');
    }

    if (foundToken.expira_en < new Date()) {
      throw new BadRequestException('Este token ha expirado.');
    }

    return foundToken;
  }

  async markTokenAsUsed(token: string, userId: number) {
    return this.databaseService.tOKEN_REGISTRO.update({
      where: { token },
      data: {
        es_usado: true,
        id_usuario_nuevo: userId,
      },
    });
  }

  async findAllUnused(creatorId: number) {
    return this.databaseService.tOKEN_REGISTRO.findMany({
      where: {
        id_usuario_creador: creatorId,
        es_usado: false,
        expira_en: {
          gte: new Date(), // gte significa "greater than or equal to"
        },
      },
      select: {
        token: true,
        expira_en: true,
        rol_nuevo_usuario: {
          select: {
            nombre_rol: true,
          },
        },
        creador: {
          select: {
            nombre_usuario: true,
          },
        },
      },
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import * as crypto from 'crypto';
import { CreateRegistrationTokenDto } from './dto/create-registration-token.dto';

@Injectable()
export class RegistrationTokensService {
  private prisma = new PrismaClient();

  async createToken(createTokenDto: CreateRegistrationTokenDto, creatorId: number) {
    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // El token expira en 7 días

    await this.prisma.tOKEN_REGISTRO.create({
      data: {
        token: tokenString,
        expira_en: expiresAt,
        id_usuario_creador: creatorId,
        id_rol_nuevo_usuario: createTokenDto.id_rol_nuevo_usuario,
      },
    });

    // Después de crear, buscamos el token para devolverlo con la información del rol
    return this.prisma.tOKEN_REGISTRO.findUnique({
      where: { token: tokenString },
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
    const foundToken = await this.prisma.tOKEN_REGISTRO.findUnique({
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
    return this.prisma.tOKEN_REGISTRO.update({
      where: { token },
      data: {
        es_usado: true,
        id_usuario_nuevo: userId,
      },
    });
  }

  async findAllUnused(creatorId: number) {
    return this.prisma.tOKEN_REGISTRO.findMany({
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

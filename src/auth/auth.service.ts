import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { TurnstileService } from './services/turnstile.service';
import { DatabaseService } from '../database/database.service';
import { RegistrationTokensService } from '../registration-tokens/registration-tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private turnstileService: TurnstileService,
    private registrationTokensService: RegistrationTokensService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password, turnstileToken } = loginDto;

    if (turnstileToken) {
      const isValidTurnstile = await this.turnstileService.verifyToken(turnstileToken);
      if (!isValidTurnstile) {
        throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
      }
    }

    const user = await this.databaseService.uSUARIOS.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.contraseña))) {
      const { contraseña, ...result } = user;
      const payload = { email: user.email, sub: user.id_usuario, roleId: user.id_rol };

      // Generar Access Token (corto)
      const accessTokenExpiry = this.configService.get<number>('ACCESS_TOKEN_EXPIRY', 900);
      const accessToken = this.jwtService.sign(payload, { expiresIn: `${accessTokenExpiry}s` });

      // Generar Refresh Token (largo)
      const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRY', 604800);
      const refreshToken = this.jwtService.sign(
        { sub: user.id_usuario },
        { expiresIn: refreshTokenExpiry }
      );

      // Invalidar tokens de refresco anteriores y guardar el nuevo
      await this.databaseService.rEFRESH_TOKENS.deleteMany({
        where: { id_usuario: user.id_usuario },
      });

      const expiraEn = new Date(Date.now() + refreshTokenExpiry * 1000);
      await this.databaseService.rEFRESH_TOKENS.create({
        data: {
          id_usuario: user.id_usuario,
          token: refreshToken,
          expira_en: expiraEn,
        },
      });

      return {
        ...result,
        accessToken,
        refreshToken,
      };
    }
    throw new UnauthorizedException('Usuario o contraseña inválidos');
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, turnstileToken, registrationToken, ...restCreateUserDto } = createUserDto;

    const token = await this.registrationTokensService.validateToken(registrationToken);

    const isValidTurnstile = await this.turnstileService.verifyToken(turnstileToken);
    if (!isValidTurnstile) {
      throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
    }

    const userExists = await this.databaseService.uSUARIOS.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      email,
      contraseña: hashedPassword,
      activo: true,
      id_rol: token.id_rol_nuevo_usuario,
    };

    if (restCreateUserDto.nombre_usuario) userData.nombre_usuario = restCreateUserDto.nombre_usuario;
    if (restCreateUserDto.apellido_usuario) userData.apellido_usuario = restCreateUserDto.apellido_usuario;
    if (restCreateUserDto.identificacion_usuario) userData.identificacion_usuario = restCreateUserDto.identificacion_usuario;
    if (restCreateUserDto.celular) userData.celular = restCreateUserDto.celular;

    const user = await this.databaseService.uSUARIOS.create({
      data: userData,
    });

    await this.registrationTokensService.markTokenAsUsed(registrationToken, user.id_usuario);

    const { contraseña, ...result } = user;
    return {
      message: 'Usuario creado exitosamente',
      user: result,
    };
  }
  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token no proporcionado.');
    }

    try {
      // Verificar el token para obtener el ID de usuario (sub)
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      // Eliminar TODOS los refresh tokens para ese usuario
      await this.databaseService.rEFRESH_TOKENS.deleteMany({
        where: { id_usuario: payload.sub },
      });

      return { message: 'Logout exitoso, todas las sesiones han sido cerradas.' };
    } catch (error) {
      // Si el token ha expirado o es inválido, jwtService.verify lanzará un error
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No se proporcionó un refresh token.');
    }

    // 1. Buscar y eliminar el token en una transacción para evitar race conditions
    const storedToken = await this.databaseService.$transaction(async (prisma) => {
      const tokenData = await prisma.rEFRESH_TOKENS.findUnique({
        where: { token: refreshToken },
        include: { usuario: true },
      });

      if (!tokenData || tokenData.expira_en < new Date()) {
        // Si el token no existe o ha expirado, invalidamos todos los tokens del usuario como medida de seguridad
        if (tokenData) {
          await prisma.rEFRESH_TOKENS.deleteMany({
            where: { id_usuario: tokenData.id_usuario },
          });
        }
        throw new UnauthorizedException('Refresh Token inválido o expirado.');
      }

      // Eliminar el token usado
      // Usamos deleteMany para evitar un error si peticiones concurrentes ya eliminaron el token.
      // Esto hace la rotación de tokens resiliente a race conditions.
      await prisma.rEFRESH_TOKENS.deleteMany({
        where: { id_refresh_token: tokenData.id_refresh_token },
      });

      return tokenData;
    });

    const { usuario } = storedToken;

    // 2. Generar un nuevo Access Token
    const accessTokenExpiry = this.configService.get<number>('ACCESS_TOKEN_EXPIRY', 900);
    const accessPayload = {
      email: usuario.email,
      sub: usuario.id_usuario,
      roleId: usuario.id_rol,
    };
    const newAccessToken = this.jwtService.sign(accessPayload, { expiresIn: `${accessTokenExpiry}s` });

    // 3. Generar un nuevo Refresh Token
    const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRY', 604800);
    const newRefreshToken = this.jwtService.sign(
      { sub: usuario.id_usuario, nonce: randomUUID() },
      { expiresIn: refreshTokenExpiry },
    );

    // 4. Guardar el nuevo Refresh Token en la DB
    const expiraEn = new Date(Date.now() + refreshTokenExpiry * 1000);
    await this.databaseService.rEFRESH_TOKENS.create({
      data: {
        id_usuario: usuario.id_usuario,
        token: newRefreshToken,
        expira_en: expiraEn,
      },
    });

    // 5. Devolver ambos tokens (el refresh token se enviará en la cookie desde el controlador)
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // El controlador se encargará de la cookie
    };
  }
}
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
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
  private readonly logger = new Logger(AuthService.name);

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
      // Verificar si el usuario está activo
      if (!user.activo) {
        throw new UnauthorizedException('Usuario inactivo. Comuníquese con un administrador.');
      }
      
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
    const {
      email,
      password,
      turnstileToken,
      registrationToken,
      nombre_usuario,
      apellido_usuario,
      identificacion_usuario,
      celular,
    } = createUserDto;

    // 1. Validar tokens (Turnstile y de Registro)
    const token = await this.registrationTokensService.validateToken(registrationToken);
    const isValidTurnstile = await this.turnstileService.verifyToken(turnstileToken);
    if (!isValidTurnstile) {
      throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
    }

    // 2. Verificar unicidad de email, identificación y celular
    if (identificacion_usuario) {
      const existingId = await this.databaseService.uSUARIOS.findUnique({ where: { identificacion_usuario } });
      if (existingId) {
        throw new ConflictException(`La identificación '${identificacion_usuario}' ya está registrada.`);
      }
    }
    if (celular) {
      const existingCelular = await this.databaseService.uSUARIOS.findUnique({ where: { celular } });
      if (existingCelular) {
        throw new ConflictException(`El celular '${celular}' ya está registrado.`);
      }
    }
    const userExists = await this.databaseService.uSUARIOS.findUnique({
      where: { email },
    });
    if (userExists) {
      throw new ConflictException(`El email '${email}' ya está registrado.`);
    }

    // 3. Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Construir el objeto de datos explícitamente para evitar pasar campos no deseados
    const userData = {
      email,
      contraseña: hashedPassword,
      activo: true,
      id_rol: token.id_rol_nuevo_usuario,
      nombre_usuario,
      apellido_usuario,
      identificacion_usuario,
      celular,
    };

    // 5. Crear el usuario
    // Limpiar el objeto de datos para remover claves con valor 'undefined'
    Object.keys(userData).forEach(key => userData[key] === undefined && delete userData[key]);

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
    this.logger.debug(`--- Iniciando proceso de Refresh Token ---`);
    if (!refreshToken) {
      this.logger.error('Refresh fallido: No se proporcionó un refresh token.');
      throw new UnauthorizedException('No se proporcionó un refresh token.');
    }
    this.logger.debug(`Token recibido (parcial): ${refreshToken.substring(0, 10)}...`);

    // 1. Buscar y eliminar el token en una transacción para evitar race conditions
    const storedToken = await this.databaseService.$transaction(async (prisma) => {
      const tokenData = await prisma.rEFRESH_TOKENS.findUnique({
        where: { token: refreshToken },
        include: { usuario: true },
      });

      if (!tokenData) {
        this.logger.error(`Refresh fallido: El token no fue encontrado en la base de datos.`);
        throw new UnauthorizedException('Refresh Token inválido o expirado.');
      }

      if (tokenData.expira_en < new Date()) {
        this.logger.error(`Refresh fallido: El token encontrado ha expirado. Expiró en: ${tokenData.expira_en}`);
        // Medida de seguridad: si se intenta usar un token expirado, invalidamos todos los de ese usuario.
        await prisma.rEFRESH_TOKENS.deleteMany({
          where: { id_usuario: tokenData.id_usuario },
        });
        throw new UnauthorizedException('Refresh Token inválido o expirado.');
      }

      this.logger.debug(`Token encontrado para el usuario ID: ${tokenData.usuario.id_usuario}`);

      // Eliminar el token usado
      await prisma.rEFRESH_TOKENS.deleteMany({
        where: { id_refresh_token: tokenData.id_refresh_token },
      });
      this.logger.debug(`Token ID ${tokenData.id_refresh_token} eliminado de la DB.`);

      return tokenData;
    });

    const { usuario } = storedToken;
    this.logger.debug(`Generando nuevos tokens para el usuario: ${usuario.email}`);

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

    // 5. Devolver la información del usuario junto con los tokens
    const { contraseña, ...userData } = usuario;
    return {
      ...userData,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // El controlador se encargará de la cookie
    };
  }
}
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
      
      return {
        ...result,
        token: this.jwtService.sign(payload),
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
}
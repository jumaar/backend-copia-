import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service'; // Ruta ya era correcta, pero la confirmo.
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { TurnstileService } from './services/turnstile.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private turnstileService: TurnstileService,
  ) {}

  async login(loginDto: LoginDto) {
    const { turnstileToken } = loginDto;

    // Verificar Turnstile token si se proporciona
    if (turnstileToken) {
      const isValidTurnstile = await this.turnstileService.verifyToken(turnstileToken);
      if (!isValidTurnstile) {
        throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
      }
    }

    const user = await this.usersService.findOneByUsername(loginDto.email);

    if (user && user.password && (await bcrypt.compare(loginDto.password, user.password))) {
      const payload = { email: user.username, sub: user.id, role: user.role };
      const { password, ...result } = user;
      return {
        ...result,
        token: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException('Usuario o contraseña inválidos');
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, role, turnstileToken } = createUserDto;

    // Verificar Turnstile token
    const isValidTurnstile = await this.turnstileService.verifyToken(turnstileToken);
    if (!isValidTurnstile) {
      throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
    }

    const userExists = await this.usersService.findOneByUsername(email);
    if (userExists) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      username: email,
      password: hashedPassword,
      role,
    });

    return {
      message: 'Usuario creado exitosamente',
      user: user,
    };
  }
}
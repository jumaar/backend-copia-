import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 peticiones por minuto
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.authService.login(loginDto);

    // Establecer Access Token en cookie HttpOnly
    reply.setCookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60, // 15 minutos (segundos, no ms)
      path: '/',
    });

    // Establecer Refresh Token en cookie HttpOnly
    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 días (segundos)
      path: '/',
    });

    // No devolver tokens en la respuesta JSON
    const { accessToken, refreshToken, ...responseData } = result;
    return responseData;
  }

  @Post('create-user')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 peticiones por minuto
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.createUser(createUserDto);
  }
  @Post('refresh')
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const oldRefreshToken = request.cookies['refreshToken'] || '';
    const result = await this.authService.refreshToken(oldRefreshToken);

    // Establecer el NUEVO Access Token en cookie HttpOnly
    reply.setCookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60, // 15 minutos (segundos)
      path: '/',
    });

    // Establecer el NUEVO Refresh Token en la cookie
    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 días (segundos)
      path: '/',
    });

    // Devolver la información del usuario (igual que en login)
    const { accessToken, refreshToken, ...userData } = result;
    return userData;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const refreshToken = request.cookies['refreshToken'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Limpiar cookies HttpOnly
    reply.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    reply.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logout exitoso' };
  }
}
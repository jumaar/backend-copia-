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
import type { Response, Request } from 'express';
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
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);

    // Establecer Access Token en cookie HttpOnly
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true, // HTTPS requerido para sameSite: 'none'
      sameSite: 'none', // Permite cross-origin
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    // Establecer Refresh Token en cookie HttpOnly
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS requerido para sameSite: 'none'
      sameSite: 'none', // Permite cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
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
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const oldRefreshToken = request.cookies['refreshToken'];
    const result = await this.authService.refreshToken(oldRefreshToken);

    // Establecer el NUEVO Access Token en cookie HttpOnly
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true, // HTTPS requerido para sameSite: 'none'
      sameSite: 'none', // Permite cross-origin
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    // Establecer el NUEVO Refresh Token en la cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS requerido para sameSite: 'none'
      sameSite: 'none', // Permite cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Devolver la información del usuario (igual que en login)
    const { accessToken, refreshToken, ...userData } = result;
    return userData;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies['refreshToken'];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Limpiar cookies HttpOnly
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logout exitoso' };
  }
}
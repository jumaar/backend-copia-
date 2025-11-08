import { Controller, Post, Param, Body, BadRequestException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FrigorificoService } from './frigorifico.service';
import { TurnstileService } from '../auth/services/turnstile.service';

@Controller('api/frigorifico/estacion')
export class EstacionController {
  constructor(
    private readonly frigorificoService: FrigorificoService,
    private readonly turnstileService: TurnstileService,
  ) {}

  @Post('login/:claveVinculacion')
  async loginEstacion(
    @Param('claveVinculacion') claveVinculacion: string,
    @Body() body: { turnstileToken?: string },
    @Res({ passthrough: true }) response: Response
  ) {
    const { turnstileToken } = body;

    // Validar Turnstile token solo si está presente (para testing)
    if (turnstileToken) {
      const isValidTurnstile = await this.turnstileService.verifyToken(turnstileToken);
      if (!isValidTurnstile) {
        throw new BadRequestException('Verificación de seguridad fallida. Por favor, intenta de nuevo.');
      }
    }

    const result = await this.frigorificoService.loginEstacion(claveVinculacion);

    // Establecer Access Token en cookie HttpOnly para estaciones
    response.cookie('estacionToken', result.access_token, {
      httpOnly: true,
      secure: true, // HTTPS requerido para sameSite: 'none'
      sameSite: 'none', // Permite cross-origin
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    // Devolver respuesta sin el token (ya está en la cookie)
    const { access_token, ...responseData } = result;
    return responseData;
  }
}
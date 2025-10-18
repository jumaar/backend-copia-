import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TurnstileService {
  constructor(private configService: ConfigService) {}

  async verifyToken(token: string): Promise<boolean> {
    try {
      const secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');

      if (!secretKey) {
        throw new Error('TURNSTILE_SECRET_KEY no está configurada');
      }

      const response = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.success;
    } catch (error) {
      console.error('Error verificando Turnstile token:', error);
      return false;
    }
  }
}
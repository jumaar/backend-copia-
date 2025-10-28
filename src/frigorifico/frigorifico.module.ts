import { Module } from '@nestjs/common';
import { FrigorificoService } from './frigorifico.service';
import { FrigorificoController } from './frigorifico.controller';
import { EstacionController } from './estacion.controller';
import { FrigorificoGateway } from './frigorifico.gateway';
import { TurnstileService } from '../auth/services/turnstile.service';

@Module({
  controllers: [FrigorificoController, EstacionController],
  providers: [FrigorificoService, FrigorificoGateway, TurnstileService],
})
export class FrigorificoModule {}

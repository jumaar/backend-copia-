import { Module } from '@nestjs/common';
import { FrigorificoService } from './frigorifico.service';
import { FrigorificoController } from './frigorifico.controller';

@Module({
  controllers: [FrigorificoController],
  providers: [FrigorificoService],
})
export class FrigorificoModule {}

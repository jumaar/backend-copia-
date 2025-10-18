import { Module } from '@nestjs/common';
import { LogisticaService } from './logistica.service';
import { LogisticaController } from './logistica.controller';

@Module({
  controllers: [LogisticaController],
  providers: [LogisticaService],
})
export class LogisticaModule {}

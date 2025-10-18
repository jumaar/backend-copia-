import { Module } from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { NeverasController } from './neveras.controller';

@Module({
  controllers: [NeverasController],
  providers: [NeverasService],
})
export class NeverasModule {}

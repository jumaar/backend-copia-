import { Module } from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { NeverasController } from './neveras.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NeverasController],
  providers: [NeverasService],
})
export class NeverasModule {}

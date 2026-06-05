import { Global, Module } from '@nestjs/common';
import { TransaccionesService } from './transacciones.service';

@Global()
@Module({
  providers: [TransaccionesService],
  exports: [TransaccionesService],
})
export class TransaccionesModule {}

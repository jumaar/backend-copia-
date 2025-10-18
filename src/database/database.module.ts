import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global() // <-- Esto convierte nuestra tubería en una instalación global
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService], // <-- "Exportamos" la tubería para que otros la usen
})
export class DatabaseModule {}
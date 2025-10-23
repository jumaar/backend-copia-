import { Module } from '@nestjs/common';
import { GestionUsuariosService } from './gestion-usuarios.service';
import { GestionUsuariosController } from './gestion-usuarios.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GestionUsuariosController],
  providers: [GestionUsuariosService],
})
export class GestionUsuariosModule {}

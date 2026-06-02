import { Global, Module } from '@nestjs/common';
import { HerenciaService } from './herencia.service';
import { HerenciaGuard } from './herencia.guard';
import { DatabaseModule } from '../database/database.module';

/**
 * ─────────────────────────────────────────────────────────────────
 * HerenciaModule — Módulo global de jerarquía
 * ─────────────────────────────────────────────────────────────────
 *
 * @Global() → Disponible en TODA la aplicación sin necesidad de
 *             importarlo en cada módulo individual.
 *             Solo se importa UNA VEZ en AppModule.
 *
 * Providers exportados:
 *   HerenciaService → Inyectable en cualquier servicio/guard
 *                      que necesite consultas de jerarquía.
 *   HerenciaGuard   → Usable en @UseGuards() de cualquier controller.
 *
 * ─── USO ─────────────────────────────────────────────────────────
 *
 * En AppModule:
 *   imports: [HerenciaModule]
 *
 * En cualquier controller:
 *   @UseGuards(JwtAuthGuard, RolesGuard, HerenciaGuard)
 *   @Herencia({ tipo: 'resolver', scope: 'descendientes', entidad: 'usuario' })
 *
 * En cualquier service:
 *   constructor(private readonly herencia: HerenciaService) {}
 *   const ids = await this.herencia.resolverUsuariosAccesibles(userId, roleId, 'hijos');
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [HerenciaService, HerenciaGuard],
  exports: [HerenciaService, HerenciaGuard],
})
export class HerenciaModule {}

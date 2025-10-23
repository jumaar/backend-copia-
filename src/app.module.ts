import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { NeverasModule } from './neveras/neveras.module';
import { FrigorificoModule } from './frigorifico/frigorifico.module';
import { KioskAdminModule } from './kiosk-admin/kiosk-admin.module';
import { LogisticaModule } from './logistica/logistica.module';
import { DatabaseModule } from './database/database.module';
import { TiendasModule } from './tiendas/tiendas.module';
import { RegistrationTokensModule } from './registration-tokens/registration-tokens.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { GestionUsuariosModule } from './gestion-usuarios/gestion-usuarios.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 60, // 60 peticiones por IP (1 por segundo)
      },
    ]),
    AuthModule,
    DatabaseModule,
    FrigorificoModule,
    NeverasModule,
    KioskAdminModule,
    LogisticaModule,
    TiendasModule,
    RegistrationTokensModule,
    GestionUsuariosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

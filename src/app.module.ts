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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, // <-- Mover al principio para asegurar que sus guards se registren primero
    DatabaseModule,
    FrigorificoModule,
    NeverasModule,
    KioskAdminModule,
    LogisticaModule,
    TiendasModule,
    RegistrationTokensModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}

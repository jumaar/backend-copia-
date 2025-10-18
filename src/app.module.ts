import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { NeverasModule } from './neveras/neveras.module';
import { FrigorificoModule } from './frigorifico/frigorifico.module';
import { KioskAdminModule } from './kiosk-admin/kiosk-admin.module';
import { LogisticaModule } from './logistica/logistica.module';
import { DatabaseModule } from './database/database.module';
import { TiendasModule } from './tiendas/tiendas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FrigorificoModule,
    NeverasModule,
    KioskAdminModule,
    LogisticaModule,
    DatabaseModule,
    TiendasModule
  ],
})
export class AppModule {}

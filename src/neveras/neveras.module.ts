import { Module } from '@nestjs/common';
import { NeverasService } from './neveras.service';
import { NeverasController } from './neveras.controller';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-here',
      signOptions: { expiresIn: '0' }, // Valor predeterminado, se puede sobreescribir
    }),
  ],
  controllers: [NeverasController],
  providers: [NeverasService],
})
export class NeverasModule {}

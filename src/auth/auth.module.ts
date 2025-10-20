import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TurnstileService } from './services/turnstile.service';
import { DatabaseModule } from '../database/database.module';
import { RegistrationTokensModule } from '../registration-tokens/registration-tokens.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    RegistrationTokensModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TurnstileService],
})
export class AuthModule {}
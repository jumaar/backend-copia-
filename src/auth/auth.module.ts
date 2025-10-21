import { Global, Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TurnstileService } from './services/turnstile.service';
import { DatabaseModule } from '../database/database.module';
import { RegistrationTokensModule } from '../registration-tokens/registration-tokens.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        new Logger('JwtModule').debug(
          `JwtModule configurado para FIRMAR. JWT_SECRET: ${
            secret ? 'Cargado' : 'NO CARGADO O VACÍO'
          }`,
        );
        if (!secret) {
          new Logger('JwtModule').error(
            '¡ATENCIÓN! JWT_SECRET no definido en JwtModule. La firma de tokens será insegura.',
          );
        }
        return {
          secret: secret,
        };
      },
    }),
    RegistrationTokensModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TurnstileService],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
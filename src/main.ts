import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const logLevels = process.env.LOG_LEVELS?.split(',') || ['log', 'error', 'warn'];

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      // @ts-ignore - Acepta LogLevel[] pero la definición de tipos es estricta
      logger: logLevels,
    },
  );

  // Registrar plugin de cookies (@fastify/cookie en lugar de cookie-parser)
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'vorak-cookie-secret',
  });

  // Registrar plugin de CORS (@fastify/cors en lugar de app.enableCors)
  await app.register(fastifyCors, {
    origin: [
      'http://localhost:5173',
      'https://localhost:5000',
      'https://www.api.vorak.app',
      'https://vorak.app',
      'https://www.vorak.app',
    ],
    credentials: true,
  });

  // ValidationPipe global (sin cambios)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
  new Logger('Bootstrap').log(`🚀 App listening on port ${port}`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Configuración de logging dinámica para producción
  const logLevels = process.env.LOG_LEVELS?.split(',') || ['log', 'error', 'warn'];

  const app = await NestFactory.create(AppModule, {
    // @ts-ignore - Acepta LogLevel[] pero la definición de tipos es estricta
    logger: logLevels,
  });

  // Middleware para cookies
  app.use(cookieParser());

  // Habilitar CORS para permitir solicitudes desde el frontend
  app.enableCors({
    origin: 'http://localhost:5173', // URL del frontend (Vite)
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`🚀 App listening on port ${port}`);
}
bootstrap();

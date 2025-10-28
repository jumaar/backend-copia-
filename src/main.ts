import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // Configuración de logging dinámica para producción
  const logLevels = process.env.LOG_LEVELS?.split(',') || ['log', 'error', 'warn'];

  const app = await NestFactory.create(AppModule, {
    // @ts-ignore - Acepta LogLevel[] pero la definición de tipos es estricta
    logger: logLevels,
  });

  // Desactivar ETag para evitar respuestas 304 Not Modified y forzar JSON completo
  app.getHttpAdapter().getInstance().set('etag', false);

  // Habilitar ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no permitidas
      transform: true, // Transforma los datos de entrada a su tipo de DTO
    }),
  );

  // Middleware para cookies
  app.use(cookieParser());

  // Habilitar CORS para permitir solicitudes desde el frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5000'], // URLs del frontend (Vite y dev server)
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`🚀 App listening on port ${port}`);
}
bootstrap();

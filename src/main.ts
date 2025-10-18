import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir solicitudes desde el frontend
  app.enableCors({
    origin: 'http://localhost:5173', // URL del frontend (Vite)
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 App listening on port ${port}`);
}
bootstrap();

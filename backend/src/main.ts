import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir consumo desde el Frontend SPA
  app.enableCors();

  // Prefijo global de API para todos los endpoints
  app.setGlobalPrefix('api');

  // Configuración de puerto desde variables de entorno con fallback a 3001
  const port = process.env.PORT || process.env.BACKEND_PORT || 3001;
  await app.listen(port);
  console.log(`Juliam Inventory API corriendo en el puerto ${port}/api`);
}
await bootstrap();


import { AppDataSource } from '../data-source.js';
import { SeedService } from './seed.service.js';

async function runSeed() {
  console.log('[SEED-CLI] Inicializando conexión para siembra de datos...');
  await AppDataSource.initialize();

  const seeder = new SeedService(AppDataSource);
  await seeder.seedAll();

  await AppDataSource.destroy();
  console.log('[SEED-CLI] Proceso de siembra finalizado.');
}

runSeed().catch((error) => {
  console.error('[SEED-CLI] Error en siembra:', error);
  process.exit(1);
});


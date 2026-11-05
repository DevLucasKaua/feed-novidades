import { criarApp } from './app.js';
import { pool } from './db/client.js';
import { aplicarMigrations } from './db/migrate.js';
import { env } from './env.js';

await aplicarMigrations();

const app = criarApp();

for (const sinal of ['SIGTERM', 'SIGINT']) {
  process.once(sinal, async () => {
    await app.close();
    await pool.end();
  });
}

await app.listen({ port: env.PORT, host: '0.0.0.0' });

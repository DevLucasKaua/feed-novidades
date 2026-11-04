import { criarApp } from './app.js';
import { aplicarMigrations } from './db/migrate.js';
import { env } from './env.js';

await aplicarMigrations();

const app = criarApp();

await app.listen({ port: env.PORT, host: '0.0.0.0' });

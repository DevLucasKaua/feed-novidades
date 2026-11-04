import { criarApp } from './app.js';
import { env } from './env.js';

const app = criarApp();

await app.listen({ port: env.PORT, host: '0.0.0.0' });

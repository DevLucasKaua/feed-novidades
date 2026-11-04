import { Client } from 'pg';
import { NOME_BANCO_TESTE, URL_BANCO_ADMIN, URL_BANCO_TESTE } from './banco-teste.js';

export default async function () {
  const admin = new Client({ connectionString: URL_BANCO_ADMIN });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    NOME_BANCO_TESTE,
  ]);
  if (!rowCount) await admin.query(`CREATE DATABASE ${NOME_BANCO_TESTE}`);
  await admin.end();

  process.env.DATABASE_URL = URL_BANCO_TESTE;
  const { aplicarMigrations } = await import('../src/db/migrate.js');
  const { pool } = await import('../src/db/client.js');
  await aplicarMigrations();
  await pool.end();
}

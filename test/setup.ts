import { afterAll, beforeEach } from 'vitest';
import { pool } from '../src/db/client.js';
import { app } from './helpers.js';

beforeEach(() => pool.query('TRUNCATE lojas, clientes RESTART IDENTITY CASCADE'));

afterAll(async () => {
  await app.close();
  await pool.end();
});

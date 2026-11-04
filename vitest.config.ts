import { defineConfig } from 'vitest/config';
import { URL_BANCO_TESTE } from './test/banco-teste.js';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: { DATABASE_URL: URL_BANCO_TESTE, NODE_ENV: 'test' },
    globalSetup: ['test/global-setup.ts'],
    setupFiles: ['test/setup.ts'],
    fileParallelism: false,
  },
});

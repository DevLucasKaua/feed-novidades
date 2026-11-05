import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, '..', 'PORT');
  const api = `http://localhost:${PORT}`;
  const proxy = Object.fromEntries(['/lojas', '/clientes', '/documentation'].map((r) => [r, api]));

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 5173, proxy },
  };
});

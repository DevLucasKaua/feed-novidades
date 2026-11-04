import { describe, it } from 'vitest';
import { app, esperarErro } from './helpers.js';

describe('formato de erro', () => {
  it('rota inexistente usa o formato padrão', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/nao-existe' });
    esperarErro(resposta, 404, 'ROTA_NAO_ENCONTRADA');
  });
});

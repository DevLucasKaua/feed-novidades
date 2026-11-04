import { describe, expect, it } from 'vitest';
import { esperarErro, post } from './helpers.js';

describe('POST /lojas', () => {
  it('cria a loja', async () => {
    const resposta = await post('/lojas', { nome: '  Loja Azul  ' });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json()).toEqual({
      id: 1,
      nome: 'Loja Azul',
      criadoEm: expect.any(String),
    });
  });

  it.each([
    ['ausente', {}],
    ['vazio', { nome: '' }],
    ['só com espaços', { nome: '   ' }],
    ['de outro tipo', { nome: 123 }],
  ])('rejeita nome %s', async (_, corpo) => {
    esperarErro(await post('/lojas', corpo), 422, 'VALIDACAO');
  });
});

import { describe, expect, it } from 'vitest';
import { esperarErro, post } from './helpers.js';

const cliente = { nome: 'Ana', email: 'ana@exemplo.com' };

describe('POST /clientes', () => {
  it('cria o cliente com email normalizado', async () => {
    const resposta = await post('/clientes', { nome: 'Ana', email: ' ANA@Exemplo.com ' });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json()).toEqual({
      id: 1,
      nome: 'Ana',
      email: 'ana@exemplo.com',
      criadoEm: expect.any(String),
    });
  });

  it('rejeita email repetido, sem diferenciar maiúsculas', async () => {
    await post('/clientes', cliente);
    esperarErro(await post('/clientes', cliente), 409, 'CONFLITO');
    esperarErro(await post('/clientes', { ...cliente, email: 'ANA@exemplo.com' }), 409, 'CONFLITO');
  });

  it.each([
    ['sem nome', { email: cliente.email }],
    ['sem email', { nome: cliente.nome }],
    ['com email inválido', { ...cliente, email: 'nao-e-email' }],
  ])('rejeita cliente %s', async (_, corpo) => {
    esperarErro(await post('/clientes', corpo), 422, 'VALIDACAO');
  });

  it('informa o campo inválido nos detalhes', async () => {
    const resposta = await post('/clientes', { nome: cliente.nome });

    expect(resposta.json().erro.detalhes).toEqual([
      { campo: 'email', mensagem: 'email é obrigatório' },
    ]);
  });
});

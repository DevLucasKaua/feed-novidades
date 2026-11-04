import { describe, expect, it } from 'vitest';
import { criarLoja, esperarErro, post } from './helpers.js';

const publicar = async (corpo: object) => post(`/lojas/${await criarLoja()}/novidades`, corpo);

describe('POST /lojas/{id}/novidades', () => {
  it('publica com texto e preço', async () => {
    const lojaId = await criarLoja();

    const resposta = await post(`/lojas/${lojaId}/novidades`, { texto: 'Promoção', preco: 19.9 });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json()).toEqual({
      id: 1,
      lojaId,
      texto: 'Promoção',
      preco: '19.90',
      criadoEm: expect.any(String),
    });
  });

  it.each([
    ['ausente', {}],
    ['nulo', { preco: null }],
  ])('publica com preço %s', async (_, preco) => {
    const resposta = await publicar({ texto: 'Live hoje', ...preco });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json().preco).toBeNull();
  });

  it.each([
    ['1 caractere', 'a'],
    ['500 caracteres', 'a'.repeat(500)],
    ['500 emojis, que somam 1000 unidades UTF-16', '🛍'.repeat(500)],
  ])('aceita texto com %s', async (_, texto) => {
    expect((await publicar({ texto })).statusCode).toBe(201);
  });

  it.each([
    ['ausente', {}],
    ['vazio', { texto: '' }],
    ['só com espaços', { texto: '   ' }],
    ['com 501 caracteres', { texto: 'a'.repeat(501) }],
    ['com 501 emojis', { texto: '🛍'.repeat(501) }],
    ['de outro tipo', { texto: 123 }],
  ])('rejeita texto %s', async (_, corpo) => {
    esperarErro(await publicar(corpo), 422, 'VALIDACAO');
  });

  it.each([
    ['zero', 0],
    ['negativo', -1],
    ['em string', '19.90'],
    ['com 3 casas decimais', 19.999],
    ['acima do que a coluna guarda', 10_000_000_000],
  ])('rejeita preço %s', async (_, preco) => {
    esperarErro(await publicar({ texto: 'Oferta', preco }), 422, 'VALIDACAO');
  });

  it.each([
    [0.01, '0.01'],
    [19.99, '19.99'],
    [9_999_999_999.99, '9999999999.99'],
  ])('guarda o preço %d sem perda', async (preco, esperado) => {
    expect((await publicar({ texto: 'Oferta', preco })).json().preco).toBe(esperado);
  });

  it('retorna 404 para loja inexistente', async () => {
    esperarErro(await post('/lojas/999/novidades', { texto: 'Oi' }), 404, 'NAO_ENCONTRADO');
  });

  it('retorna 422 para id inválido', async () => {
    esperarErro(await post('/lojas/abc/novidades', { texto: 'Oi' }), 422, 'VALIDACAO');
  });
});

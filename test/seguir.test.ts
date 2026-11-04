import { describe, expect, it } from 'vitest';
import { criarCliente, criarLoja, esperarErro, post } from './helpers.js';

describe('POST /clientes/{id}/seguindo/{lojaId}', () => {
  it('faz o cliente seguir a loja', async () => {
    const [clienteId, lojaId] = [await criarCliente(), await criarLoja()];

    const resposta = await post(`/clientes/${clienteId}/seguindo/${lojaId}`);

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json()).toEqual({ clienteId, lojaId, criadoEm: expect.any(String) });
  });

  it('retorna 404 para cliente inexistente', async () => {
    const lojaId = await criarLoja();
    const resposta = await post(`/clientes/999/seguindo/${lojaId}`);

    esperarErro(resposta, 404, 'NAO_ENCONTRADO');
    expect(resposta.json().erro.mensagem).toContain('Cliente');
  });

  it('retorna 404 para loja inexistente', async () => {
    const clienteId = await criarCliente();
    const resposta = await post(`/clientes/${clienteId}/seguindo/999`);

    esperarErro(resposta, 404, 'NAO_ENCONTRADO');
    expect(resposta.json().erro.mensagem).toContain('Loja');
  });

  it('retorna 409 ao seguir a mesma loja duas vezes', async () => {
    const url = `/clientes/${await criarCliente()}/seguindo/${await criarLoja()}`;
    await post(url);

    esperarErro(await post(url), 409, 'CONFLITO');
  });

  it('aceita só uma de várias requisições simultâneas', async () => {
    const url = `/clientes/${await criarCliente()}/seguindo/${await criarLoja()}`;

    const respostas = await Promise.all(Array.from({ length: 5 }, () => post(url)));

    const status = respostas.map((r) => r.statusCode).sort();
    expect(status).toEqual([201, 409, 409, 409, 409]);
  });

  it('permite clientes diferentes seguirem a mesma loja', async () => {
    const lojaId = await criarLoja();

    for (const clienteId of [await criarCliente(), await criarCliente()]) {
      expect((await post(`/clientes/${clienteId}/seguindo/${lojaId}`)).statusCode).toBe(201);
    }
  });

  it.each(['abc', '0', '-1', '1.5', '1e3', '99999999999999999999'])(
    'retorna 422 para id %s',
    async (id) => {
      esperarErro(await post(`/clientes/${id}/seguindo/1`), 422, 'VALIDACAO');
      esperarErro(await post(`/clientes/1/seguindo/${id}`), 422, 'VALIDACAO');
    },
  );
});

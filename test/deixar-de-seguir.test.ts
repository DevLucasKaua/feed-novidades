import { describe, expect, it } from 'vitest';
import { app, criarCliente, criarLoja, esperarErro, post } from './helpers.js';

const deixarDeSeguir = (url: string) => app.inject({ method: 'DELETE', url });

async function clienteSeguindoLoja() {
  const [clienteId, lojaId] = [await criarCliente(), await criarLoja()];
  const url = `/clientes/${clienteId}/seguindo/${lojaId}`;
  await post(url);
  return { clienteId, lojaId, url };
}

describe('DELETE /clientes/{id}/seguindo/{lojaId}', () => {
  it('retorna 204 sem corpo', async () => {
    const { url } = await clienteSeguindoLoja();

    const resposta = await deixarDeSeguir(url);

    expect(resposta.statusCode).toBe(204);
    expect(resposta.body).toBe('');
  });

  it('remove as novidades da loja do feed', async () => {
    const { clienteId, lojaId, url } = await clienteSeguindoLoja();
    await post(`/lojas/${lojaId}/novidades`, { texto: 'Oferta' });

    await deixarDeSeguir(url);

    const feed = await app.inject({ method: 'GET', url: `/clientes/${clienteId}/feed` });
    expect(feed.json()).toEqual({ novidades: [] });
  });

  it('não afeta outro cliente que segue a mesma loja', async () => {
    const { lojaId, url } = await clienteSeguindoLoja();
    const outroCliente = await criarCliente();
    await post(`/clientes/${outroCliente}/seguindo/${lojaId}`);
    await post(`/lojas/${lojaId}/novidades`, { texto: 'Oferta' });

    await deixarDeSeguir(url);

    const feed = await app.inject({ method: 'GET', url: `/clientes/${outroCliente}/feed` });
    expect(feed.json().novidades).toHaveLength(1);
  });

  it('permite seguir de novo depois', async () => {
    const { url } = await clienteSeguindoLoja();
    await deixarDeSeguir(url);

    expect((await post(url)).statusCode).toBe(201);
  });

  it('retorna 404 quando o cliente não segue a loja', async () => {
    const url = `/clientes/${await criarCliente()}/seguindo/${await criarLoja()}`;

    esperarErro(await deixarDeSeguir(url), 404, 'NAO_ENCONTRADO');
  });

  it('retorna 404 ao repetir a operação', async () => {
    const { url } = await clienteSeguindoLoja();
    await deixarDeSeguir(url);

    esperarErro(await deixarDeSeguir(url), 404, 'NAO_ENCONTRADO');
  });

  it('retorna 422 para id inválido', async () => {
    esperarErro(await deixarDeSeguir('/clientes/abc/seguindo/1'), 422, 'VALIDACAO');
  });
});

import { describe, expect, it } from 'vitest';
import {
  app,
  clienteSeguindoLoja,
  criarCliente,
  criarLoja,
  esperarErro,
  obterFeed,
  post,
  seguir,
} from './helpers.js';

const deixarDeSeguir = (url: string) => app.inject({ method: 'DELETE', url });

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

    expect((await obterFeed(clienteId)).json().novidades).toEqual([]);
  });

  it('não afeta outro cliente que segue a mesma loja', async () => {
    const { lojaId, url } = await clienteSeguindoLoja();
    const outroCliente = await criarCliente();
    await seguir(outroCliente, lojaId);
    await post(`/lojas/${lojaId}/novidades`, { texto: 'Oferta' });

    await deixarDeSeguir(url);

    expect((await obterFeed(outroCliente)).json().novidades).toHaveLength(1);
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

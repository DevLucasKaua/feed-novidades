import { expect } from 'vitest';
import { criarApp } from '../src/app.js';

export const app = criarApp();

export const post = (url: string, payload?: object) => app.inject({ method: 'POST', url, payload });

export async function criarLoja(nome = 'Loja'): Promise<number> {
  return (await post('/lojas', { nome })).json().id;
}

let emailsCriados = 0;

export async function criarCliente(nome = 'Cliente'): Promise<number> {
  emailsCriados += 1;
  return (await post('/clientes', { nome, email: `cliente${emailsCriados}@exemplo.com` })).json()
    .id;
}

export const seguir = (clienteId: number, lojaId: number) =>
  post(`/clientes/${clienteId}/seguindo/${lojaId}`);

export const obterFeed = (clienteId: number | string, query = '') =>
  app.inject({ method: 'GET', url: `/clientes/${clienteId}/feed${query}` });

export async function clienteSeguindoLoja() {
  const [clienteId, lojaId] = [await criarCliente(), await criarLoja()];
  await seguir(clienteId, lojaId);
  return { clienteId, lojaId, url: `/clientes/${clienteId}/seguindo/${lojaId}` };
}

export function esperarErro(
  resposta: { statusCode: number; json: () => unknown },
  status: number,
  codigo: string,
) {
  expect(resposta.statusCode).toBe(status);
  expect(resposta.json()).toEqual({
    erro: { codigo, mensagem: expect.any(String), detalhes: expect.any(Array) },
  });
}

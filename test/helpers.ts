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

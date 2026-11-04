import { expect } from 'vitest';
import { criarApp } from '../src/app.js';

export const app = criarApp();

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

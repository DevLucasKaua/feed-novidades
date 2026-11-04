import { describe, expect, it } from 'vitest';
import { criarApp } from '../src/app.js';
import { app, esperarErro } from './helpers.js';

const postCru = (payload: string, contentType: string) =>
  app.inject({ method: 'POST', url: '/lojas', payload, headers: { 'content-type': contentType } });

describe('formato de erro', () => {
  it('rota inexistente', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/nao-existe' });
    esperarErro(resposta, 404, 'ROTA_NAO_ENCONTRADA');
  });

  it('JSON malformado', async () => {
    esperarErro(await postCru('{ nome', 'application/json'), 400, 'REQUISICAO_INVALIDA');
  });

  it('Content-Type não suportado', async () => {
    esperarErro(await postCru('nome=Loja', 'text/xml'), 415, 'TIPO_NAO_SUPORTADO');
  });

  it('corpo acima do limite', async () => {
    const corpo = JSON.stringify({ nome: 'a'.repeat(1024 * 1024 + 1) });
    esperarErro(await postCru(corpo, 'application/json'), 413, 'CORPO_MUITO_GRANDE');
  });

  it('falha inesperada não expõe detalhes internos', async () => {
    const appComFalha = criarApp();
    appComFalha.get('/falha', () => {
      throw new Error('segredo interno');
    });

    const resposta = await appComFalha.inject({ method: 'GET', url: '/falha' });

    esperarErro(resposta, 500, 'ERRO_INTERNO');
    expect(resposta.body).not.toContain('segredo');
    await appComFalha.close();
  });
});

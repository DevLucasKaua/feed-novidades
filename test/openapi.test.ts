import { describe, expect, it } from 'vitest';
import { app, post } from './helpers.js';

const obterEspecificacao = async () =>
  (await app.inject({ method: 'GET', url: '/documentation/json' })).json();

describe('documentação OpenAPI', () => {
  it('lista todas as rotas', async () => {
    const { openapi, paths } = await obterEspecificacao();

    expect(openapi).toMatch(/^3\./);
    expect(Object.keys(paths).sort()).toEqual([
      '/clientes',
      '/clientes/{id}/feed',
      '/clientes/{id}/seguindo/{lojaId}',
      '/lojas',
      '/lojas/{id}/novidades',
    ]);
    expect(Object.keys(paths['/clientes/{id}/seguindo/{lojaId}'])).toEqual(['post', 'delete']);
  });

  it('documenta datas como texto ISO na resposta', async () => {
    const { paths } = await obterEspecificacao();
    const resposta = paths['/lojas'].post.responses['201'].content['application/json'].schema;

    expect(resposta.properties.criadoEm).toMatchObject({ type: 'string', format: 'date-time' });
  });

  it('documenta os erros com o formato padrão', async () => {
    const { paths } = await obterEspecificacao();
    const erro = paths['/clientes'].post.responses['409'].content['application/json'].schema;

    expect(Object.keys(erro.properties)).toEqual(['erro']);
  });

  it('serve a interface', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/documentation/' });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.headers['content-type']).toContain('text/html');
  });

  it('a resposta real não traz campos fora do schema', async () => {
    const corpo = (await post('/lojas', { nome: 'Loja' })).json();

    expect(Object.keys(corpo).sort()).toEqual(['criadoEm', 'id', 'nome']);
  });
});

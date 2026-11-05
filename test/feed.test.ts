import { describe, expect, it } from 'vitest';
import { db } from '../src/db/client.js';
import { novidades } from '../src/db/schema.js';
import {
  clienteSeguindoLoja,
  criarCliente,
  criarLoja,
  esperarErro,
  obterFeed,
  post,
  seguir,
} from './helpers.js';

const textos = async (clienteId: number, query?: string) =>
  (await obterFeed(clienteId, query))
    .json()
    .novidades.map((novidade: { texto: string }) => novidade.texto);

const publicarEm = (lojaId: number, texto: string, criadoEm: string) =>
  db.insert(novidades).values({ lojaId, texto, criadoEm: new Date(criadoEm) });

async function publicarVarias(lojaId: number, quantidade: number) {
  await db
    .insert(novidades)
    .values(Array.from({ length: quantidade }, (_, i) => ({ lojaId, texto: `Novidade ${i}` })));
}

describe('GET /clientes/{id}/feed', () => {
  it('retorna os dados da novidade e da loja', async () => {
    const clienteId = await criarCliente();
    const lojaId = await criarLoja('Loja Azul');
    await seguir(clienteId, lojaId);
    await post(`/lojas/${lojaId}/novidades`, { texto: 'Promoção', preco: 19.9 });

    const resposta = await obterFeed(clienteId);

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({
      novidades: [
        {
          id: 1,
          loja: { id: lojaId, nome: 'Loja Azul' },
          texto: 'Promoção',
          preco: '19.90',
          criadoEm: expect.any(String),
        },
      ],
      proximoCursor: null,
    });
  });

  it('traz só novidades das lojas seguidas', async () => {
    const clienteId = await criarCliente();
    const [seguida, ignorada] = [await criarLoja(), await criarLoja()];
    await seguir(clienteId, seguida);
    await post(`/lojas/${seguida}/novidades`, { texto: 'Da seguida' });
    await post(`/lojas/${ignorada}/novidades`, { texto: 'Da ignorada' });

    expect(await textos(clienteId)).toEqual(['Da seguida']);
  });

  it('não mistura o feed de clientes diferentes', async () => {
    const a = await clienteSeguindoLoja();
    const b = await clienteSeguindoLoja();
    await post(`/lojas/${a.lojaId}/novidades`, { texto: 'De A' });
    await post(`/lojas/${b.lojaId}/novidades`, { texto: 'De B' });

    expect(await textos(a.clienteId)).toEqual(['De A']);
    expect(await textos(b.clienteId)).toEqual(['De B']);
  });

  it('intercala lojas da mais recente para a mais antiga', async () => {
    const clienteId = await criarCliente();
    const [loja1, loja2] = [await criarLoja(), await criarLoja()];
    await seguir(clienteId, loja1);
    await seguir(clienteId, loja2);
    await publicarEm(loja1, 'segunda', '2026-01-02T00:00:00Z');
    await publicarEm(loja2, 'primeira', '2026-01-01T00:00:00Z');
    await publicarEm(loja2, 'quarta', '2026-01-04T00:00:00Z');
    await publicarEm(loja1, 'terceira', '2026-01-03T00:00:00Z');

    expect(await textos(clienteId)).toEqual(['quarta', 'terceira', 'segunda', 'primeira']);
  });

  it('desempata pelo id quando o horário é igual', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    const horario = '2026-01-01T00:00:00Z';
    await publicarEm(lojaId, 'antes', horario);
    await publicarEm(lojaId, 'depois', horario);

    expect(await textos(clienteId)).toEqual(['depois', 'antes']);
  });

  it('o limite vale para o total, sem privilegiar uma loja', async () => {
    const clienteId = await criarCliente();
    const [movimentada, nova] = [await criarLoja(), await criarLoja()];
    await seguir(clienteId, movimentada);
    await seguir(clienteId, nova);
    await publicarEm(movimentada, 'antiga 1', '2026-01-01T00:00:00Z');
    await publicarEm(movimentada, 'antiga 2', '2026-01-02T00:00:00Z');
    await publicarEm(nova, 'recente', '2026-01-03T00:00:00Z');

    expect(await textos(clienteId, '?limite=2')).toEqual(['recente', 'antiga 2']);
  });

  it('inclui novidades publicadas antes de seguir', async () => {
    const [clienteId, lojaId] = [await criarCliente(), await criarLoja()];
    await post(`/lojas/${lojaId}/novidades`, { texto: 'Antiga' });
    await seguir(clienteId, lojaId);

    expect(await textos(clienteId)).toEqual(['Antiga']);
  });

  it.each([
    ['usa 20 por padrão', '', 20],
    ['respeita o limite informado', '?limite=5', 5],
    ['aceita o mínimo', '?limite=1', 1],
    ['aceita o máximo', '?limite=50', 50],
  ])('%s', async (_, query, esperado) => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    await publicarVarias(lojaId, 60);

    expect(await textos(clienteId, query)).toHaveLength(esperado);
  });

  it.each(['0', '-1', '51', '100', 'abc', '1.5', ''])('rejeita limite=%s', async (limite) => {
    const { clienteId } = await clienteSeguindoLoja();

    esperarErro(await obterFeed(clienteId, `?limite=${limite}`), 422, 'VALIDACAO');
  });

  it('retorna lista vazia para quem não segue nenhuma loja', async () => {
    const resposta = await obterFeed(await criarCliente());

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ novidades: [], proximoCursor: null });
  });

  it('retorna 404 para cliente inexistente', async () => {
    esperarErro(await obterFeed(999), 404, 'NAO_ENCONTRADO');
  });

  it('retorna 422 para id inválido', async () => {
    esperarErro(await obterFeed('abc'), 422, 'VALIDACAO');
  });
});

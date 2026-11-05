import { describe, expect, it } from 'vitest';
import { pool } from '../src/db/client.js';
import { clienteSeguindoLoja, criarLoja, esperarErro, obterFeed, post, seguir } from './helpers.js';

const publicarNoHorario = async (lojaId: number, texto: string, criadoEm: string) =>
  (
    await pool.query(
      'INSERT INTO novidades (loja_id, texto, criado_em) VALUES ($1, $2, $3) RETURNING id',
      [lojaId, texto, criadoEm],
    )
  ).rows[0].id;

async function percorrer(clienteId: number, limite: number) {
  const paginas: string[][] = [];
  let cursor: number | null = null;
  do {
    const query: string = `?limite=${limite}${cursor ? `&cursor=${cursor}` : ''}`;
    const corpo = (await obterFeed(clienteId, query)).json();
    paginas.push(corpo.novidades.map((n: { texto: string }) => n.texto));
    cursor = corpo.proximoCursor;
  } while (cursor);
  return paginas;
}

describe('paginação do feed', () => {
  it('percorre tudo sem repetir nem pular, intercalando lojas', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    const outraLoja = await criarLoja();
    await seguir(clienteId, outraLoja);
    for (let i = 1; i <= 7; i++) {
      const loja = i % 2 ? lojaId : outraLoja;
      await publicarNoHorario(loja, `n${i}`, `2026-01-0${i}T00:00:00Z`);
    }

    expect(await percorrer(clienteId, 3)).toEqual([['n7', 'n6', 'n5'], ['n4', 'n3', 'n2'], ['n1']]);
  });

  it('não aponta próxima página quando os itens cabem exatamente no limite', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    await publicarNoHorario(lojaId, 'a', '2026-01-01T00:00:00Z');
    await publicarNoHorario(lojaId, 'b', '2026-01-02T00:00:00Z');

    const corpo = (await obterFeed(clienteId, '?limite=2')).json();

    expect(corpo.novidades).toHaveLength(2);
    expect(corpo.proximoCursor).toBeNull();
  });

  it('atravessa novidades com horário idêntico', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    for (const texto of ['a', 'b', 'c', 'd']) {
      await publicarNoHorario(lojaId, texto, '2026-01-01T00:00:00Z');
    }

    expect(await percorrer(clienteId, 1)).toEqual([['d'], ['c'], ['b'], ['a']]);
  });

  it('distingue novidades no mesmo milissegundo', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    await publicarNoHorario(lojaId, 'c', '2026-01-01T00:00:00.123456Z');
    await publicarNoHorario(lojaId, 'a', '2026-01-01T00:00:00.123999Z');
    await publicarNoHorario(lojaId, 'b', '2026-01-01T00:00:00.123700Z');

    expect(await percorrer(clienteId, 1)).toEqual([['a'], ['b'], ['c']]);
  });

  it('novidade publicada durante a navegação não desloca as páginas', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    await publicarNoHorario(lojaId, 'antiga', '2026-01-01T00:00:00Z');
    await publicarNoHorario(lojaId, 'recente', '2026-01-02T00:00:00Z');

    const primeira = (await obterFeed(clienteId, '?limite=1')).json();
    await post(`/lojas/${lojaId}/novidades`, { texto: 'nova' });
    const segunda = (
      await obterFeed(clienteId, `?limite=1&cursor=${primeira.proximoCursor}`)
    ).json();

    expect(primeira.novidades[0].texto).toBe('recente');
    expect(segunda.novidades[0].texto).toBe('antiga');
    expect(segunda.proximoCursor).toBeNull();
  });

  it('continua filtrando pelas lojas seguidas', async () => {
    const { clienteId, lojaId } = await clienteSeguindoLoja();
    const ignorada = await criarLoja();
    await publicarNoHorario(lojaId, 'a', '2026-01-01T00:00:00Z');
    await publicarNoHorario(ignorada, 'fora', '2026-01-02T00:00:00Z');
    await publicarNoHorario(lojaId, 'b', '2026-01-03T00:00:00Z');

    expect(await percorrer(clienteId, 1)).toEqual([['b'], ['a']]);
  });

  it.each(['abc', '0', '-1', '1.5', ''])('rejeita cursor=%s', async (cursor) => {
    const { clienteId } = await clienteSeguindoLoja();

    esperarErro(await obterFeed(clienteId, `?cursor=${cursor}`), 422, 'VALIDACAO');
  });

  it('rejeita cursor de novidade inexistente, indicando o campo', async () => {
    const { clienteId } = await clienteSeguindoLoja();

    const resposta = await obterFeed(clienteId, '?cursor=999');

    esperarErro(resposta, 422, 'VALIDACAO');
    expect(resposta.json().erro.detalhes[0].campo).toBe('cursor');
  });
});

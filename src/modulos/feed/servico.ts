import { type AnyColumn, and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { clientes, lojas, novidades, seguindo } from '../../db/schema.js';
import { campoInvalido, naoEncontrado } from '../../http/errors.js';

const maisRecentesPrimeiro = (t: { criadoEm: AnyColumn; id: AnyColumn }) => [
  desc(t.criadoEm),
  desc(t.id),
];

async function anterioresAoCursor(cursor: number) {
  // Lido como texto porque o Postgres guarda microssegundos e um Date só guarda milissegundos:
  // com o valor truncado, novidades do mesmo milissegundo seriam repetidas ou puladas.
  const [referencia] = await db
    .select({ criadoEm: sql<string>`${novidades.criadoEm}::text` })
    .from(novidades)
    .where(eq(novidades.id, cursor));
  if (!referencia) throw campoInvalido('cursor', 'Cursor não corresponde a uma novidade');

  return sql`(${novidades.criadoEm}, ${novidades.id}) < (${referencia.criadoEm}::timestamptz, ${cursor}::bigint)`;
}

export async function obterFeed(
  clienteId: number,
  { limite, cursor }: { limite: number; cursor?: number },
) {
  const [cliente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.id, clienteId));
  if (!cliente) throw naoEncontrado('Cliente não encontrado');

  const filtroCursor = cursor ? await anterioresAoCursor(cursor) : undefined;
  // Um item além do limite indica se existe próxima página, sem uma consulta de contagem.
  const quantidade = limite + 1;

  // O LATERAL lê só as mais recentes de cada loja pelo índice composto, então o custo depende
  // de quantas lojas o cliente segue, não do histórico nem dos seguidores da loja. A loja entra
  // depois do corte para não ser buscada para novidades que o limite vai descartar.
  const recentes = db
    .select()
    .from(novidades)
    .where(and(eq(novidades.lojaId, seguindo.lojaId), filtroCursor))
    .orderBy(...maisRecentesPrimeiro(novidades))
    .limit(quantidade)
    .as('recentes');

  const feed = db.$with('feed').as(
    db
      .select({
        id: recentes.id,
        lojaId: recentes.lojaId,
        texto: recentes.texto,
        preco: recentes.preco,
        criadoEm: recentes.criadoEm,
      })
      .from(seguindo)
      .crossJoinLateral(recentes)
      .where(eq(seguindo.clienteId, clienteId))
      .orderBy(...maisRecentesPrimeiro(recentes))
      .limit(quantidade),
  );

  const linhas = await db
    .with(feed)
    .select({
      id: feed.id,
      loja: { id: lojas.id, nome: lojas.nome },
      texto: feed.texto,
      preco: feed.preco,
      criadoEm: feed.criadoEm,
    })
    .from(feed)
    .innerJoin(lojas, eq(lojas.id, feed.lojaId))
    .orderBy(...maisRecentesPrimeiro(feed));

  const pagina = linhas.slice(0, limite);
  return {
    novidades: pagina,
    proximoCursor: linhas.length > limite ? (pagina.at(-1)?.id ?? null) : null,
  };
}

import { type AnyColumn, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { clientes, lojas, novidades, seguindo } from '../../db/schema.js';
import { naoEncontrado } from '../../http/errors.js';

const maisRecentesPrimeiro = (t: { criadoEm: AnyColumn; id: AnyColumn }) => [
  desc(t.criadoEm),
  desc(t.id),
];

export async function obterFeed(clienteId: number, limite: number) {
  const [cliente] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.id, clienteId));
  if (!cliente) throw naoEncontrado('Cliente não encontrado');

  // O LATERAL lê só as mais recentes de cada loja pelo índice composto, então o custo depende
  // de quantas lojas o cliente segue, não do histórico nem dos seguidores da loja. A loja entra
  // depois do corte para não ser buscada para novidades que o limite vai descartar.
  const recentes = db
    .select()
    .from(novidades)
    .where(eq(novidades.lojaId, seguindo.lojaId))
    .orderBy(...maisRecentesPrimeiro(novidades))
    .limit(limite)
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
      .limit(limite),
  );

  return db
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
}

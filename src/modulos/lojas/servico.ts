import { db } from '../../db/client.js';
import { comRestricoes } from '../../db/restricoes.js';
import { lojas, novidades } from '../../db/schema.js';
import { naoEncontrado } from '../../http/errors.js';

export async function criarLoja(nome: string) {
  const [loja] = await db.insert(lojas).values({ nome }).returning();
  return loja;
}

export async function publicarNovidade(
  lojaId: number,
  { texto, preco }: { texto: string; preco?: number | null },
) {
  const [novidade] = await comRestricoes(
    db
      .insert(novidades)
      .values({ lojaId, texto, preco: preco?.toFixed(2) })
      .returning(),
    { novidades_loja_id_lojas_id_fk: naoEncontrado('Loja não encontrada') },
  );
  return novidade;
}

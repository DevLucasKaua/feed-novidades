import { db } from '../../db/client.js';
import { lojas } from '../../db/schema.js';

export async function criarLoja(nome: string) {
  const [loja] = await db.insert(lojas).values({ nome }).returning();
  return loja;
}

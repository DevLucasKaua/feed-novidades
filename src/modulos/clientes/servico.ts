import { and, eq } from 'drizzle-orm';
import { db, linhaInserida } from '../../db/client.js';
import { comRestricoes } from '../../db/restricoes.js';
import { clientes, seguindo } from '../../db/schema.js';
import { conflito, naoEncontrado } from '../../http/errors.js';

export async function criarCliente(dados: { nome: string; email: string }) {
  const linhas = await comRestricoes(db.insert(clientes).values(dados).returning(), {
    clientes_email_unico: conflito('E-mail já cadastrado'),
  });
  return linhaInserida(linhas);
}

export async function seguirLoja(clienteId: number, lojaId: number) {
  const linhas = await comRestricoes(
    db.insert(seguindo).values({ clienteId, lojaId }).returning(),
    {
      seguindo_pk: conflito('Cliente já segue esta loja'),
      seguindo_cliente_id_clientes_id_fk: naoEncontrado('Cliente não encontrado'),
      seguindo_loja_id_lojas_id_fk: naoEncontrado('Loja não encontrada'),
    },
  );
  return linhaInserida(linhas);
}

export async function deixarDeSeguirLoja(clienteId: number, lojaId: number) {
  const removidos = await db
    .delete(seguindo)
    .where(and(eq(seguindo.clienteId, clienteId), eq(seguindo.lojaId, lojaId)))
    .returning();
  if (!removidos.length) throw naoEncontrado('Cliente não segue esta loja');
}

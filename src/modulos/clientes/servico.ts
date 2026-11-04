import { db } from '../../db/client.js';
import { comRestricoes } from '../../db/restricoes.js';
import { clientes } from '../../db/schema.js';
import { conflito } from '../../http/errors.js';

export async function criarCliente(dados: { nome: string; email: string }) {
  const [cliente] = await comRestricoes(db.insert(clientes).values(dados).returning(), {
    clientes_email_unico: conflito('E-mail já cadastrado'),
  });
  return cliente;
}

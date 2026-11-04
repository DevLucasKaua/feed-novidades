import { db } from '../../db/client.js';
import { comRestricoes } from '../../db/restricoes.js';
import { clientes, seguindo } from '../../db/schema.js';
import { conflito, naoEncontrado } from '../../http/errors.js';

export async function criarCliente(dados: { nome: string; email: string }) {
  const [cliente] = await comRestricoes(db.insert(clientes).values(dados).returning(), {
    clientes_email_unico: conflito('E-mail já cadastrado'),
  });
  return cliente;
}

export async function seguirLoja(clienteId: number, lojaId: number) {
  const [seguimento] = await comRestricoes(
    db.insert(seguindo).values({ clienteId, lojaId }).returning(),
    {
      seguindo_pk: conflito('Cliente já segue esta loja'),
      seguindo_cliente_id_clientes_id_fk: naoEncontrado('Cliente não encontrado'),
      seguindo_loja_id_lojas_id_fk: naoEncontrado('Loja não encontrada'),
    },
  );
  return seguimento;
}

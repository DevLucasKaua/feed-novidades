import { db, pool } from './client.js';
import { aplicarMigrations } from './migrate.js';
import { clientes, lojas, novidades, seguindo } from './schema.js';

const NOMES_LOJAS = ['Moda Aurora', 'Tech Prime', 'Casa Viva', 'Sabor da Terra', 'Pet Feliz'];

const TEXTOS: [texto: string, preco?: string][] = [
  ['Coleção nova chegando hoje', '129.90'],
  ['Live às 20h com descontos exclusivos'],
  ['Promoção relâmpago até meia-noite', '49.90'],
  ['Produto de volta ao estoque', '89.00'],
  ['Frete grátis neste fim de semana'],
];

const CLIENTES = [
  { nome: 'Ana Souza', email: 'ana@exemplo.com', segue: [1, 2, 3] },
  { nome: 'Bruno Lima', email: 'bruno@exemplo.com', segue: [2, 4] },
  { nome: 'Carla Dias', email: 'carla@exemplo.com', segue: [] },
];

const HORA = 60 * 60 * 1000;

await aplicarMigrations();
await pool.query('TRUNCATE lojas, clientes RESTART IDENTITY CASCADE');

await db.insert(lojas).values(NOMES_LOJAS.map((nome) => ({ nome })));
await db.insert(clientes).values(CLIENTES.map(({ nome, email }) => ({ nome, email })));
await db
  .insert(seguindo)
  .values(
    CLIENTES.flatMap(({ segue }, i) => segue.map((lojaId) => ({ clienteId: i + 1, lojaId }))),
  );
await db.insert(novidades).values(
  NOMES_LOJAS.flatMap((_, indiceLoja) =>
    TEXTOS.map(([texto, preco], indiceTexto) => ({
      lojaId: indiceLoja + 1,
      texto,
      preco,
      criadoEm: new Date(Date.now() - (indiceLoja + indiceTexto * NOMES_LOJAS.length) * HORA),
    })),
  ),
);

await pool.end();

console.log(
  `Seed concluído: ${NOMES_LOJAS.length} lojas, ${CLIENTES.length} clientes, ` +
    `${NOMES_LOJAS.length * TEXTOS.length} novidades.`,
);

import { desc, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const id = () => bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity();
const criadoEm = () => timestamp('criado_em', { withTimezone: true }).notNull().defaultNow();

export const lojas = pgTable('lojas', {
  id: id(),
  nome: text('nome').notNull(),
  criadoEm: criadoEm(),
});

export const clientes = pgTable('clientes', {
  id: id(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique('clientes_email_unico'),
  criadoEm: criadoEm(),
});

export const seguindo = pgTable(
  'seguindo',
  {
    clienteId: bigint('cliente_id', { mode: 'number' })
      .notNull()
      .references(() => clientes.id, { onDelete: 'cascade' }),
    lojaId: bigint('loja_id', { mode: 'number' })
      .notNull()
      .references(() => lojas.id, { onDelete: 'cascade' }),
    criadoEm: criadoEm(),
  },
  (t) => [primaryKey({ name: 'seguindo_pk', columns: [t.clienteId, t.lojaId] })],
);

export const novidades = pgTable(
  'novidades',
  {
    id: id(),
    lojaId: bigint('loja_id', { mode: 'number' })
      .notNull()
      .references(() => lojas.id, { onDelete: 'cascade' }),
    texto: text('texto').notNull(),
    preco: numeric('preco', { precision: 12, scale: 2 }),
    criadoEm: criadoEm(),
  },
  (t) => [
    index('novidades_loja_recentes_idx').on(t.lojaId, desc(t.criadoEm), desc(t.id)),
    check('novidades_texto_tamanho', sql`char_length(${t.texto}) between 1 and 500`),
    check('novidades_preco_positivo', sql`${t.preco} > 0`),
  ],
);

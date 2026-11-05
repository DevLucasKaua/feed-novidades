import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  dataHora,
  errosPossiveis,
  idParams,
  novidadeBase,
  textoObrigatorio,
} from '../../http/schemas.js';
import { criarLoja, publicarNovidade } from './servico.js';

const TEXTO_MAXIMO = 500;
const PRECO_MAXIMO = 9_999_999_999.99;

const novaNovidade = z.object({
  // String.length conta unidades UTF-16 e um emoji valeria 2. O spread conta caracteres
  // reais, igual ao char_length do CHECK no banco.
  texto: textoObrigatorio('texto').refine(
    (texto) => [...texto].length <= TEXTO_MAXIMO,
    `texto deve ter no máximo ${TEXTO_MAXIMO} caracteres`,
  ),
  preco: z
    .number('preco deve ser um número')
    .positive('preco deve ser maior que zero')
    .max(PRECO_MAXIMO, 'preco acima do permitido')
    .refine(
      (preco) => Number(preco.toFixed(2)) === preco,
      'preco aceita no máximo 2 casas decimais',
    )
    .nullish(),
});

const loja = z.object({ id: z.number(), nome: z.string(), criadoEm: dataHora });
const novidadePublicada = novidadeBase.extend({ lojaId: z.number() });

export const rotasLojas: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/lojas',
    {
      schema: {
        tags: ['Lojas'],
        summary: 'Cria uma loja',
        body: z.object({ nome: textoObrigatorio('nome') }),
        response: { 201: loja, ...errosPossiveis(400, 422) },
      },
    },
    async (request, reply) => reply.status(201).send(await criarLoja(request.body.nome)),
  );

  app.post(
    '/lojas/:id/novidades',
    {
      schema: {
        tags: ['Lojas'],
        summary: 'Publica uma novidade',
        params: idParams,
        body: novaNovidade,
        response: { 201: novidadePublicada, ...errosPossiveis(400, 404, 422) },
      },
    },
    async (request, reply) =>
      reply.status(201).send(await publicarNovidade(request.params.id, request.body)),
  );
};

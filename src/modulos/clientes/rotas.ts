import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { dataHora, errosPossiveis, seguirParams, textoObrigatorio } from '../../http/schemas.js';
import { criarCliente, deixarDeSeguirLoja, seguirLoja } from './servico.js';

const novoCliente = z.object({
  nome: textoObrigatorio('nome'),
  email: z.string('email é obrigatório').trim().toLowerCase().pipe(z.email('email inválido')),
});

const cliente = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  criadoEm: dataHora,
});

const seguimento = z.object({ clienteId: z.number(), lojaId: z.number(), criadoEm: dataHora });

export const rotasClientes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/clientes',
    {
      schema: {
        tags: ['Clientes'],
        summary: 'Cria um cliente',
        body: novoCliente,
        response: { 201: cliente, ...errosPossiveis(400, 409, 422) },
      },
    },
    async (request, reply) => reply.status(201).send(await criarCliente(request.body)),
  );

  app.post(
    '/clientes/:id/seguindo/:lojaId',
    {
      schema: {
        tags: ['Clientes'],
        summary: 'Faz o cliente seguir uma loja',
        params: seguirParams,
        response: { 201: seguimento, ...errosPossiveis(404, 409, 422) },
      },
    },
    async (request, reply) =>
      reply.status(201).send(await seguirLoja(request.params.id, request.params.lojaId)),
  );

  app.delete(
    '/clientes/:id/seguindo/:lojaId',
    {
      schema: {
        tags: ['Clientes'],
        summary: 'Faz o cliente deixar de seguir uma loja',
        params: seguirParams,
        response: { 204: z.null().describe('Sem corpo'), ...errosPossiveis(404, 422) },
      },
    },
    async (request, reply) => {
      await deixarDeSeguirLoja(request.params.id, request.params.lojaId);
      return reply.status(204).send(null);
    },
  );
};

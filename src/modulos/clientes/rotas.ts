import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { seguirParams, textoObrigatorio } from '../../http/schemas.js';
import { criarCliente, seguirLoja } from './servico.js';

const novoCliente = z.object({
  nome: textoObrigatorio('nome'),
  email: z.string('email é obrigatório').trim().toLowerCase().pipe(z.email('email inválido')),
});

export const rotasClientes: FastifyPluginAsyncZod = async (app) => {
  app.post('/clientes', { schema: { body: novoCliente } }, async (request, reply) =>
    reply.status(201).send(await criarCliente(request.body)),
  );

  app.post(
    '/clientes/:id/seguindo/:lojaId',
    { schema: { params: seguirParams } },
    async (request, reply) =>
      reply.status(201).send(await seguirLoja(request.params.id, request.params.lojaId)),
  );
};

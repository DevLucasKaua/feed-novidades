import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { textoObrigatorio } from '../../http/schemas.js';
import { criarLoja } from './servico.js';

export const rotasLojas: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/lojas',
    { schema: { body: z.object({ nome: textoObrigatorio('nome') }) } },
    async (request, reply) => reply.status(201).send(await criarLoja(request.body.nome)),
  );
};

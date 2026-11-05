import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { errosPossiveis, feedQuery, idParams, novidadeBase } from '../../http/schemas.js';
import { obterFeed } from './servico.js';

const feed = z.object({
  novidades: z.array(novidadeBase.extend({ loja: z.object({ id: z.number(), nome: z.string() }) })),
  proximoCursor: z.number().nullable(),
});

export const rotasFeed: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/clientes/:id/feed',
    {
      schema: {
        tags: ['Feed'],
        summary: 'Lista as novidades das lojas seguidas, da mais recente para a mais antiga',
        params: idParams,
        querystring: feedQuery,
        response: { 200: feed, ...errosPossiveis(404, 422) },
      },
    },
    async (request) => obterFeed(request.params.id, request.query),
  );
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { feedQuery, idParams } from '../../http/schemas.js';
import { obterFeed } from './servico.js';

export const rotasFeed: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/clientes/:id/feed',
    { schema: { params: idParams, querystring: feedQuery } },
    async (request) => obterFeed(request.params.id, request.query),
  );
};

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { registrarTratamentoDeErros } from './http/errors.js';
import { rotasClientes } from './modulos/clientes/rotas.js';
import { rotasFeed } from './modulos/feed/rotas.js';
import { rotasLojas } from './modulos/lojas/rotas.js';

export function criarApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  // O Fastify aceita text/plain por padrão, e o corpo chegaria à validação como texto.
  app.removeContentTypeParser('text/plain');
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registrarTratamentoDeErros(app);

  app.register(fastifySwagger, {
    openapi: { info: { title: 'Feed de Novidades', version: '1.0.0' } },
    transform: jsonSchemaTransform,
  });
  app.register(fastifySwaggerUi, { routePrefix: '/documentation' });

  app.register(rotasLojas);
  app.register(rotasClientes);
  app.register(rotasFeed);

  return app;
}

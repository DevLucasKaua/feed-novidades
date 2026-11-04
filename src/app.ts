import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { registrarTratamentoDeErros } from './http/errors.js';

export function criarApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registrarTratamentoDeErros(app);

  return app;
}

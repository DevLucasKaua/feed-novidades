import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { registrarTratamentoDeErros } from './http/errors.js';
import { rotasClientes } from './modulos/clientes/rotas.js';
import { rotasLojas } from './modulos/lojas/rotas.js';

export function criarApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registrarTratamentoDeErros(app);

  app.register(rotasLojas);
  app.register(rotasClientes);

  return app;
}

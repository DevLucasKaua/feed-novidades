import Fastify from 'fastify';

export function criarApp() {
  return Fastify({ logger: process.env.NODE_ENV !== 'test' });
}

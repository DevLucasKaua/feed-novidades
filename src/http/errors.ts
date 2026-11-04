import type { FastifyError, FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

interface Detalhe {
  campo: string;
  mensagem: string;
}

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export const naoEncontrado = (recurso: string) =>
  new ErroApi(404, 'NAO_ENCONTRADO', `${recurso} não encontrado(a)`);

export const conflito = (mensagem: string) => new ErroApi(409, 'CONFLITO', mensagem);

const corpoDeErro = (codigo: string, mensagem: string, detalhes: Detalhe[] = []) => ({
  erro: { codigo, mensagem, detalhes },
});

const ERROS_DO_FRAMEWORK: Record<number, [codigo: string, mensagem: string]> = {
  400: ['REQUISICAO_INVALIDA', 'Corpo da requisição malformado'],
  413: ['CORPO_MUITO_GRANDE', 'Corpo da requisição acima do tamanho permitido'],
  415: ['TIPO_NAO_SUPORTADO', 'Content-Type não suportado, use application/json'],
};

export function registrarTratamentoDeErros(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) =>
    reply
      .status(404)
      .send(corpoDeErro('ROTA_NAO_ENCONTRADA', `Rota ${request.method} ${request.url} não existe`)),
  );

  app.setErrorHandler((erro: FastifyError, request, reply) => {
    if (erro instanceof ErroApi) {
      return reply.status(erro.status).send(corpoDeErro(erro.codigo, erro.message));
    }

    if (hasZodFastifySchemaValidationErrors(erro)) {
      const detalhes = erro.validation.map((falha) => ({
        campo: falha.instancePath.slice(1).replaceAll('/', '.') || String(erro.validationContext),
        mensagem: falha.message ?? 'Valor inválido',
      }));
      return reply.status(422).send(corpoDeErro('VALIDACAO', 'Dados inválidos', detalhes));
    }

    const conhecido = erro.statusCode ? ERROS_DO_FRAMEWORK[erro.statusCode] : undefined;
    if (conhecido) {
      return reply.status(erro.statusCode as number).send(corpoDeErro(...conhecido));
    }

    request.log.error(erro);
    return reply.status(500).send(corpoDeErro('ERRO_INTERNO', 'Erro interno do servidor'));
  });
}

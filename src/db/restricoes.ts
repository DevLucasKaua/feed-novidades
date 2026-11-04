import type { ErroApi } from '../http/errors.js';

// As regras de unicidade e existência ficam no banco: um SELECT antes do INSERT
// deixaria passar duas requisições simultâneas.
export async function comRestricoes<T>(
  operacao: PromiseLike<T>,
  errosPorRestricao: Record<string, ErroApi>,
): Promise<T> {
  try {
    return await operacao;
  } catch (erro) {
    const restricao = (erro as { cause?: { constraint?: string } }).cause?.constraint;
    throw (restricao && errosPorRestricao[restricao]) || erro;
  }
}

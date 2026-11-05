import { z } from 'zod';

z.config(z.locales.pt());

// z.coerce aceitaria "", "1e3" e "0x10" como números válidos.
const inteiroPositivoDaUrl = z
  .string()
  .regex(/^[1-9]\d*$/, 'Deve ser um número inteiro positivo')
  .transform(Number)
  .refine(Number.isSafeInteger, 'Número acima do permitido');

export const idParams = z.object({ id: inteiroPositivoDaUrl });
export const seguirParams = idParams.extend({ lojaId: inteiroPositivoDaUrl });

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;

export const feedQuery = z.object({
  limite: inteiroPositivoDaUrl
    .refine((n) => n <= LIMITE_MAXIMO, `Deve ser no máximo ${LIMITE_MAXIMO}`)
    .default(LIMITE_PADRAO),
  cursor: inteiroPositivoDaUrl.optional(),
});

export const textoObrigatorio = (campo: string) =>
  z.string(`${campo} é obrigatório`).trim().min(1, `${campo} é obrigatório`);

export const dataHora = z.codec(z.iso.datetime(), z.date(), {
  decode: (texto) => new Date(texto),
  encode: (data) => data.toISOString(),
});

export const novidadeBase = z.object({
  id: z.number(),
  texto: z.string(),
  preco: z.string().nullable().meta({ example: '19.90' }),
  criadoEm: dataHora,
});

const erroResposta = z.object({
  erro: z.object({
    codigo: z.string(),
    mensagem: z.string(),
    detalhes: z.array(z.object({ campo: z.string(), mensagem: z.string() })),
  }),
});

export const errosPossiveis = <S extends number>(...status: S[]) =>
  Object.fromEntries(status.map((s) => [s, erroResposta])) as Record<S, typeof erroResposta>;

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

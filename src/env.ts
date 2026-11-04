import { z } from 'zod';

const esquema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3000),
});

export const env = esquema.parse(process.env);

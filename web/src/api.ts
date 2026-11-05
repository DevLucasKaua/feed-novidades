export interface Loja {
  id: number;
  nome: string;
}

export interface Cliente {
  id: number;
  nome: string;
  email: string;
}

export interface Novidade {
  id: number;
  loja: Loja;
  texto: string;
  preco: string | null;
  criadoEm: string;
}

export interface PaginaFeed {
  novidades: Novidade[];
  proximoCursor: number | null;
}

export interface ErroApi {
  codigo: string;
  mensagem: string;
  detalhes: { campo: string; mensagem: string }[];
}

export interface Chamada {
  id: number;
  metodo: string;
  caminho: string;
  enviado?: unknown;
  status: number;
  ms: number;
  resposta: unknown;
}

export type Resultado<T> =
  | { ok: true; status: number; corpo: T }
  | { ok: false; status: number; erro: ErroApi };

const API_FORA_DO_AR: ErroApi = {
  codigo: 'API_FORA_DO_AR',
  mensagem: 'A API não respondeu. Confira se ela está rodando com npm run dev.',
  detalhes: [],
};

let aoChamar: (chamada: Chamada) => void = () => {};
let proximoId = 1;

export const registrarOuvinte = (ouvinte: (chamada: Chamada) => void) => {
  aoChamar = ouvinte;
};

const lerJson = (texto: string) => {
  try {
    return { valido: true, valor: texto ? JSON.parse(texto) : null };
  } catch {
    return { valido: false, valor: texto };
  }
};

async function chamar<T>(metodo: string, caminho: string, enviado?: unknown, cru?: string) {
  const inicio = performance.now();
  const temCorpo = enviado !== undefined || cru !== undefined;
  let status = 0;
  let resposta: unknown = null;

  try {
    const r = await fetch(caminho, {
      method: metodo,
      headers: temCorpo ? { 'Content-Type': 'application/json' } : undefined,
      body: temCorpo ? (cru ?? JSON.stringify(enviado)) : undefined,
    });
    const json = lerJson(await r.text());
    // O proxy do Vite responde 5xx sem JSON quando a API está desligada.
    const semApi = r.status >= 500 && (!json.valido || json.valor === null);
    status = semApi ? 0 : r.status;
    resposta = semApi ? null : json.valor;
  } catch {
    status = 0;
  }

  aoChamar({
    id: proximoId++,
    metodo,
    caminho,
    enviado: cru ?? enviado,
    status,
    ms: Math.round(performance.now() - inicio),
    resposta,
  });

  if (status === 0) return { ok: false, status, erro: API_FORA_DO_AR } as Resultado<T>;
  if (status >= 400) {
    return { ok: false, status, erro: (resposta as { erro: ErroApi }).erro } as Resultado<T>;
  }
  return { ok: true, status, corpo: resposta as T } as Resultado<T>;
}

export const api = {
  criarLoja: (nome: string) => chamar<Loja>('POST', '/lojas', { nome }),
  criarCliente: (nome: string, email: string) =>
    chamar<Cliente>('POST', '/clientes', { nome, email }),
  seguir: (clienteId: number, lojaId: number) =>
    chamar('POST', `/clientes/${clienteId}/seguindo/${lojaId}`),
  deixarDeSeguir: (clienteId: number, lojaId: number) =>
    chamar('DELETE', `/clientes/${clienteId}/seguindo/${lojaId}`),
  publicar: (lojaId: number, corpo: { texto: unknown; preco?: unknown }) =>
    chamar('POST', `/lojas/${lojaId}/novidades`, corpo),
  feed: (clienteId: number | string, consulta: { limite: number; cursor?: number | null }) => {
    const parametros = new URLSearchParams({ limite: String(consulta.limite) });
    if (consulta.cursor) parametros.set('cursor', String(consulta.cursor));
    return chamar<PaginaFeed>('GET', `/clientes/${clienteId}/feed?${parametros}`);
  },
  jsonMalformado: () => chamar('POST', '/lojas', undefined, '{ "nome": '),
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Chamada, type Cliente, type Loja, type Novidade, registrarOuvinte } from './api';

const CHAVE = 'feed-novidades-demo';
const MAXIMO_DE_CHAMADAS = 200;
const espera = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

interface Dados {
  lojas: Loja[];
  clientes: Cliente[];
  seguindo: Record<number, number[]>;
  clienteAtivoId: number | null;
}

const VAZIO: Dados = { lojas: [], clientes: [], seguindo: {}, clienteAtivoId: null };

const lerDados = (): Dados => {
  try {
    return { ...VAZIO, ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') };
  } catch {
    return VAZIO;
  }
};

const LOJAS_DO_CENARIO = ['Moda Aurora', 'Tech Prime', 'Casa Viva', 'Pet Feliz'];
const CLIENTES_DO_CENARIO = ['Ana Souza', 'Bruno Lima'];
const SEGUIDAS_POR_ANA = [0, 1, 2];
const NOVIDADES_DO_CENARIO: [loja: number, texto: string, preco?: number][] = [
  [2, 'Jogo de panelas com frete grátis até domingo', 349.9],
  [0, 'Coleção de inverno chegando hoje', 129.9],
  [3, 'Ração premium com desconto para assinantes', 79.9],
  [1, 'Live às 20h: testamos os fones mais vendidos do mês'],
  [0, 'Promoção relâmpago em jaquetas até meia-noite', 199],
  [1, 'Notebook de volta ao estoque', 3499],
  [2, 'Oficina gratuita de decoração no sábado'],
];

export function useDemo() {
  const [dados, setDados] = useState<Dados>(lerDados);
  const [novidades, setNovidades] = useState<Novidade[]>([]);
  const [proximoCursor, setProximoCursor] = useState<number | null>(null);
  const [limite, setLimite] = useState(20);
  const [carregandoFeed, setCarregandoFeed] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroFeed, setErroFeed] = useState<string | null>(null);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [preparando, setPreparando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const ultimaLeitura = useRef(0);

  const { clienteAtivoId } = dados;
  const clienteAtivo = dados.clientes.find((c) => c.id === clienteAtivoId) ?? null;
  const seguidas = clienteAtivoId ? (dados.seguindo[clienteAtivoId] ?? []) : [];
  const apiForaDoAr = chamadas[0]?.status === 0;

  useEffect(() => {
    registrarOuvinte((chamada) =>
      setChamadas((atuais) => [chamada, ...atuais].slice(0, MAXIMO_DE_CHAMADAS)),
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  }, [dados]);

  const recarregarFeed = useCallback(async (clienteId: number, quantidade: number) => {
    const leitura = ++ultimaLeitura.current;
    setCarregandoFeed(true);
    const resultado = await api.feed(clienteId, { limite: quantidade });
    if (leitura !== ultimaLeitura.current) return;
    setCarregandoFeed(false);

    if (resultado.ok) {
      setNovidades(resultado.corpo.novidades);
      setProximoCursor(resultado.corpo.proximoCursor);
      setErroFeed(null);
    } else if (resultado.status === 404) {
      setDados(VAZIO);
      setAviso('O banco foi reiniciado e estes dados não existem mais. Prepare um novo cenário.');
    } else {
      setErroFeed(resultado.erro.mensagem);
    }
  }, []);

  useEffect(() => {
    if (clienteAtivoId) {
      recarregarFeed(clienteAtivoId, limite);
    } else {
      ultimaLeitura.current++;
      setCarregandoFeed(false);
      setNovidades([]);
      setProximoCursor(null);
      setErroFeed(null);
    }
  }, [clienteAtivoId, limite, recarregarFeed]);

  const carregarMais = async () => {
    if (!clienteAtivoId || !proximoCursor) return;
    const leitura = ultimaLeitura.current;
    setCarregandoMais(true);
    const resultado = await api.feed(clienteAtivoId, { limite, cursor: proximoCursor });
    setCarregandoMais(false);
    if (leitura !== ultimaLeitura.current) return;
    if (resultado.ok) {
      setNovidades((atuais) => [...atuais, ...resultado.corpo.novidades]);
      setProximoCursor(resultado.corpo.proximoCursor);
    } else {
      setErroFeed(resultado.erro.mensagem);
    }
  };

  const criarLoja = async (nome: string) => {
    const resultado = await api.criarLoja(nome);
    if (resultado.ok) {
      setDados((d) => ({ ...d, lojas: [...d.lojas, resultado.corpo] }));
    }
    return resultado;
  };

  const criarCliente = async (nome: string, email: string) => {
    const resultado = await api.criarCliente(nome, email);
    if (resultado.ok) {
      setDados((d) => ({
        ...d,
        clientes: [...d.clientes, resultado.corpo],
        clienteAtivoId: resultado.corpo.id,
      }));
    }
    return resultado;
  };

  const selecionarCliente = (id: number) => setDados((d) => ({ ...d, clienteAtivoId: id }));

  const marcarSeguindo = (clienteId: number, lojaId: number, seguir: boolean) =>
    setDados((d) => {
      const atuais = (d.seguindo[clienteId] ?? []).filter((id) => id !== lojaId);
      return {
        ...d,
        seguindo: { ...d.seguindo, [clienteId]: seguir ? [...atuais, lojaId] : atuais },
      };
    });

  const alternarSeguir = async (lojaId: number) => {
    if (!clienteAtivoId) return;
    const seguir = !seguidas.includes(lojaId);
    const resultado = seguir
      ? await api.seguir(clienteAtivoId, lojaId)
      : await api.deixarDeSeguir(clienteAtivoId, lojaId);

    if (resultado.ok) {
      marcarSeguindo(clienteAtivoId, lojaId, seguir);
      await recarregarFeed(clienteAtivoId, limite);
    } else if (resultado.status === 409 || resultado.status === 404) {
      marcarSeguindo(clienteAtivoId, lojaId, resultado.status === 409);
    }
  };

  const publicar = async (lojaId: number, corpo: { texto: unknown; preco?: unknown }) => {
    const resultado = await api.publicar(lojaId, corpo);
    if (resultado.ok && clienteAtivoId && seguidas.includes(lojaId)) {
      await recarregarFeed(clienteAtivoId, limite);
    }
    return resultado;
  };

  const recomecar = () => {
    setDados(VAZIO);
    setChamadas([]);
    setAviso(null);
  };

  const prepararCenario = async () => {
    setPreparando(true);
    setAviso(null);
    setDados(VAZIO);
    const marca = Date.now().toString(36);

    const lojas: Loja[] = [];
    for (const nome of LOJAS_DO_CENARIO) {
      const resultado = await api.criarLoja(nome);
      if (!resultado.ok) return setPreparando(false);
      lojas.push(resultado.corpo);
      await espera(60);
    }

    const clientes: Cliente[] = [];
    for (const nome of CLIENTES_DO_CENARIO) {
      const usuario = nome.split(' ')[0]?.toLowerCase();
      const resultado = await api.criarCliente(nome, `${usuario}.${marca}@exemplo.com`);
      if (!resultado.ok) return setPreparando(false);
      clientes.push(resultado.corpo);
      await espera(60);
    }

    const ana = clientes[0] as Cliente;
    const seguidasPorAna = SEGUIDAS_POR_ANA.map((i) => (lojas[i] as Loja).id);
    for (const lojaId of seguidasPorAna) {
      await api.seguir(ana.id, lojaId);
      await espera(60);
    }

    for (const [indice, texto, preco] of NOVIDADES_DO_CENARIO) {
      await api.publicar((lojas[indice] as Loja).id, { texto, preco });
      await espera(60);
    }

    setDados({ lojas, clientes, seguindo: { [ana.id]: seguidasPorAna }, clienteAtivoId: ana.id });
    setPreparando(false);
  };

  return {
    ...dados,
    clienteAtivo,
    seguidas,
    novidades,
    proximoCursor,
    limite,
    carregandoFeed,
    carregandoMais,
    erroFeed,
    chamadas,
    preparando,
    aviso,
    apiForaDoAr,
    setLimite,
    carregarMais,
    criarLoja,
    criarCliente,
    selecionarCliente,
    alternarSeguir,
    publicar,
    recomecar,
    prepararCenario,
    limparChamadas: () => setChamadas([]),
  };
}

export type Demo = ReturnType<typeof useDemo>;

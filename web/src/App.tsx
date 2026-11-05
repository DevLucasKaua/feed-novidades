import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  type LucideIcon,
  Newspaper,
  Pencil,
  RotateCcw,
  Rss,
  ScrollText,
  Store,
  Users,
} from 'lucide-react';
import {
  type ComponentType,
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Avatar } from './componentes/comum';
import {
  BotaoCenario,
  type NomePagina,
  PaginaChamadas,
  PaginaClientes,
  PaginaErros,
  PaginaFeed,
  PaginaLojas,
  PaginaPainel,
} from './paginas';
import { type Demo, useDemo } from './useDemo';

interface ItemMenu {
  id: NomePagina;
  nome: string;
  icone: LucideIcon;
  Pagina: ComponentType<{ demo: Demo; ir: (pagina: NomePagina) => void }>;
}

const GRUPOS: { nome: string; itens: ItemMenu[] }[] = [
  {
    nome: 'Produto',
    itens: [
      { id: 'painel', nome: 'Painel', icone: LayoutDashboard, Pagina: PaginaPainel },
      { id: 'feed', nome: 'Feed', icone: Newspaper, Pagina: PaginaFeed },
      { id: 'lojas', nome: 'Lojas', icone: Store, Pagina: PaginaLojas },
      { id: 'clientes', nome: 'Clientes', icone: Users, Pagina: PaginaClientes },
    ],
  },
  {
    nome: 'API',
    itens: [
      { id: 'chamadas', nome: 'Chamadas', icone: ScrollText, Pagina: PaginaChamadas },
      { id: 'erros', nome: 'Respostas de erro', icone: FlaskConical, Pagina: PaginaErros },
    ],
  },
];

const ITENS = GRUPOS.flatMap((grupo) => grupo.itens);

const paginaDoEndereco = (): NomePagina => {
  const pedida = window.location.hash.slice(1);
  return ITENS.find((item) => item.id === pedida)?.id ?? 'painel';
};

function usePagina() {
  const [pagina, setPagina] = useState(paginaDoEndereco);

  useEffect(() => {
    const aoMudar = () => {
      setPagina(paginaDoEndereco());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  const ir = (destino: NomePagina) => {
    window.location.hash = destino;
  };

  return [pagina, ir] as const;
}

function useIndicador(pagina: NomePagina) {
  const navegacao = useRef<HTMLElement>(null);
  const [posicao, setPosicao] = useState<CSSProperties>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: o item ativo muda junto com a página
  useLayoutEffect(() => {
    const elemento = navegacao.current;
    if (!elemento) return;

    const medir = () => {
      const ativo = elemento.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!ativo) return;
      setPosicao({
        width: ativo.offsetWidth,
        height: ativo.offsetHeight,
        transform: `translate(${ativo.offsetLeft}px, ${ativo.offsetTop}px)`,
      });
    };

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [pagina]);

  return [navegacao, posicao] as const;
}

function Marca() {
  return (
    <span className="marca">
      <span className="marca-icone" aria-hidden="true">
        <Rss size={18} strokeWidth={2.75} />
      </span>
      <span>
        Feed de Novidades
        <small>Demonstração da API</small>
      </span>
    </span>
  );
}

function BarraLateral({ demo, pagina }: { demo: Demo; pagina: NomePagina }) {
  const [navegacao, posicao] = useIndicador(pagina);

  return (
    <aside className="lateral">
      <Marca />
      <nav ref={navegacao} aria-label="Páginas">
        <span className="indicador-navegacao" style={posicao} />
        {GRUPOS.map((grupo) => (
          <div key={grupo.nome}>
            <h2>{grupo.nome}</h2>
            <ul>
              {grupo.itens.map(({ id, nome, icone: Icone }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={pagina === id ? 'ativo' : ''}
                    aria-current={pagina === id ? 'page' : undefined}
                  >
                    <Icone size={18} aria-hidden="true" />
                    {nome}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="lateral-rodape">
        <a href="/documentation" target="_blank" rel="noreferrer">
          <BookOpen size={18} aria-hidden="true" />
          Documentação
        </a>
        <div className="cliente-ativo">
          {demo.clienteAtivo ? <Avatar nome={demo.clienteAtivo.nome} /> : null}
          <div className="campo">
            <label htmlFor="cliente-ativo">Vendo o feed de</label>
            <select
              id="cliente-ativo"
              value={demo.clienteAtivoId ?? ''}
              disabled={!demo.clientes.length}
              onChange={(e) => demo.selecionarCliente(Number(e.target.value))}
            >
              {!demo.clientes.length && <option value="">Nenhum cliente</option>}
              {demo.clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SituacaoApi({ demo }: { demo: Demo }) {
  if (!demo.chamadas.length) return null;
  return (
    <span className={demo.apiForaDoAr ? 'situacao situacao-falha' : 'situacao'} role="status">
      <span className="ponto" />
      {demo.apiForaDoAr ? 'API fora do ar' : 'API no ar'}
    </span>
  );
}

function BarraSuperior(props: {
  demo: Demo;
  nomePagina: string;
  ir: (pagina: NomePagina) => void;
}) {
  const { demo, ir } = props;

  const focarPublicacao = () => {
    const campo = document.getElementById('publicar-texto');
    if (campo) {
      campo.focus();
      return;
    }
    ir('lojas');
    setTimeout(() => document.getElementById('publicar-texto')?.focus(), 50);
  };

  return (
    <header className="superior">
      <div className="superior-marca">
        <Marca />
      </div>
      <p className="trilha">
        Feed de Novidades
        <ChevronRight size={14} aria-hidden="true" />
        <strong>{props.nomePagina}</strong>
      </p>
      <div className="superior-acoes">
        <SituacaoApi demo={demo} />
        <a
          className="botao botao-discreto superior-documentacao"
          href="/documentation"
          target="_blank"
          rel="noreferrer"
          aria-label="Documentação"
        >
          <BookOpen size={16} aria-hidden="true" />
        </a>
        <button className="botao botao-discreto" type="button" onClick={demo.recomecar}>
          <RotateCcw size={16} aria-hidden="true" />
          <span>Recomeçar</span>
        </button>
        {demo.lojas.length ? (
          <button className="botao botao-primario" type="button" onClick={focarPublicacao}>
            <Pencil size={16} aria-hidden="true" />
            <span>Publicar</span>
          </button>
        ) : (
          <BotaoCenario demo={demo} />
        )}
      </div>
    </header>
  );
}

function NavegacaoMovel({ pagina }: { pagina: NomePagina }) {
  const curtos: Partial<Record<NomePagina, string>> = { erros: 'Erros' };
  const [navegacao, posicao] = useIndicador(pagina);

  return (
    <nav ref={navegacao} className="navegacao-movel" aria-label="Páginas">
      <span className="indicador-navegacao" style={posicao} />
      {ITENS.map(({ id, nome, icone: Icone }) => (
        <a
          key={id}
          href={`#${id}`}
          className={pagina === id ? 'ativo' : ''}
          aria-current={pagina === id ? 'page' : undefined}
        >
          <Icone size={18} aria-hidden="true" />
          {curtos[id] ?? nome}
        </a>
      ))}
    </nav>
  );
}

export function App() {
  const demo = useDemo();
  const [pagina, ir] = usePagina();
  const atual = ITENS.find((item) => item.id === pagina) ?? (ITENS[0] as ItemMenu);
  const { Pagina } = atual;

  return (
    <div className="app">
      <BarraLateral demo={demo} pagina={pagina} />
      <div className="conteudo">
        <BarraSuperior demo={demo} nomePagina={atual.nome} ir={ir} />
        {(demo.apiForaDoAr || demo.aviso) && (
          <p className={demo.apiForaDoAr ? 'faixa faixa-falha' : 'faixa'} role="alert">
            {demo.apiForaDoAr
              ? 'A API não respondeu. Confira se ela está rodando com npm run dev.'
              : demo.aviso}
          </p>
        )}
        <main>
          <Pagina demo={demo} ir={ir} />
        </main>
      </div>
      <NavegacaoMovel pagina={pagina} />
    </div>
  );
}

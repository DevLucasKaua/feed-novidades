import type { Novidade } from '../api';
import type { Demo } from '../useDemo';
import { Avatar } from './comum';

const LIMITES = [5, 20, 50];

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto', style: 'short' });
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatarPreco = (preco: string) => moeda.format(Number(preco));

export function haQuanto(data: string) {
  const segundos = Math.round((new Date(data).getTime() - Date.now()) / 1000);
  if (segundos > -60) return 'agora';
  const minutos = Math.round(segundos / 60);
  if (minutos > -60) return relativo.format(minutos, 'minute');
  const horas = Math.round(minutos / 60);
  if (horas > -24) return relativo.format(horas, 'hour');
  return relativo.format(Math.round(horas / 24), 'day');
}

function ItemFeed({ novidade }: { novidade: Novidade }) {
  return (
    <li className="item-feed">
      <Avatar nome={novidade.loja.nome} />
      <div className="item-conteudo">
        <div className="item-topo">
          <strong>{novidade.loja.nome}</strong>
          <time dateTime={novidade.criadoEm}>{haQuanto(novidade.criadoEm)}</time>
        </div>
        <p>{novidade.texto}</p>
        {novidade.preco && <span className="preco">{formatarPreco(novidade.preco)}</span>}
      </div>
    </li>
  );
}

const Esqueleto = () => (
  <ul aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <li className="item-feed" key={i}>
        <span className="avatar esqueleto" />
        <div className="item-conteudo">
          <span className="linha-esqueleto esqueleto" />
          <span className="linha-esqueleto curta esqueleto" />
        </div>
      </li>
    ))}
  </ul>
);

function Vazio({ demo }: { demo: Demo }) {
  const [titulo, texto] = !demo.clienteAtivo
    ? ['O feed aparece aqui', 'Prepare o cenário ou crie um cliente para começar.']
    : !demo.seguidas.length
      ? [
          `${demo.clienteAtivo.nome} ainda não segue nenhuma loja`,
          'Siga uma loja para as novidades dela aparecerem aqui.',
        ]
      : [
          'Nenhuma novidade por enquanto',
          'Publique algo em uma loja seguida para ver o feed mudar.',
        ];
  return (
    <div className="vazio">
      <strong>{titulo}</strong>
      <p>{texto}</p>
    </div>
  );
}

export function EscolhaDeLimite({ demo }: { demo: Demo }) {
  return (
    <fieldset className="limite">
      <legend className="so-leitor">Novidades por página</legend>
      {LIMITES.map((valor) => (
        <label key={valor} className={demo.limite === valor ? 'ativo' : ''}>
          <input
            type="radio"
            name="limite"
            checked={demo.limite === valor}
            onChange={() => demo.setLimite(valor)}
          />
          {valor}
        </label>
      ))}
    </fieldset>
  );
}

export function ListaFeed({ demo, maximo }: { demo: Demo; maximo?: number }) {
  const itens = maximo ? demo.novidades.slice(0, maximo) : demo.novidades;

  return (
    <div aria-busy={demo.carregandoFeed}>
      {demo.erroFeed && (
        <p className="mensagem mensagem-erro" role="alert">
          {demo.erroFeed}
        </p>
      )}
      {demo.carregandoFeed && !itens.length ? (
        <Esqueleto />
      ) : itens.length ? (
        <>
          <ul>
            {itens.map((novidade) => (
              <ItemFeed key={novidade.id} novidade={novidade} />
            ))}
          </ul>
          {!maximo &&
            (demo.proximoCursor ? (
              <button
                className="botao carregar-mais"
                type="button"
                disabled={demo.carregandoMais}
                onClick={demo.carregarMais}
              >
                {demo.carregandoMais ? 'Carregando...' : 'Carregar mais'}
              </button>
            ) : (
              <p className="fim-feed">Você viu todas as novidades</p>
            ))}
        </>
      ) : (
        !demo.erroFeed && <Vazio demo={demo} />
      )}
    </div>
  );
}

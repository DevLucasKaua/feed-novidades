import type { Novidade } from '../api';
import type { Demo } from '../useDemo';
import { iniciais } from './PainelLojas';

const LIMITES = [5, 20, 50];

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto', style: 'short' });
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function haQuanto(data: string) {
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
      <span className="avatar" aria-hidden="true">
        {iniciais(novidade.loja.nome)}
      </span>
      <div className="item-conteudo">
        <div className="item-topo">
          <strong>{novidade.loja.nome}</strong>
          <time dateTime={novidade.criadoEm}>{haQuanto(novidade.criadoEm)}</time>
        </div>
        <p>{novidade.texto}</p>
        {novidade.preco && <span className="preco">{moeda.format(Number(novidade.preco))}</span>}
      </div>
    </li>
  );
}

const Esqueleto = () => (
  <ul className="lista-feed" aria-hidden="true">
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
  if (!demo.clienteAtivo) {
    return (
      <div className="vazio">
        <strong>O feed aparece aqui</strong>
        <p>Prepare o cenário ou crie um cliente para começar.</p>
      </div>
    );
  }
  if (!demo.seguidas.length) {
    return (
      <div className="vazio">
        <strong>{demo.clienteAtivo.nome} ainda não segue nenhuma loja</strong>
        <p>Siga uma loja para as novidades dela aparecerem aqui.</p>
      </div>
    );
  }
  return (
    <div className="vazio">
      <strong>Nenhuma novidade por enquanto</strong>
      <p>Publique algo em uma loja seguida para ver o feed mudar.</p>
    </div>
  );
}

export function Celular({ demo }: { demo: Demo }) {
  const carregandoInicio = demo.carregandoFeed && !demo.novidades.length;

  return (
    <div className="celular">
      <header className="celular-topo">
        <div>
          <h2>Feed</h2>
          <p>{demo.clienteAtivo?.nome ?? 'Nenhum cliente'}</p>
        </div>
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
      </header>

      <div className="celular-tela" aria-busy={demo.carregandoFeed}>
        {demo.erroFeed && (
          <p className="mensagem mensagem-erro" role="alert">
            {demo.erroFeed}
          </p>
        )}
        {carregandoInicio ? (
          <Esqueleto />
        ) : demo.novidades.length ? (
          <>
            <ul className="lista-feed">
              {demo.novidades.map((novidade) => (
                <ItemFeed key={novidade.id} novidade={novidade} />
              ))}
            </ul>
            {demo.proximoCursor ? (
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
            )}
          </>
        ) : (
          !demo.erroFeed && <Vazio demo={demo} />
        )}
      </div>
    </div>
  );
}

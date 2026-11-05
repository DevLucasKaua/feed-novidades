import { BookOpen, RotateCcw, Rss } from 'lucide-react';
import { useState } from 'react';
import { Celular } from './componentes/Celular';
import { PainelChamadas } from './componentes/PainelChamadas';
import { PainelLojas } from './componentes/PainelLojas';
import { useDemo } from './useDemo';

const ABAS = [
  { id: 'lojas', nome: 'Lojas' },
  { id: 'feed', nome: 'Feed' },
  { id: 'chamadas', nome: 'Chamadas' },
] as const;

type Aba = (typeof ABAS)[number]['id'];

export function App() {
  const demo = useDemo();
  const [aba, setAba] = useState<Aba>('lojas');

  return (
    <div className="app" data-aba={aba}>
      <header className="topo">
        <h1 className="marca">
          <span className="marca-icone" aria-hidden="true">
            <Rss size={16} strokeWidth={2.75} />
          </span>
          Feed de Novidades
        </h1>
        <nav className="topo-acoes" aria-label="Ações">
          <a className="botao-texto" href="/documentation" target="_blank" rel="noreferrer">
            <BookOpen size={16} aria-hidden="true" />
            <span>Documentação</span>
          </a>
          <button className="botao-texto" type="button" onClick={demo.recomecar}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>Recomeçar</span>
          </button>
        </nav>
      </header>

      {(demo.apiForaDoAr || demo.aviso) && (
        <p className={demo.apiForaDoAr ? 'faixa faixa-falha' : 'faixa'} role="alert">
          {demo.apiForaDoAr
            ? 'A API não respondeu. Confira se ela está rodando com npm run dev.'
            : demo.aviso}
        </p>
      )}

      <nav className="abas" aria-label="Áreas">
        {ABAS.map(({ id, nome }) => (
          <button
            key={id}
            type="button"
            className={aba === id ? 'ativa' : ''}
            aria-current={aba === id ? 'page' : undefined}
            onClick={() => setAba(id)}
          >
            {nome}
            {id === 'chamadas' && demo.chamadas.length > 0 && (
              <span className="contagem">{demo.chamadas.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="palco">
        <section className="area area-lojas" aria-label="Lojas e clientes">
          <PainelLojas demo={demo} />
        </section>
        <section className="area area-feed" aria-label="Feed do cliente">
          <Celular demo={demo} />
        </section>
        <section className="area area-chamadas" aria-label="Chamadas à API">
          <PainelChamadas demo={demo} />
        </section>
      </main>
    </div>
  );
}

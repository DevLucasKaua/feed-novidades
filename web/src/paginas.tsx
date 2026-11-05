import { ArrowRight, Check, Play, ScrollText } from 'lucide-react';
import { GraficoChamadas, ListaChamadas, ProvocarErros } from './componentes/Chamadas';
import { Avatar, Cabecalho, Cartao } from './componentes/comum';
import { EscolhaDeLimite, formatarPreco, haQuanto, ListaFeed } from './componentes/Feed';
import { ListaLojas, NovaLoja, NovoCliente, Publicar } from './componentes/Formularios';
import type { Demo } from './useDemo';

export type NomePagina = 'painel' | 'feed' | 'lojas' | 'clientes' | 'chamadas' | 'erros';

interface PropsPagina {
  demo: Demo;
  ir: (pagina: NomePagina) => void;
}

const rotaDoFeed = (demo: Demo) => `GET /clientes/${demo.clienteAtivoId ?? '{id}'}/feed`;

export function BotaoCenario({ demo }: { demo: Demo }) {
  return (
    <button
      className="botao botao-primario"
      type="button"
      disabled={demo.preparando}
      onClick={demo.prepararCenario}
    >
      <Play size={16} aria-hidden="true" />
      {demo.preparando ? 'Preparando...' : 'Preparar cenário'}
    </button>
  );
}

function Destaque({ demo, ir }: PropsPagina) {
  const recente = demo.novidades[0];

  if (!demo.clienteAtivo) {
    return (
      <section className="cartao destaque">
        <div className="destaque-faixa">
          <span className="selo">Comece por aqui</span>
          <div>
            <h2>Crie lojas, clientes e novidades com um clique</h2>
            <p>Cada passo é uma chamada real à API, registrada com status, tempo e JSON.</p>
          </div>
        </div>
        <div className="destaque-acoes">
          <BotaoCenario demo={demo} />
          <button className="botao" type="button" onClick={() => ir('clientes')}>
            Criar manualmente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cartao destaque">
      <div className="destaque-faixa">
        <div className="destaque-selos">
          <span className="selo">
            {recente ? `Mais recente · ${haQuanto(recente.criadoEm)}` : 'Sem novidades'}
          </span>
          {recente && <span className="selo">{recente.loja.nome}</span>}
        </div>
        <div>
          <h2>{recente?.texto ?? 'O feed ainda está vazio'}</h2>
          {recente?.preco && (
            <dl className="destaque-dados">
              <div>
                <dt>Preço</dt>
                <dd>{formatarPreco(recente.preco)}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
      <div className="destaque-acoes">
        <button className="botao" type="button" onClick={() => ir('feed')}>
          Abrir feed
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button className="botao" type="button" onClick={() => ir('erros')}>
          Testar respostas de erro
        </button>
      </div>
    </section>
  );
}

function Resumo({ demo }: { demo: Demo }) {
  const erros = demo.chamadas.filter((c) => c.status >= 400 || c.status === 0).length;
  const itens = [
    { rotulo: 'Lojas seguidas', valor: demo.seguidas.length },
    {
      rotulo: 'Novidades no feed',
      valor: `${demo.novidades.length}${demo.proximoCursor ? '+' : ''}`,
    },
    { rotulo: 'Chamadas feitas', valor: demo.chamadas.length },
    { rotulo: 'Respostas de erro', valor: erros, alerta: erros > 0 },
  ];

  return (
    <section className="cartao resumo" aria-label="Resumo">
      <dl>
        {itens.map((item) => (
          <div key={item.rotulo} className={item.alerta ? 'resumo-alerta' : undefined}>
            <dt>{item.rotulo}</dt>
            <dd>{item.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PaginaPainel({ demo, ir }: PropsPagina) {
  return (
    <>
      <Cabecalho
        rota={rotaDoFeed(demo)}
        titulo={demo.clienteAtivo ? `Feed de ${demo.clienteAtivo.nome}` : 'Veja a API em ação'}
        descricao={
          demo.clienteAtivo
            ? 'O que este cliente vê agora, montado na leitura a partir das lojas seguidas.'
            : 'Lojas publicam, clientes seguem, e o feed mostra o resultado de cada chamada.'
        }
      >
        <button className="botao" type="button" onClick={() => ir('lojas')}>
          Lojas
        </button>
        <button className="botao" type="button" onClick={() => ir('chamadas')}>
          Chamadas
        </button>
      </Cabecalho>

      <div className="blocos">
        <Destaque demo={demo} ir={ir} />
        <Cartao
          className="bloco-4 bloco-grafico"
          titulo="Tempo das chamadas"
          subtitulo={
            demo.chamadas.length === 1
              ? 'Última chamada'
              : `Últimas ${Math.min(21, demo.chamadas.length) || 21}`
          }
        >
          <GraficoChamadas demo={demo} />
        </Cartao>

        <Resumo demo={demo} />

        <div className="pilha bloco-7">
          <Cartao
            titulo="Feed"
            subtitulo={demo.clienteAtivo?.nome ?? 'Nenhum cliente'}
            acao={
              <button className="botao-texto" type="button" onClick={() => ir('feed')}>
                Ver tudo
              </button>
            }
          >
            <ListaFeed demo={demo} maximo={4} />
          </Cartao>
          <Cartao
            titulo="Últimas chamadas"
            acao={
              <button className="botao-texto" type="button" onClick={() => ir('chamadas')}>
                Ver todas
              </button>
            }
          >
            <ListaChamadas demo={demo} maximo={6} />
          </Cartao>
        </div>

        <div className="pilha bloco-5">
          <Cartao titulo="Publicar novidade" subtitulo="POST /lojas/{id}/novidades">
            <Publicar demo={demo} />
          </Cartao>
          <Cartao titulo="Lojas" subtitulo="Seguir muda o feed na hora">
            <ListaLojas demo={demo} />
          </Cartao>
        </div>
      </div>
    </>
  );
}

export function PaginaFeed({ demo }: PropsPagina) {
  return (
    <>
      <Cabecalho
        rota={`${rotaDoFeed(demo)}?limite=${demo.limite}`}
        titulo="Feed"
        descricao="Da novidade mais recente para a mais antiga, só das lojas seguidas, com paginação por cursor."
      />
      <div className="blocos">
        <Cartao
          className="bloco-8"
          titulo={demo.clienteAtivo?.nome ?? 'Nenhum cliente'}
          subtitulo={`${demo.seguidas.length} ${demo.seguidas.length === 1 ? 'loja seguida' : 'lojas seguidas'}`}
          acao={<EscolhaDeLimite demo={demo} />}
        >
          <ListaFeed demo={demo} />
        </Cartao>
        <Cartao className="bloco-4" titulo="Lojas" subtitulo="Seguir muda o feed na hora">
          <ListaLojas demo={demo} />
        </Cartao>
      </div>
    </>
  );
}

export function PaginaLojas({ demo }: PropsPagina) {
  return (
    <>
      <Cabecalho
        rota="POST /lojas"
        titulo="Lojas"
        descricao="Crie lojas, publique novidades e escolha o que o cliente ativo acompanha."
      />
      <div className="blocos">
        <Cartao className="bloco-6" titulo="Todas as lojas" subtitulo="As criadas neste navegador">
          <ListaLojas demo={demo} />
          <NovaLoja demo={demo} />
        </Cartao>
        <Cartao
          className="bloco-6"
          titulo="Publicar novidade"
          subtitulo="POST /lojas/{id}/novidades"
        >
          <Publicar demo={demo} />
        </Cartao>
      </div>
    </>
  );
}

export function PaginaClientes({ demo }: PropsPagina) {
  return (
    <>
      <Cabecalho
        rota="POST /clientes"
        titulo="Clientes"
        descricao="Escolha de quem é o feed exibido, ou crie um cliente novo."
      />
      <div className="blocos">
        <Cartao
          className="bloco-6"
          titulo="Todos os clientes"
          subtitulo="Os criados neste navegador"
        >
          {demo.clientes.length ? (
            <ul className="lista-lojas">
              {demo.clientes.map((cliente) => {
                const ativo = cliente.id === demo.clienteAtivoId;
                return (
                  <li key={cliente.id}>
                    <Avatar nome={cliente.nome} />
                    <span className="loja-nome">
                      {cliente.nome}
                      <small>{cliente.email}</small>
                    </span>
                    <button
                      className={ativo ? 'botao-seguir ativo' : 'botao-seguir'}
                      type="button"
                      aria-pressed={ativo}
                      aria-label={`Ver o feed de ${cliente.nome}`}
                      onClick={() => demo.selecionarCliente(cliente.id)}
                    >
                      {ativo && <Check size={14} aria-hidden="true" />}
                      {ativo ? 'Ativo' : 'Ver feed'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mensagem">Nenhum cliente ainda. Crie um ao lado ou prepare o cenário.</p>
          )}
        </Cartao>
        <Cartao className="bloco-6" titulo="Novo cliente" subtitulo="email é único">
          <NovoCliente demo={demo} />
        </Cartao>
      </div>
    </>
  );
}

export function PaginaChamadas({ demo }: PropsPagina) {
  return (
    <>
      <Cabecalho
        rota="Todas as rotas"
        titulo="Chamadas à API"
        descricao="Cada requisição feita por esta tela, com método, status, tempo e JSON."
      />
      <div className="blocos">
        <Cartao
          className="bloco-8"
          titulo="Registro"
          subtitulo={`${demo.chamadas.length} nesta sessão`}
          acao={
            <button
              className="botao-texto"
              type="button"
              disabled={!demo.chamadas.length}
              onClick={demo.limparChamadas}
            >
              Limpar
            </button>
          }
        >
          <ListaChamadas demo={demo} abrirRecente />
        </Cartao>
        <Cartao className="bloco-4" titulo="Tempo das chamadas">
          <GraficoChamadas demo={demo} />
        </Cartao>
      </div>
    </>
  );
}

export function PaginaErros({ demo, ir }: PropsPagina) {
  return (
    <>
      <Cabecalho
        rota="400 · 404 · 409 · 422"
        titulo="Respostas de erro"
        descricao="Toda a API responde erro no mesmo formato. Dispare cada caso e confira o corpo ao lado."
      >
        <button className="botao" type="button" onClick={() => ir('chamadas')}>
          <ScrollText size={16} aria-hidden="true" />
          Ver registro
        </button>
      </Cabecalho>
      <div className="blocos">
        <Cartao className="bloco-5" titulo="Casos" subtitulo="O selo mostra o status esperado">
          <ProvocarErros demo={demo} />
        </Cartao>
        <Cartao className="bloco-7" titulo="Última resposta">
          <ListaChamadas demo={demo} maximo={1} abrirRecente />
        </Cartao>
      </div>
    </>
  );
}

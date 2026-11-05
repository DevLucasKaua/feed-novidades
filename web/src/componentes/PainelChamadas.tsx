import { ChevronRight, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { api, type Chamada } from '../api';
import type { Demo } from '../useDemo';

const TOKENS = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(-?\d+(?:\.\d+)?|true|false|null)\b/g;

function Json({ valor }: { valor: unknown }) {
  const texto = typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2);
  const partes: React.ReactNode[] = [];
  let posicao = 0;

  for (const achado of texto.matchAll(TOKENS)) {
    partes.push(texto.slice(posicao, achado.index));
    const classe = achado[2] ? 'json-chave' : achado[1] ? 'json-texto' : 'json-valor';
    partes.push(
      <span className={classe} key={achado.index}>
        {achado[1] ?? achado[3]}
      </span>,
    );
    if (achado[2]) partes.push(achado[2]);
    posicao = achado.index + achado[0].length;
  }
  partes.push(texto.slice(posicao));

  return <pre>{partes}</pre>;
}

const classeDoStatus = (status: number) => {
  if (status === 0 || status >= 500) return 'status status-falha';
  return status >= 400 ? 'status status-alerta' : 'status status-ok';
};

function ItemChamada(props: { chamada: Chamada; aberta: boolean; aoAlternar: () => void }) {
  const { chamada, aberta } = props;
  return (
    <li className="chamada">
      <button
        className="chamada-linha"
        type="button"
        aria-expanded={aberta}
        onClick={props.aoAlternar}
      >
        <ChevronRight className={aberta ? 'seta aberta' : 'seta'} size={14} aria-hidden="true" />
        <span className="metodo">{chamada.metodo}</span>
        <span className="caminho">{chamada.caminho}</span>
        <span className="tempo">{chamada.ms} ms</span>
        <span className={classeDoStatus(chamada.status)}>{chamada.status || 'sem resposta'}</span>
      </button>
      {aberta && (
        <div className="chamada-detalhe">
          {chamada.enviado !== undefined && (
            <>
              <h3>Enviado</h3>
              <Json valor={chamada.enviado} />
            </>
          )}
          <h3>Resposta</h3>
          {chamada.resposta === null ? (
            <p className="sem-corpo">{chamada.status ? 'Sem corpo' : 'A API não respondeu'}</p>
          ) : (
            <Json valor={chamada.resposta} />
          )}
        </div>
      )}
    </li>
  );
}

function ProvocarErros({ demo }: { demo: Demo }) {
  const loja = demo.lojas[0];
  const cliente = demo.clienteAtivo;
  const seguida = demo.seguidas[0];

  const erros = [
    {
      nome: 'JSON malformado',
      status: 400,
      acao: () => api.jsonMalformado(),
    },
    {
      nome: 'Limite acima de 50',
      status: 422,
      acao: cliente && (() => api.feed(cliente.id, { limite: 51 })),
    },
    {
      nome: 'Preço zero',
      status: 422,
      acao: loja && (() => api.publicar(loja.id, { texto: 'Oferta', preco: 0 })),
    },
    {
      nome: 'Texto com 501 caracteres',
      status: 422,
      acao: loja && (() => api.publicar(loja.id, { texto: 'a'.repeat(501) })),
    },
    {
      nome: 'Cliente inexistente',
      status: 404,
      acao: () => api.feed(999999, { limite: 20 }),
    },
    {
      nome: 'E-mail repetido',
      status: 409,
      acao: cliente && (() => api.criarCliente('Outro nome', cliente.email)),
    },
    {
      nome: 'Seguir a mesma loja de novo',
      status: 409,
      acao: cliente && seguida && (() => api.seguir(cliente.id, seguida)),
    },
  ];

  return (
    <details className="provocar">
      <summary>
        <FlaskConical size={16} aria-hidden="true" />
        Testar respostas de erro
      </summary>
      <ul>
        {erros.map((erro) => (
          <li key={erro.nome}>
            <button
              type="button"
              disabled={!erro.acao}
              onClick={() => {
                if (erro.acao) erro.acao();
              }}
            >
              <span>{erro.nome}</span>
              <span className={classeDoStatus(erro.status)}>{erro.status}</span>
            </button>
          </li>
        ))}
      </ul>
      {erros.some((erro) => !erro.acao) && (
        <p>Os itens desativados precisam de um cenário preparado.</p>
      )}
    </details>
  );
}

export function PainelChamadas({ demo }: { demo: Demo }) {
  const [fechadas, setFechadas] = useState<Set<number>>(new Set());
  const [abertas, setAbertas] = useState<Set<number>>(new Set());
  const maisRecente = demo.chamadas[0]?.id;

  const estaAberta = (id: number) => abertas.has(id) || (id === maisRecente && !fechadas.has(id));

  const alternar = (id: number) => {
    const aberta = estaAberta(id);
    const atualizar = (conjunto: Set<number>, incluir: boolean) => {
      const novo = new Set(conjunto);
      if (incluir) novo.add(id);
      else novo.delete(id);
      return novo;
    };
    setAbertas((c) => atualizar(c, !aberta));
    setFechadas((c) => atualizar(c, aberta));
  };

  return (
    <div className="painel-chamadas">
      <header className="chamadas-topo">
        <h2>Chamadas à API</h2>
        <span className="contagem" role="status">
          {demo.chamadas.length}
        </span>
        <button
          className="botao-texto"
          type="button"
          disabled={!demo.chamadas.length}
          onClick={demo.limparChamadas}
        >
          Limpar
        </button>
      </header>

      {demo.chamadas.length ? (
        <ol className="lista-chamadas">
          {demo.chamadas.map((chamada) => (
            <ItemChamada
              key={chamada.id}
              chamada={chamada}
              aberta={estaAberta(chamada.id)}
              aoAlternar={() => alternar(chamada.id)}
            />
          ))}
        </ol>
      ) : (
        <div className="vazio">
          <strong>Nenhuma chamada ainda</strong>
          <p>Tudo o que você fizer aqui aparece com método, status, tempo e JSON.</p>
        </div>
      )}

      <ProvocarErros demo={demo} />
    </div>
  );
}

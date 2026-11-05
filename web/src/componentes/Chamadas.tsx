import { ChevronRight } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { api, type Chamada } from '../api';
import type { Demo } from '../useDemo';
import { classeDoStatus } from './comum';

const TOKENS = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(-?\d+(?:\.\d+)?|true|false|null)\b/g;
const BARRAS = 21;

function Json({ valor }: { valor: unknown }) {
  const texto = typeof valor === 'string' ? valor : JSON.stringify(valor, null, 2);
  const partes: ReactNode[] = [];
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

export function ListaChamadas(props: { demo: Demo; maximo?: number; abrirRecente?: boolean }) {
  const { demo, maximo, abrirRecente } = props;
  const [alternadas, setAlternadas] = useState<Set<number>>(new Set());
  const maisRecente = abrirRecente ? demo.chamadas[0]?.id : undefined;

  const estaAberta = (id: number) => (id === maisRecente) !== alternadas.has(id);
  const alternar = (id: number) =>
    setAlternadas((atuais) => {
      const novas = new Set(atuais);
      if (novas.has(id)) novas.delete(id);
      else novas.add(id);
      return novas;
    });

  if (!demo.chamadas.length) {
    return (
      <div className="vazio">
        <strong>Nenhuma chamada ainda</strong>
        <p>Tudo o que você fizer aqui aparece com método, status, tempo e JSON.</p>
      </div>
    );
  }

  return (
    <ol>
      {demo.chamadas.slice(0, maximo).map((chamada) => (
        <ItemChamada
          key={chamada.id}
          chamada={chamada}
          aberta={estaAberta(chamada.id)}
          aoAlternar={() => alternar(chamada.id)}
        />
      ))}
    </ol>
  );
}

const classeDaBarra = (status: number) =>
  classeDoStatus(status).replace('status status-', 'barra-');

export function GraficoChamadas({ demo }: { demo: Demo }) {
  const [emFoco, setEmFoco] = useState<Chamada | null>(null);
  const recentes = demo.chamadas.slice(0, BARRAS).reverse();
  const presentesAoMontar = useRef(new Set(recentes.map((c) => c.id)));
  const maiorTempo = Math.max(1, ...recentes.map((c) => c.ms));
  const vazias = Array.from({ length: BARRAS - recentes.length }, (_, i) => i);
  const media = recentes.length
    ? Math.round(recentes.reduce((soma, c) => soma + c.ms, 0) / recentes.length)
    : null;
  const contar = (filtro: (status: number) => boolean) =>
    demo.chamadas.filter((c) => filtro(c.status)).length;
  const exibida = emFoco ?? demo.chamadas[0];

  return (
    <>
      <p className="grafico-numero">
        <strong>{media ?? '0'}</strong> {media === null ? 'chamadas ainda' : 'ms em média'}
      </p>
      <fieldset className="grafico" onMouseLeave={() => setEmFoco(null)}>
        <legend className="so-leitor">
          Tempo de resposta das últimas {recentes.length} chamadas
        </legend>
        {vazias.map((i) => (
          <span className="coluna" key={i}>
            <span className="barra barra-vazia" />
          </span>
        ))}
        {recentes.map((chamada, indice) => (
          <button
            className="coluna"
            type="button"
            key={chamada.id}
            aria-label={`${chamada.metodo} ${chamada.caminho}, ${chamada.status || 'sem resposta'}, ${chamada.ms} ms`}
            onMouseEnter={() => setEmFoco(chamada)}
            onFocus={() => setEmFoco(chamada)}
          >
            <span
              className={`barra ${classeDaBarra(chamada.status)}`}
              style={{
                height: `${Math.max(6, (chamada.ms / maiorTempo) * 100)}%`,
                animationDelay: presentesAoMontar.current.has(chamada.id)
                  ? `${200 + indice * 25}ms`
                  : '0ms',
              }}
            />
          </button>
        ))}
      </fieldset>
      <p className="grafico-leitura">
        {exibida
          ? `${exibida.metodo} ${exibida.caminho} · ${exibida.status || 'sem resposta'} · ${exibida.ms} ms`
          : 'Passe o mouse sobre uma barra'}
      </p>
      <ul className="grafico-legenda">
        <li>
          <span className="ponto barra-ok" />
          Sucesso <strong>{contar((s) => s > 0 && s < 400)}</strong>
        </li>
        <li>
          <span className="ponto barra-alerta" />
          Erro do cliente <strong>{contar((s) => s >= 400 && s < 500)}</strong>
        </li>
        <li>
          <span className="ponto barra-falha" />
          Falha <strong>{contar((s) => s === 0 || s >= 500)}</strong>
        </li>
      </ul>
    </>
  );
}

export function ProvocarErros({ demo }: { demo: Demo }) {
  const loja = demo.lojas[0];
  const cliente = demo.clienteAtivo;
  const seguida = demo.seguidas[0];

  const erros = [
    {
      nome: 'JSON malformado',
      regra: 'O corpo não pode ser lido',
      status: 400,
      acao: () => api.jsonMalformado(),
    },
    {
      nome: 'Limite acima de 50',
      regra: 'limite vai de 1 a 50',
      status: 422,
      acao: cliente && (() => api.feed(cliente.id, { limite: 51 })),
    },
    {
      nome: 'Preço zero',
      regra: 'preco precisa ser maior que zero',
      status: 422,
      acao: loja && (() => api.publicar(loja.id, { texto: 'Oferta', preco: 0 })),
    },
    {
      nome: 'Texto com 501 caracteres',
      regra: 'texto vai de 1 a 500 caracteres',
      status: 422,
      acao: loja && (() => api.publicar(loja.id, { texto: 'a'.repeat(501) })),
    },
    {
      nome: 'Cliente inexistente',
      regra: 'O recurso precisa existir',
      status: 404,
      acao: () => api.feed(999999, { limite: 20 }),
    },
    {
      nome: 'E-mail repetido',
      regra: 'email é único',
      status: 409,
      acao: cliente && (() => api.criarCliente('Outro nome', cliente.email)),
    },
    {
      nome: 'Seguir a mesma loja de novo',
      regra: 'Não pode seguir duas vezes',
      status: 409,
      acao: cliente && seguida && (() => api.seguir(cliente.id, seguida)),
    },
  ];

  return (
    <>
      <ul className="lista-erros">
        {erros.map((erro) => (
          <li key={erro.nome}>
            <button
              type="button"
              disabled={!erro.acao}
              onClick={() => {
                if (erro.acao) erro.acao();
              }}
            >
              <span>
                <strong>{erro.nome}</strong>
                <small>{erro.regra}</small>
              </span>
              <span className={classeDoStatus(erro.status)}>{erro.status}</span>
            </button>
          </li>
        ))}
      </ul>
      {erros.some((erro) => !erro.acao) && (
        <p className="mensagem">Os itens desativados precisam de um cenário preparado.</p>
      )}
    </>
  );
}

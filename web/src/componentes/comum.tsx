import type { ReactNode } from 'react';

export const iniciais = (nome: string) =>
  nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

export const Avatar = ({ nome }: { nome: string }) => (
  <span className="avatar" aria-hidden="true">
    {iniciais(nome)}
  </span>
);

export function Cartao(props: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`cartao ${props.className ?? ''}`}>
      <header className="cartao-topo">
        <div>
          <h2>{props.titulo}</h2>
          {props.subtitulo && <p>{props.subtitulo}</p>}
        </div>
        {props.acao}
      </header>
      {props.children}
    </section>
  );
}

export function Cabecalho(props: {
  rota: string;
  titulo: string;
  descricao: string;
  children?: ReactNode;
}) {
  return (
    <header className="cabecalho">
      <div>
        <code className="rota">{props.rota}</code>
        <h1>{props.titulo}</h1>
        <p>{props.descricao}</p>
      </div>
      {props.children && <div className="cabecalho-acoes">{props.children}</div>}
    </header>
  );
}

export const classeDoStatus = (status: number) => {
  if (status === 0 || status >= 500) return 'status status-falha';
  return status >= 400 ? 'status status-alerta' : 'status status-ok';
};

import { Check, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { ErroApi, Resultado } from '../api';
import type { Demo } from '../useDemo';
import { Avatar } from './comum';

const erroDoCampo = (erro: ErroApi | null, campo: string) =>
  erro?.detalhes.find((d) => d.campo === campo)?.mensagem;

function MensagemErro({ erro, campos }: { erro: ErroApi | null; campos: string[] }) {
  if (!erro) return null;
  const temDetalhe = erro.detalhes.some((d) => campos.includes(d.campo));
  return temDetalhe ? null : (
    <p className="mensagem mensagem-erro" role="alert">
      {erro.mensagem}
    </p>
  );
}

function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<ErroApi | null>(null);

  const enviar = async <T,>(acao: () => Promise<Resultado<T>>) => {
    setEnviando(true);
    const resultado = await acao();
    setEnviando(false);
    setErro(resultado.ok ? null : resultado.erro);
    return resultado.ok;
  };

  return { enviando, erro, enviar };
}

function Campo(props: {
  rotulo: string;
  id: string;
  valor: string;
  aoMudar: (valor: string) => void;
  erro?: string;
  placeholder?: string;
  inputMode?: 'decimal' | 'email';
}) {
  const idErro = `${props.id}-erro`;
  return (
    <div className="campo">
      <label htmlFor={props.id}>{props.rotulo}</label>
      <input
        id={props.id}
        value={props.valor}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        autoComplete="off"
        aria-invalid={Boolean(props.erro)}
        aria-describedby={props.erro ? idErro : undefined}
        onChange={(e) => props.aoMudar(e.target.value)}
      />
      {props.erro && (
        <p className="erro-campo" id={idErro}>
          {props.erro}
        </p>
      )}
    </div>
  );
}

export function NovoCliente({ demo }: { demo: Demo }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const { enviando, erro, enviar } = useEnvio();

  const aoEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (await enviar(() => demo.criarCliente(nome, email))) {
      setNome('');
      setEmail('');
    }
  };

  return (
    <form className="formulario" onSubmit={aoEnviar}>
      <Campo
        id="cliente-nome"
        rotulo="Nome"
        valor={nome}
        aoMudar={setNome}
        erro={erroDoCampo(erro, 'nome')}
      />
      <Campo
        id="cliente-email"
        rotulo="E-mail"
        inputMode="email"
        valor={email}
        aoMudar={setEmail}
        erro={erroDoCampo(erro, 'email')}
      />
      <MensagemErro erro={erro} campos={['nome', 'email']} />
      <button className="botao" type="submit" disabled={enviando}>
        {enviando ? 'Criando...' : 'Criar cliente'}
      </button>
    </form>
  );
}

export function NovaLoja({ demo }: { demo: Demo }) {
  const [nome, setNome] = useState('');
  const { enviando, erro, enviar } = useEnvio();

  const aoEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (await enviar(() => demo.criarLoja(nome))) setNome('');
  };

  return (
    <form className="nova-loja" onSubmit={aoEnviar}>
      <div className="nova-loja-linha">
        <label className="so-leitor" htmlFor="loja-nome">
          Nome da nova loja
        </label>
        <input
          id="loja-nome"
          value={nome}
          placeholder="Nome da nova loja"
          autoComplete="off"
          aria-invalid={Boolean(erro)}
          onChange={(e) => setNome(e.target.value)}
        />
        <button className="botao botao-icone" type="submit" disabled={enviando} title="Criar loja">
          <Plus size={18} aria-hidden="true" />
          <span className="so-leitor">Criar loja</span>
        </button>
      </div>
      {erro && (
        <p className="erro-campo" role="alert">
          {erroDoCampo(erro, 'nome') ?? erro.mensagem}
        </p>
      )}
    </form>
  );
}

export function ListaLojas({ demo }: { demo: Demo }) {
  if (!demo.lojas.length) {
    return <p className="mensagem">Nenhuma loja ainda. Crie uma abaixo ou prepare o cenário.</p>;
  }
  return (
    <ul className="lista-lojas">
      {demo.lojas.map((loja) => {
        const seguindo = demo.seguidas.includes(loja.id);
        return (
          <li key={loja.id}>
            <Avatar nome={loja.nome} />
            <span className="loja-nome">{loja.nome}</span>
            <button
              className={seguindo ? 'botao-seguir ativo' : 'botao-seguir'}
              type="button"
              aria-pressed={seguindo}
              aria-label={`${seguindo ? 'Deixar de seguir' : 'Seguir'} ${loja.nome}`}
              disabled={!demo.clienteAtivoId}
              onClick={() => demo.alternarSeguir(loja.id)}
            >
              {seguindo && <Check size={14} aria-hidden="true" />}
              {seguindo ? 'Seguindo' : 'Seguir'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const lerPreco = (texto: string) => {
  const limpo = texto.trim().replace(',', '.');
  if (!limpo) return undefined;
  const numero = Number(limpo);
  return Number.isNaN(numero) ? texto : numero;
};

export function Publicar({ demo }: { demo: Demo }) {
  const [lojaEscolhida, setLojaEscolhida] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [preco, setPreco] = useState('');
  const [retorno, setRetorno] = useState<string | null>(null);
  const { enviando, erro, enviar } = useEnvio();

  const lojaId = lojaEscolhida ?? demo.lojas[0]?.id ?? null;
  const caracteres = [...texto.trim()].length;

  const aoEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!lojaId) return;
    setRetorno(null);
    const sucesso = await enviar(() => demo.publicar(lojaId, { texto, preco: lerPreco(preco) }));
    if (!sucesso) return;
    setTexto('');
    setPreco('');
    if (demo.clienteAtivo && !demo.seguidas.includes(lojaId)) {
      setRetorno(
        `Publicada. ${demo.clienteAtivo.nome} não segue esta loja, então o feed não muda.`,
      );
    }
  };

  return (
    <form className="formulario" onSubmit={aoEnviar}>
      <div className="campo">
        <div className="campo-topo">
          <label htmlFor="publicar-texto">Texto</label>
          <span className={caracteres > 500 ? 'contador contador-acima' : 'contador'}>
            {caracteres}/500
          </span>
        </div>
        <textarea
          id="publicar-texto"
          rows={3}
          value={texto}
          aria-invalid={Boolean(erroDoCampo(erro, 'texto'))}
          onChange={(e) => setTexto(e.target.value)}
        />
        {erroDoCampo(erro, 'texto') && <p className="erro-campo">{erroDoCampo(erro, 'texto')}</p>}
      </div>
      <div className="campos-lado-a-lado">
        <div className="campo">
          <label htmlFor="publicar-loja">Loja</label>
          <select
            id="publicar-loja"
            value={lojaId ?? ''}
            disabled={!demo.lojas.length}
            onChange={(e) => setLojaEscolhida(Number(e.target.value))}
          >
            {demo.lojas.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome}
              </option>
            ))}
          </select>
        </div>
        <Campo
          id="publicar-preco"
          rotulo="Preço (opcional)"
          placeholder="19,90"
          inputMode="decimal"
          valor={preco}
          aoMudar={setPreco}
          erro={erroDoCampo(erro, 'preco')}
        />
      </div>
      <MensagemErro erro={erro} campos={['texto', 'preco']} />
      {retorno && (
        <p className="mensagem" role="status">
          {retorno}
        </p>
      )}
      <button className="botao botao-primario" type="submit" disabled={enviando || !lojaId}>
        {enviando ? 'Publicando...' : 'Publicar novidade'}
      </button>
    </form>
  );
}

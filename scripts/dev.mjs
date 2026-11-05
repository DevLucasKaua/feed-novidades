import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';

const usarShell = process.platform === 'win32';
const portaDaApi = process.env.PORT ?? '3000';
const urlDaApi = `http://localhost:${portaDaApi}`;
const processos = [];

const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function esperar(url, tentativas) {
  for (let i = 0; i < tentativas; i++) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1000) });
      return true;
    } catch {
      await dormir(500);
    }
  }
  return false;
}

const portaLivre = (porta) =>
  new Promise((resolver) => {
    const teste = createServer();
    teste.once('error', () => resolver(false));
    teste.listen(porta, 'localhost', () => teste.close(() => resolver(true)));
  });

async function primeiraPortaLivre(porta) {
  return (await portaLivre(porta)) ? porta : primeiraPortaLivre(porta + 1);
}

let encerrando = false;

function encerrar(codigo = 0) {
  if (encerrando) return;
  encerrando = true;
  process.exitCode = codigo;
  for (const processo of processos) processo.kill('SIGTERM');
}

function iniciar(args) {
  const processo = spawn('npm', args, { stdio: 'inherit', shell: usarShell });
  processo.once('exit', (codigo) => encerrar(codigo ?? 0));
  processos.push(processo);
}

process.once('SIGINT', () => encerrar());
process.once('SIGTERM', () => encerrar());

if (!existsSync('web/node_modules')) {
  console.log('\nInstalando as dependências da interface...\n');
  const instalacao = spawnSync('npm', ['--prefix', 'web', 'ci'], {
    stdio: 'inherit',
    shell: usarShell,
  });
  if (instalacao.status !== 0) process.exit(instalacao.status ?? 1);
}

iniciar(['run', 'dev:api']);
const apiNoAr = await esperar(`${urlDaApi}/documentation/json`, 60);
if (!apiNoAr && !encerrando) {
  console.log('\nA API ainda não respondeu. Confira se o banco está no ar: docker compose up -d\n');
}

const portaDaInterface = await primeiraPortaLivre(5173);
const urlDaInterface = `http://localhost:${portaDaInterface}`;
iniciar([
  '--prefix',
  'web',
  'run',
  'dev',
  '--',
  '--port',
  String(portaDaInterface),
  '--strictPort',
  '--open',
]);
const interfaceNoAr = await esperar(urlDaInterface, 20);

if (interfaceNoAr && !encerrando) {
  console.log(`
  Feed de Novidades

  Interface     ${urlDaInterface}
  API           ${urlDaApi}
  Documentação  ${urlDaApi}/documentation

  Ctrl+C encerra tudo.
`);
}

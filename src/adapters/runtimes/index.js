// Executores reais de código, todos isolados da página e dos dados da conta.
// js/ts: Web Worker · python: Pyodide em Worker · php: php-wasm · java: CheerpJ (JVM em WebAssembly, licença Community,
// carregada de cjrtnc.leaningtech.com) · sqlite: sql.js · postgres: PGlite (PostgreSQL 17).
import { CDN, carregarScript } from '../ui/cdn.js';
import { motorSqlJs } from '../sql/sqljs.js';
import { executorPhp } from '../code/executores.js';

const BASE = new URL('.', import.meta.url).href;

function trabalhador(arquivo) {
  let w = null;
  const pendentes = new Map();
  let ouvinte = null;
  let seq = 0;
  const criar = () => {
    w = new Worker(`${BASE}${arquivo}`);
    w.onmessage = (e) => {
      const m = e.data;
      if (m.tipo === 'resposta') { pendentes.get(m.id)?.(m); pendentes.delete(m.id); return; }
      ouvinte?.(m);
    };
    w.onerror = (e) => { e.preventDefault(); ouvinte?.({ tipo: 'fim', erro: e.message || 'Falha no executor.', testes: [] }); };
  };
  return {
    get vivo() { return !!w; },
    enviar(msg, aoMensagem) { if (!w) criar(); ouvinte = aoMensagem; w.postMessage(msg); },
    requisitar(msg) {
      if (!w) return Promise.resolve({ erro: 'Nenhum servidor em execução. Clique em Executar primeiro.' });
      const id = ++seq;
      return new Promise((ok) => {
        pendentes.set(id, ok);
        w.postMessage({ ...msg, tipo: 'requisicao', id });
        setTimeout(() => { if (pendentes.has(id)) { pendentes.delete(id); ok({ erro: 'Tempo esgotado (10 s) aguardando a resposta.' }); } }, 10000);
      });
    },
    parar() { w?.terminate(); w = null; pendentes.forEach((ok) => ok({ erro: 'Execução interrompida.' })); pendentes.clear(); },
  };
}

// Executa e devolve uma Promise com { erro?, testes, servidor }. aoEvento recebe { tipo: 'saida'|'status'|'imagem'|'limpar', ... }.
function comWorker(t, msg, aoEvento, limiteMs) {
  return new Promise((ok) => {
    let timer = null;
    if (limiteMs) timer = setTimeout(() => { t.parar(); ok({ erro: `Tempo esgotado (${limiteMs / 1000} s): há um laço infinito ou espera bloqueante?`, testes: [] }); }, limiteMs);
    t.enviar(msg, (m) => {
      if (m.tipo === 'fim') { clearTimeout(timer); ok(m); } else aoEvento(m);
    });
  });
}

export function executorJs() {
  const t = trabalhador('js-worker.js');
  return {
    async executar({ arquivos, entrada, arquivosTeste = [], expressoes = [] }, aoEvento) {
      t.parar();
      const r = await comWorker(t, { tipo: 'executar', arquivos, entrada, arquivosTeste, expressoes }, aoEvento, 8000);
      if (!r.servidor) t.parar();
      return r;
    },
    requisicao: (req) => t.requisitar(req),
    parar: () => t.parar(),
  };
}

export function executorPython() {
  const t = trabalhador('python-worker.js');
  return {
    executar: ({ arquivos, entrada, arquivosTeste = [], stdin }, aoEvento) => comWorker(t, { tipo: 'executar', arquivos, entrada, arquivosTeste, stdin }, aoEvento, 0),
    requisicao: (req) => t.requisitar(req),
    parar: () => t.parar(),
  };
}

export function executorPhpProjeto() {
  const php = executorPhp();
  return {
    async executar({ arquivos, entrada }, aoEvento) {
      aoEvento({ tipo: 'status', texto: 'Iniciando o PHP 8 (WebAssembly)…' });
      try {
        const r = await php.executar(arquivos[entrada]);
        aoEvento({ tipo: 'status', texto: '' });
        if (r.saida) aoEvento({ tipo: 'saida', texto: r.saida });
        return { erro: r.erro, testes: [], saida: r.saida };
      } catch (e) {
        aoEvento({ tipo: 'status', texto: '' });
        return { erro: `Não foi possível iniciar o PHP: ${e.message}`, testes: [] };
      }
    },
    parar() {},
  };
}

// Java de verdade: javac (tools.jar do JDK 8) + JVM do CheerpJ. A primeira compilação é lenta (~20–60 s).
let cheerpPronto = null;
let execJava = 0;
export function executorJava() {
  return {
    async executar({ arquivos, principal = 'Main' }, aoEvento) {
      const saidaEl = document.getElementById('console') ?? Object.assign(document.createElement('pre'), { id: 'console', hidden: true });
      if (!saidaEl.isConnected) document.body.append(saidaEl);
      cheerpPronto ??= (async () => {
        aoEvento({ tipo: 'status', texto: 'Baixando a JVM (CheerpJ) e o compilador javac — só na primeira vez…' });
        await carregarScript(CDN.cheerpj, 'cheerpjInit');
        await globalThis.cheerpjInit({ status: 'none' });
        const jar = new Uint8Array(await (await fetch('https://javafiddle.leaningtech.com/tools.jar')).arrayBuffer());
        globalThis.cheerpOSAddStringFile('/str/tools.jar', jar);
      })().catch((e) => { cheerpPronto = null; throw e; });
      try { await cheerpPronto; } catch (e) { aoEvento({ tipo: 'status', texto: '' }); return { erro: `Não foi possível carregar o Java: ${e.message}`, testes: [] }; }
      const n = ++execJava;
      const fontes = Object.keys(arquivos).filter((k) => k.endsWith('.java'));
      for (const f of fontes) globalThis.cheerpOSAddStringFile(`/str/r${n}/${f}`, arquivos[f]);
      saidaEl.textContent = '';
      let lido = 0;
      const obs = new MutationObserver(() => { const t = saidaEl.textContent; if (t.length > lido) { aoEvento({ tipo: 'saida', texto: t.slice(lido) }); lido = t.length; } });
      obs.observe(saidaEl, { childList: true, characterData: true, subtree: true });
      try {
        aoEvento({ tipo: 'status', texto: 'Compilando com javac…' });
        const c = await globalThis.cheerpjRunMain('com.sun.tools.javac.Main', '/str/tools.jar', '-encoding', 'UTF-8', '-d', `/files/r${n}/`, ...fontes.map((f) => `/str/r${n}/${f}`));
        if (c !== 0) { aoEvento({ tipo: 'status', texto: '' }); return { erro: 'Falha na compilação (veja as mensagens do javac acima).', testes: [] }; }
        aoEvento({ tipo: 'status', texto: '' });
        aoEvento({ tipo: 'saida', texto: '', nivel: 'info' });
        const codigo = await globalThis.cheerpjRunMain(principal, `/files/r${n}/`);
        await new Promise((r) => setTimeout(r, 50));
        return { erro: codigo ? `O programa terminou com código ${codigo}.` : undefined, testes: [], saida: saidaEl.textContent.slice(lido) };
      } finally { obs.disconnect(); }
    },
    parar() {},
  };
}

export function executorSql(motor) {
  let bancoPg = null;
  let bancoLite = null;
  return {
    async executar({ arquivos, entrada }, aoEvento) {
      const sql = arquivos[entrada];
      try {
        if (motor === 'postgres') {
          if (!bancoPg) { aoEvento({ tipo: 'status', texto: 'Iniciando o PostgreSQL 17 (WebAssembly)…' }); const { PGlite } = await import(CDN.pglite); bancoPg = new PGlite(); await bancoPg.waitReady; }
          aoEvento({ tipo: 'status', texto: '' });
          const rs = await bancoPg.exec(sql);
          return { testes: [], tabelas: rs.filter((r) => r.fields?.length).map((r) => ({ colunas: r.fields.map((f) => f.name), linhas: r.rows.map((x) => r.fields.map((f) => x[f.name])) })), afetadas: rs.reduce((s, r) => s + (r.affectedRows ?? 0), 0) };
        }
        bancoLite ??= await motorSqlJs().abrir();
        const r = bancoLite.executar(sql);
        return { testes: [], tabelas: r.resultados, afetadas: r.alteradas };
      } catch (e) {
        aoEvento({ tipo: 'status', texto: '' });
        return { erro: e.message, testes: [] };
      }
    },
    reiniciar() { bancoPg?.close?.(); bancoPg = null; bancoLite?.fechar?.(); bancoLite = null; },
    parar() {},
  };
}

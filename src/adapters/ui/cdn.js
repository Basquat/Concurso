// Bibliotecas de terceiros carregadas sob demanda do jsDelivr (versões fixas). Nada é baixado até ser usado.
import { esc } from './dom.js';

export const CDN = {
  mermaid: 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs',
  monaco: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  xterm: 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0',
  xtermFit: 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.js',
  yaml: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.mjs',
  bpmn: 'https://cdn.jsdelivr.net/npm/bpmn-js@17.11.1/dist',
  pglite: 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.3.3/dist/index.js',
  pyodide: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  babel: 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js',
  cheerpj: 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js',
};

const scripts = {};
export function carregarScript(url, nomeGlobal) {
  if (nomeGlobal && globalThis[nomeGlobal]) return Promise.resolve(globalThis[nomeGlobal]);
  return (scripts[url] ??= new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    // Scripts UMD não podem se registrar no carregador AMD do Monaco (senão não criam a variável global).
    const amd = globalThis.define;
    if (amd && !url.includes('monaco-editor')) globalThis.define = undefined;
    const restaurar = () => { if (amd && !url.includes('monaco-editor')) globalThis.define = amd; };
    s.onload = () => { restaurar(); ok(nomeGlobal ? globalThis[nomeGlobal] : true); };
    s.onerror = () => { restaurar(); delete scripts[url]; s.remove(); falha(new Error(`Não foi possível baixar um componente de ${new URL(url).hostname}. Verifique a conexão com a internet.`)); };
    document.head.append(s);
  }));
}

export function carregarCss(url) {
  if (document.querySelector(`link[data-cdn="${url}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = url;
  l.dataset.cdn = url;
  document.head.append(l);
}

export const temaEscuro = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);

// Diagramas Mermaid (fluxogramas, sequência, ER, classes, estados, Gantt) a partir de texto.
let temaMermaid = null;
let seq = 0;
export async function renderizarDiagramas(raiz) {
  const els = [...raiz.querySelectorAll('[data-mermaid]:not([data-pronto])')];
  if (!els.length) return;
  let mermaid;
  try { mermaid = (await import(CDN.mermaid)).default; } catch { return; }
  const tema = temaEscuro() ? 'dark' : 'neutral';
  if (tema !== temaMermaid) {
    mermaid.initialize({ startOnLoad: false, theme: tema, securityLevel: 'strict', fontFamily: 'Inter, system-ui, sans-serif', flowchart: { htmlLabels: true, curve: 'basis' } });
    temaMermaid = tema;
  }
  for (const el of els) {
    try {
      const { svg } = await mermaid.render(`mmd-${++seq}`, el.dataset.mermaid);
      el.innerHTML = svg;
      el.dataset.pronto = '1';
    } catch (e) {
      el.innerHTML = `<pre class="mini">${esc(el.dataset.mermaid)}</pre><p class="mini erro">Diagrama inválido: ${esc(e.message ?? e)}</p>`;
      el.dataset.pronto = 'erro';
    }
  }
}

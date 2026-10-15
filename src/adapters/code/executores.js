// Executores de código do estudante, sempre isolados da página:
//  - JavaScript: Web Worker descartável com limite de tempo (mata laços infinitos);
//  - PHP: interpretador oficial do PHP 8 compilado para WebAssembly (php-wasm), baixado sob demanda;
//  - Python: Pyodide (CPython compilado para WebAssembly), baixado sob demanda.

const WORKER = `
self.onmessage = (e) => {
  const { codigo, testes } = e.data;
  const saida = [];
  const fmt = (v) => typeof v === 'string' ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
  const consoleFalso = { log: (...a) => saida.push(a.map(fmt).join(' ')), info: (...a) => saida.push(a.map(fmt).join(' ')),
    warn: (...a) => saida.push('⚠ ' + a.map(fmt).join(' ')), error: (...a) => saida.push('✖ ' + a.map(fmt).join(' ')) };
  let avaliar;
  try {
    avaliar = new Function('console', codigo + '\\n;return (expr) => eval(expr);')(consoleFalso);
  } catch (err) {
    self.postMessage({ saida: saida.join('\\n'), erro: err.name + ': ' + err.message, testes: [] });
    return;
  }
  const resultados = (testes || []).map(([nome, expr]) => {
    try { return { nome, ok: avaliar(expr) === true }; } catch (err) { return { nome, ok: false, erro: err.message }; }
  });
  self.postMessage({ saida: saida.join('\\n'), testes: resultados });
};`;

/** @returns {import('../../application/ports.js').ExecutorCodigo} */
export const executorJs = ({ limiteMs = 3000 } = {}) => ({
  executar(codigo, { testes = [] } = {}) {
    const url = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
    const w = new Worker(url);
    return new Promise((ok) => {
      const fim = (r) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); ok(r); };
      const t = setTimeout(() => fim({ saida: '', erro: `Tempo esgotado (${limiteMs / 1000}s): há um laço infinito?`, testes: [] }), limiteMs);
      w.onmessage = (e) => fim(e.data);
      w.onerror = (e) => { e.preventDefault(); fim({ saida: '', erro: e.message, testes: [] }); };
      w.postMessage({ codigo, testes });
    });
  },
});

const PHP_WASM = 'https://cdn.jsdelivr.net/npm/php-wasm@0.2.0/PhpWeb.mjs';

/** @returns {import('../../application/ports.js').ExecutorCodigo} */
export const executorPhp = () => {
  let php;
  return {
    async executar(codigo) {
      if (!php) {
        const { PhpWeb } = await import(PHP_WASM);
        php = new PhpWeb();
        await php.binary;
      } else {
        await php.refresh();
      }
      let saida = '';
      let erro = '';
      const out = (e) => { saida += e.detail; };
      const err = (e) => { erro += e.detail; };
      php.addEventListener('output', out);
      php.addEventListener('error', err);
      try {
        await php.run(codigo);
      } finally {
        php.removeEventListener('output', out);
        php.removeEventListener('error', err);
      }
      return { saida, erro: erro.trim() || undefined };
    },
  };
};

const PYODIDE_URL = 'https://cdn.jsdelivr.net/npm/pyodide@0.27.5/dist/pyodide.mjs';

/** @returns {import('../../application/ports.js').ExecutorCodigo} */
export const executorPython = () => {
  let pyodide;
  return {
    async executar(codigo) {
      if (!pyodide) {
        const mod = await import(PYODIDE_URL);
        pyodide = await mod.loadIndexURL({ indexURL: 'https://cdn.jsdelivr.net/npm/pyodide@0.27.5/dist/' });
      }
      let saida = '';
      let erro = '';
      try {
        pyodide.globals.set('print', (...args) => { saida += args.map(v => String(v)).join(' ') + '\n'; });
        await pyodide.runPythonAsync(codigo);
      } catch (e) {
        erro = e.message || String(e);
      }
      return { saida: saida.trim(), erro: erro || undefined };
    },
  };
};
// Editor de código: Monaco (o mesmo do VS Code), carregado do jsDelivr. Sem internet, cai num editor simples
// com realce próprio. Cada arquivo é um "modelo" com histórico de desfazer independente.
import { CDN, carregarScript, temaEscuro } from './cdn.js';
import { realcar } from '../../domain/realce.js';

let monacoP = null;
export function carregarMonaco() {
  monacoP ??= (async () => {
    globalThis.MonacoEnvironment = {
      getWorkerUrl: () => URL.createObjectURL(new Blob([`self.MonacoEnvironment={baseUrl:'${CDN.monaco.replace(/vs$/, '')}'};importScripts('${CDN.monaco}/base/worker/workerMain.js');`], { type: 'text/javascript' })),
    };
    await carregarScript(`${CDN.monaco}/loader.js`);
    return new Promise((ok, falha) => {
      globalThis.require.config({ paths: { vs: CDN.monaco } });
      globalThis.require(['vs/editor/editor.main'], () => ok(globalThis.monaco), falha);
    });
  })().catch((e) => { monacoP = null; throw e; });
  return monacoP;
}

export const LINGUAGEM = (caminho) => {
  const ext = caminho.split('.').pop().toLowerCase();
  return ({ js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', php: 'php', java: 'java', kt: 'kotlin', dart: 'dart', sql: 'sql', html: 'html', htm: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown', yml: 'yaml', yaml: 'yaml', sh: 'shell', xml: 'xml', vue: 'html', txt: 'plaintext', properties: 'ini', toml: 'ini', ini: 'ini', dockerfile: 'dockerfile', c: 'c', cpp: 'cpp', cs: 'csharp', go: 'go', rb: 'ruby' })[ext] ?? (caminho.toLowerCase().endsWith('dockerfile') ? 'dockerfile' : 'plaintext');
};

/**
 * @param {HTMLElement} el
 * @param {{ aoMudar?: (caminho: string, valor: string) => void, aoExecutar?: () => void, aoSalvar?: () => void }} op
 */
export async function criarEditor(el, op = {}) {
  let monaco = null;
  try { monaco = await carregarMonaco(); } catch { monaco = null; }
  return monaco ? editorMonaco(el, monaco, op) : editorSimples(el, op);
}

function editorMonaco(el, monaco, { aoMudar, aoExecutar, aoSalvar }) {
  el.innerHTML = '';
  const ed = monaco.editor.create(el, {
    automaticLayout: true, theme: temaEscuro() ? 'vs-dark' : 'vs', fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: 14, fontLigatures: true,
    minimap: { enabled: el.clientWidth > 700 }, scrollBeyondLastLine: false, tabSize: 4, insertSpaces: true, renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true }, guides: { bracketPairs: true }, smoothScrolling: true, padding: { top: 10 }, wordWrap: 'off',
  });
  monaco.languages.typescript?.javascriptDefaults.setCompilerOptions({ target: 99, allowNonTsExtensions: true, checkJs: false, allowJs: true, jsx: 2 });
  monaco.languages.typescript?.typescriptDefaults.setCompilerOptions({ target: 99, allowNonTsExtensions: true, jsx: 2, strict: true, esModuleInterop: true, moduleResolution: 2 });
  const modelos = new Map();
  let atual = null;
  ed.onDidChangeModelContent(() => { if (atual) aoMudar?.(atual, ed.getValue()); });
  ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => aoExecutar?.());
  ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => aoSalvar?.());
  const tema = () => monaco.editor.setTheme(temaEscuro() ? 'vs-dark' : 'vs');
  addEventListener('tema-mudou', tema);
  return {
    tipo: 'monaco',
    monaco,
    abrir(caminho, conteudo) {
      let m = modelos.get(caminho);
      if (!m || m.isDisposed()) {
        const uri = monaco.Uri.parse(`file:///${caminho}`);
        m = monaco.editor.getModel(uri) ?? monaco.editor.createModel(conteudo, LINGUAGEM(caminho), uri);
        if (m.getValue() !== conteudo) m.setValue(conteudo);
        modelos.set(caminho, m);
      }
      atual = caminho;
      ed.setModel(m);
      ed.focus();
    },
    // Garante que todos os arquivos do projeto existam como modelos (IntelliSense entre arquivos).
    sincronizar(arquivos) {
      for (const [k, v] of Object.entries(arquivos)) {
        const m = modelos.get(k);
        if (!m) { const uri = monaco.Uri.parse(`file:///${k}`); const mm = monaco.editor.getModel(uri) ?? monaco.editor.createModel(v, LINGUAGEM(k), uri); modelos.set(k, mm); } else if (k !== atual && m.getValue() !== v) m.setValue(v);
      }
      for (const [k, m] of modelos) if (!(k in arquivos)) { m.dispose(); modelos.delete(k); }
    },
    fecharTodos() { for (const m of modelos.values()) m.dispose(); modelos.clear(); atual = null; },
    valor: () => ed.getValue(),
    marcadores(caminho, lista) {
      const m = modelos.get(caminho);
      if (m) monaco.editor.setModelMarkers(m, 'concurso-lab', lista.map((x) => ({ startLineNumber: x.linha, endLineNumber: x.linha, startColumn: 1, endColumn: 400, message: x.msg, severity: x.nivel === 'erro' ? 8 : x.nivel === 'aviso' ? 4 : 2 })));
    },
    formatar() { ed.getAction('editor.action.formatDocument')?.run(); },
    layout: () => ed.layout(),
    focar: () => ed.focus(),
    destruir() { removeEventListener('tema-mudou', tema); ed.dispose(); for (const m of modelos.values()) m.dispose(); },
  };
}

// Editor reserva (sem rede): textarea sobre um <pre> com realce.
function editorSimples(el, { aoMudar, aoExecutar, aoSalvar }) {
  el.innerHTML = '<div class="editor-sobreposto" style="height:100%"><pre class="numeros"></pre><div class="area"><pre aria-hidden="true"></pre><textarea spellcheck="false" wrap="off" aria-label="Editor de código"></textarea></div></div>';
  const ta = el.querySelector('textarea');
  const pre = el.querySelector('.area pre');
  const nums = el.querySelector('.numeros');
  const conteudos = {};
  let atual = null;
  const pintar = () => { pre.innerHTML = `${realcar(ta.value, atual?.split('.').pop() ?? '')}\n `; nums.textContent = ta.value.split('\n').map((_, i) => i + 1).join('\n'); pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; nums.scrollTop = ta.scrollTop; };
  ta.addEventListener('input', () => { conteudos[atual] = ta.value; aoMudar?.(atual, ta.value); pintar(); });
  ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; nums.scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); aoExecutar?.(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); aoSalvar?.(); }
  });
  return {
    tipo: 'simples',
    abrir(caminho, conteudo) { atual = caminho; conteudos[caminho] = conteudo; ta.value = conteudo; pintar(); ta.focus(); },
    sincronizar(arquivos) { Object.assign(conteudos, arquivos); },
    fecharTodos() { atual = null; },
    valor: () => ta.value,
    marcadores() {},
    formatar() {},
    layout() {},
    focar: () => ta.focus(),
    destruir() { el.innerHTML = ''; },
  };
}

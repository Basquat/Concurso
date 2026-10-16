// Pré-visualização web: monta um documento a partir dos arquivos do projeto (HTML, CSS, JS, JSX) e o carrega
// no runner/web.html, um iframe com sandbox (origem opaca: não lê cookies, IndexedDB nem dados da conta).

const PONTE = `(function(){var f=function(n){return function(){var a=[].slice.call(arguments).map(function(x){try{return typeof x==='string'?x:JSON.stringify(x)}catch(e){return String(x)}});parent.postMessage({tipo:'console',nivel:n,texto:a.join(' ')},'*');};};
console.log=f('log');console.info=f('log');console.warn=f('aviso');console.error=f('erro');
addEventListener('error',function(e){parent.postMessage({tipo:'console',nivel:'erro',texto:(e.message||'Erro')+(e.lineno?' (linha '+e.lineno+')':'')},'*');});
addEventListener('unhandledrejection',function(e){parent.postMessage({tipo:'console',nivel:'erro',texto:'Promise rejeitada: '+(e.reason&&e.reason.message||e.reason)},'*');});})();`;

const norm = (h) => h.replace(/^\.?\//, '').split('?')[0];

export function montarDocumento(arquivos, entrada = 'index.html') {
  let html = arquivos[entrada] ?? '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>';
  html = html.replace(/<link\b[^>]*href=["']([^"']+\.css)["'][^>]*>/gi, (m, href) => (arquivos[norm(href)] != null ? `<style data-arquivo="${norm(href)}">\n${arquivos[norm(href)]}\n</style>` : m));
  html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (m, a, src, b) => {
    const k = norm(src);
    if (arquivos[k] == null) return m;
    const attrs = `${a} ${b}`;
    const babel = /\.(jsx|tsx|ts)$/.test(k) || /text\/babel/.test(attrs);
    const modulo = /type=["']module/.test(attrs);
    const corpo = arquivos[k].replace(/<\/script/gi, '<\\/script');
    if (babel) return `<script type="text/babel" data-presets="${/\.tsx?$/.test(k) ? 'react,typescript' : 'react'}" data-filename="${k}">\n${corpo}\n</script>`;
    return `<script${modulo ? ' type="module"' : ''} data-arquivo="${k}">\n${corpo}\n</script>`;
  });
  const ponte = `<script>${PONTE}</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (h) => `${h}${ponte}`);
  return ponte + html;
}

// Cria (ou reaproveita) o iframe e carrega o documento. aoConsole recebe { nivel, texto }.
export function preVisualizar(caixa, arquivos, { entrada, aoConsole } = {}) {
  let frame = caixa.querySelector('iframe.preview');
  const html = montarDocumento(arquivos, entrada);
  if (frame) frame.remove();
  frame = document.createElement('iframe');
  frame.className = 'preview';
  frame.title = 'Pré-visualização do projeto';
  frame.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-popups');
  frame.src = new URL('../../../runner/web.html', import.meta.url).href;
  frame.style.cssText = 'width:100%;height:100%;border:0;background:#fff;display:block';
  const ouvir = (e) => {
    if (e.source !== frame.contentWindow) return;
    if (e.data?.tipo === 'runner-pronto') frame.contentWindow.postMessage({ tipo: 'carregar', html }, '*');
    if (e.data?.tipo === 'console') aoConsole?.(e.data);
  };
  addEventListener('message', ouvir);
  caixa.append(frame);
  return { frame, parar: () => { removeEventListener('message', ouvir); frame.remove(); } };
}

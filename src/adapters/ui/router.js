// Roteador por hash (#/...): funciona no GitHub Pages sem configuração de servidor e sobrevive a recarregar a página.
import { esc } from './dom.js';

// [padrão, carregador, opções] — cheia: página sem margens (laboratórios e ferramentas).
const ROTAS = [
  [/^\/?$/, () => import('./views/inicio.js')],
  [/^\/plano$/, () => import('./views/plano.js')],
  [/^\/areas$/, () => import('./views/areas.js')],
  [/^\/trilhas\/([\w-]+)$/, () => import('./views/trilha.js')],
  [/^\/questoes$/, () => import('./views/questoes.js')],
  [/^\/revisoes$/, () => import('./views/revisoes.js')],
  [/^\/flashcards$/, () => import('./views/flashcards.js')],
  [/^\/simulado$/, () => import('./views/simulado.js')],
  [/^\/laboratorios$/, () => import('./views/laboratorios.js')],
  [/^\/lab\/([\w-]+)$/, () => import('./views/lab.js'), { cheia: true }],
  [/^\/desktop$/, () => import('./views/desktop.js'), { cheia: true }],
  [/^\/concursos$/, () => import('./views/concursos.js')],
  [/^\/concursos\/([\w-]+)$/, () => import('./views/concurso.js')],
  [/^\/concursos\/([\w-]+)\/cargo\/([\w.]+)$/, () => import('./views/cargo.js')],
  [/^\/concursos\/([\w-]+)\/matriz$/, () => import('./views/matriz.js')],
  [/^\/aulas$/, () => import('./views/aulas.js')],
  [/^\/aulas\/([\w-]+)$/, () => import('./views/aula.js')],
  [/^\/conta$/, () => import('./views/conta.js')],
  [/^\/progresso$/, () => import('./views/progresso.js')],
  [/^\/sobre$/, () => import('./views/sobre.js')],
];

export function iniciarRoteador(el, ctx, { aoNavegar = () => {} } = {}) {
  let limpar = null;
  let geracao = 0;

  async function navegar() {
    const [caminho = '/', busca = ''] = location.hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(busca);
    const rota = ROTAS.find(([re]) => re.test(caminho));
    const g = ++geracao;
    if (typeof limpar === 'function') { try { limpar(); } catch (e) { console.error(e); } }
    limpar = null;
    document.querySelectorAll('dialog.modal').forEach((m) => m.close());
    aoNavegar(caminho || '/', rota?.[2] ?? {});
    if (!rota) {
      el.innerHTML = '<div class="vazio"><h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p></div>';
      return;
    }
    el.innerHTML = '<div class="carregando"><span class="gira"></span> Carregando…</div>';
    try {
      const mod = await rota[1]();
      if (g !== geracao) return;
      el.innerHTML = '';
      const r = await mod.default(el, ctx, { args: caminho.match(rota[0]).slice(1), params });
      if (g !== geracao) { if (typeof r === 'function') r(); return; }
      limpar = r;
    } catch (e) {
      console.error(e);
      if (g !== geracao) return;
      el.innerHTML = `<div class="aviso erro"><strong>Não foi possível abrir esta página.</strong><p class="mono pequeno">${esc(e.message)}</p><p class="mb0">Verifique a conexão e tente recarregar. Se o problema continuar, volte ao <a href="#/">início</a>.</p></div>`;
    }
    if (!params.has('sem-foco')) el.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  addEventListener('hashchange', navegar);
  navegar();
  return { recarregar: navegar, sair: () => { removeEventListener('hashchange', navegar); if (typeof limpar === 'function') limpar(); } };
}

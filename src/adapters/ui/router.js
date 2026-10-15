// Roteador por hash (#/...): funciona no GitHub Pages sem configuração de servidor e sobrevive a recarregar a página.
import { $$, esc } from './dom.js';

const ROTAS = [
  [/^\/?$/, () => import('./views/inicio.js')],
  [/^\/trilhas\/([\w-]+)$/, () => import('./views/trilha.js')],
  [/^\/questoes$/, () => import('./views/questoes.js')],
  [/^\/simulado$/, () => import('./views/simulado.js')],
  [/^\/laboratorios$/, () => import('./views/laboratorios.js')],
  [/^\/lab\/([\w-]+)$/, () => import('./views/lab.js')],
  [/^\/concursos$/, () => import('./views/concursos.js')],
  [/^\/concursos\/([\w-]+)$/, () => import('./views/concurso.js')],
  [/^\/concursos\/([\w-]+)\/cargo\/([\w.]+)$/, () => import('./views/cargo.js')],
  [/^\/concursos\/([\w-]+)\/matriz$/, () => import('./views/matriz.js')],
  [/^\/progresso$/, () => import('./views/progresso.js')],
  [/^\/sobre$/, () => import('./views/sobre.js')],
];

// Marca no menu o link cujo destino é o prefixo mais longo da rota atual.
function marcarMenu(caminho) {
  const links = $$('.lateral a');
  let melhor = null;
  for (const a of links) {
    const alvo = a.getAttribute('href').replace(/^#/, '');
    const casa = alvo === '/' ? caminho === '/' || caminho === '' : caminho === alvo || caminho.startsWith(`${alvo}/`);
    if (casa && (!melhor || alvo.length > melhor.alvo.length)) melhor = { a, alvo };
  }
  if (!melhor && caminho.startsWith('/lab/')) melhor = { a: links.find((a) => a.getAttribute('href') === '#/laboratorios') };
  links.forEach((a) => (a === melhor?.a ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
}

export function iniciarRoteador(el, ctx) {
  let limpar = null;
  let geracao = 0;

  async function navegar() {
    const [caminho, busca = ''] = location.hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(busca);
    const rota = ROTAS.find(([re]) => re.test(caminho));
    const g = ++geracao;
    if (typeof limpar === 'function') limpar();
    limpar = null;
    $$('.modal').forEach((m) => m.remove());
    marcarMenu(caminho || '/');
    if (!rota) { el.innerHTML = '<h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p>'; return; }
    try {
      const mod = await rota[1]();
      if (g !== geracao) return;
      el.innerHTML = '';
      limpar = await mod.default(el, ctx, { args: caminho.match(rota[0]).slice(1), params });
      if (g !== geracao && typeof limpar === 'function') limpar();
    } catch (e) {
      console.error(e);
      el.innerHTML = `<div class="aviso erro"><strong>Não foi possível abrir esta página.</strong><p class="mono pequeno">${esc(e.message)}</p><p>Verifique a conexão e tente recarregar.</p></div>`;
    }
    el.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  addEventListener('hashchange', navegar);
  navegar();
}

// Roteador por hash (#/...): funciona no GitHub Pages sem configuração de servidor.
import { $$, esc } from './dom.js';

const ROTAS = [
  [/^\/?$/, () => import('./views/inicio.js')],
  [/^\/trilhas\/([\w-]+)$/, () => import('./views/trilha.js')],
  [/^\/questoes$/, () => import('./views/questoes.js')],
  [/^\/simulado$/, () => import('./views/simulado.js')],
  [/^\/laboratorios$/, () => import('./views/laboratorios.js')],
  [/^\/lab\/([\w-]+)$/, () => import('./views/lab.js')],
  [/^\/concursos$/, () => import('./views/concursos.js')],
  [/^\/progresso$/, () => import('./views/progresso.js')],
  [/^\/sobre$/, () => import('./views/sobre.js')],
];

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
    const secao = caminho.split('/')[1] ?? '';
    $$('.nav a').forEach((a) => a.classList.toggle('ativo', a.dataset.rota === secao || (secao === 'lab' && a.dataset.rota === 'laboratorios') || (secao === 'trilhas' && a.dataset.rota === '')));
    if (!rota) { el.innerHTML = '<h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p>'; return; }
    try {
      const mod = await rota[1]();
      if (g !== geracao) return;
      el.innerHTML = '';
      limpar = await mod.default(el, ctx, { args: caminho.match(rota[0]).slice(1), params });
      if (g !== geracao && typeof limpar === 'function') limpar();
    } catch (e) {
      console.error(e);
      el.innerHTML = `<div class="callout err"><strong>Erro ao abrir a página.</strong><br><span class="mono pequeno">${esc(e.message)}</span></div>`;
    }
    el.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  addEventListener('hashchange', navegar);
  navegar();
}

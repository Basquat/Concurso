// Catálogo de laboratórios por área, com filtros (área, tipo de execução, nível) e busca.
import { esc, ic, cabecalho } from '../dom.js';
import { LABS, SELO_REAL, NIVEL, categoria, CATEGORIAS } from '../labs/registro.js';
import { AREAS } from '../../../domain/areas.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function laboratorios(el, { servico, casca }, { params }) {
  casca?.definirTitulo('Laboratórios e práticas');
  const f = { area: params.get('area') ?? '', real: '', busca: '' };
  const missoesDe = (id) => Object.keys(servico.progresso.missoes).filter((k) => k.startsWith(`${id}/`)).length;
  const ids = Object.keys(LABS);
  const areas = [...new Set(ids.map((id) => LABS[id].area))];
  const reais = ids.filter((id) => LABS[id].real === 'real').length;
  const porCat = (c) => ids.filter((id) => categoria(id) === c).length;
  const paraArea = areas.map((area) => [area, ids.filter((id) => LABS[id].area === area).length]);
  const enderecos = (ar) => `Todas as áreas: #/laboratorios${ar ? `?area=${encodeURIComponent(ar)}` : ''}`;

  const cartao = (id) => {
    const l = LABS[id];
    const [tipo, txt] = SELO_REAL[l.real] ?? SELO_REAL.simulado;
    const m = missoesDe(id);
    return `<a class="card cartao-lab" href="#/lab/${esc(id)}">
      <div class="linha entre"><span class="chip-area" style="--cor:${AREAS[l.area]?.cor}">${ic(l.icone ?? 'frasco')}</span><span class="linha" style="gap:6px">${l.novo ? '<span class="tag prim">novo</span>' : ''}<span class="tag ${tipo}">${txt}</span></span></div>
      <h3>${esc(l.nome)}</h3><p>${esc(l.resumo)}</p>
      <div class="rodape-card"><span>${esc(NIVEL[l.nivel] ?? '')}</span>${m ? `<span class="ok">${ic('okCirculo')} ${m} missão(ões)</span>` : ''}</div></a>`;
  };

  const render = () => {
    const termos = norm(f.busca).split(/\s+/).filter(Boolean);
    const vis = ids.filter((id) => (!f.area || LABS[id].area === f.area) && (!f.real || LABS[id].real === f.real) && termos.every((t) => norm(`${LABS[id].nome} ${LABS[id].resumo}`).includes(t)));
    // Agrupa pelo que o item é de verdade (laboratório, simulador, exercício) e, dentro disso, por área.
    el.querySelector('#grade').innerHTML = Object.entries(CATEGORIAS).filter(([c]) => vis.some((id) => categoria(id) === c)).map(([c, [titulo, texto]]) => `
      <h2 class="mt3 mb0">${esc(titulo)}</h2><p class="pequeno muted">${esc(texto)}</p>
      ${areas.filter((a) => vis.some((id) => categoria(id) === c && LABS[id].area === a)).map((a) => `
      <div class="secao-titulo"><span class="chip-area" style="--cor:${AREAS[a]?.cor}">${ic(AREAS[a]?.icone ?? 'frasco')}</span><h3 style="font-size:1rem;margin:0">${esc(AREAS[a]?.nome ?? a)}</h3><span class="linha-fina"></span></div>
      <div class="grid">${vis.filter((id) => categoria(id) === c && LABS[id].area === a).map(cartao).join('')}</div>`).join('')}`).join('') || `<div class="vazio">${ic('busca')}<p>Nenhum laboratório com esses filtros.</p></div>`;
    el.querySelectorAll('[data-area]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === f.area)));
    el.querySelectorAll('[data-real]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.real === f.real)));
  };

  el.innerHTML = `${cabecalho({ sobre: 'Praticar', titulo: 'Laboratórios e práticas', texto: `${porCat('laboratorio')} laboratórios técnicos (${reais} com a tecnologia real rodando no navegador), ${porCat('simulador')} simuladores de rotinas profissionais e ${porCat('exercicio')} exercícios aplicados. Cada item diz o que é real e o que é simulado.` })}
    <div class="grid peq mb3">${paraArea.map(([a, n]) => `<a class="card" href="#/laboratorios?area=${encodeURIComponent(a)}"><span class="chip-area" style="--cor:${AREAS[a]?.cor}">${ic(AREAS[a]?.icone ?? 'frasco')}</span><h3 class="mt1 mb0">${esc(AREAS[a]?.curto ?? a)}</h3><span class="mini sutil">${n} prática(s)</span></a>`).join('')}</div>
    <div class="filtros"><input type="search" id="buscaLab" placeholder="Buscar laboratório..." style="max-width:260px">
      <button class="filtro" type="button" data-area="">Todas as áreas</button>${areas.map((a) => `<button class="filtro" type="button" data-area="${a}">${esc(AREAS[a]?.curto ?? a)}</button>`).join('')}</div>
    <div class="filtros"><button class="filtro" type="button" data-real="">Todos</button>${Object.entries(SELO_REAL).map(([k, [, t]]) => `<button class="filtro" type="button" data-real="${k}">${t}</button>`).join('')}</div>
    <div id="grade"></div>`;
  el.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { f.area = b.dataset.area; render(); }));
  if (f.area && !areas.includes(f.area)) f.area = '';
  el.querySelectorAll('[data-real]').forEach((b) => b.addEventListener('click', () => { f.real = b.dataset.real; render(); }));
  el.querySelector('#buscaLab').addEventListener('input', (e) => { f.busca = e.target.value; render(); });
  render();
}

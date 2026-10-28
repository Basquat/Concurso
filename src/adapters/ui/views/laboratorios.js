// Catálogo de laboratórios por área, com filtros (área, tipo de execução, nível) e busca.
import { esc, ic, cabecalho } from '../dom.js';
import { LABS, SELO_REAL, NIVEL } from '../labs/registro.js';
import { AREAS } from '../../../domain/areas.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function laboratorios(el, { servico, casca }, { params }) {
  casca?.definirTitulo('Laboratórios');
  const f = { area: params.get('area') ?? '', real: '', busca: '' };
  const missoesDe = (id) => Object.keys(servico.progresso.missoes).filter((k) => k.startsWith(`${id}/`)).length;
  const ids = Object.keys(LABS);
  const areas = [...new Set(ids.map((id) => LABS[id].area))];
  const reais = ids.filter((id) => LABS[id].real === 'real').length;
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
    el.querySelector('#grade').innerHTML = areas.filter((a) => vis.some((id) => LABS[id].area === a)).map((a) => `
      <div class="secao-titulo"><span class="chip-area" style="--cor:${AREAS[a]?.cor}">${ic(AREAS[a]?.icone ?? 'frasco')}</span><h2 style="font-size:1.1rem">${esc(AREAS[a]?.nome ?? a)}</h2><span class="linha-fina"></span></div>
      <div class="grid">${vis.filter((id) => LABS[id].area === a).map(cartao).join('')}</div>`).join('') || `<div class="vazio">${ic('busca')}<p>Nenhum laboratório com esses filtros.</p></div>`;
    el.querySelectorAll('[data-area]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === f.area)));
    el.querySelectorAll('[data-real]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.real === f.real)));
  };

  el.innerHTML = `${cabecalho({ sobre: 'Praticar', titulo: 'Laboratórios', texto: `${ids.length} ambientes práticos, ${reais} com a tecnologia real rodando no seu navegador. Cada um tem missões guiadas, referência rápida e indica com transparência o que é real e o que é simulado.` })}
    <div class="grade-2 mb3">
      <a class="card destaque" href="#/lab/code"><div class="linha" style="gap:14px"><span class="chip-area g">${ic('codigo')}</span><div><h3 class="mt0 mb0">Code Studio</h3><p class="pequeno muted mb0">Editor do VS Code com Python, Java, PHP, JS/TS, SQL, React, Vue, Flask e FastAPI executando de verdade.</p></div></div></a>
      <a class="card destaque" href="#/desktop"><div class="linha" style="gap:14px"><span class="chip-area g" style="--cor:var(--c-adm)">${ic('painel')}</span><div><h3 class="mt0 mb0">Desktop virtual</h3><p class="pequeno muted mb0">Um dia de trabalho de dev: VS Code, terminal, console de nuvem, Jira e equipe — sozinho ou em dupla.</p></div></div></a>
    </div>
    <div class="grid peq mb3">${paraArea.map(([a, n]) => `<a class="card" href="#/laboratorios?area=${encodeURIComponent(a)}"><span class="chip-area" style="--cor:${AREAS[a]?.cor}">${ic(AREAS[a]?.icone ?? 'frasco')}</span><h3 class="mt1 mb0">${esc(AREAS[a]?.curto ?? a)}</h3><span class="mini sutil">${n} laboratório(s)</span></a>`).join('')}</div>
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

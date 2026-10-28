// Visão geral de todas as áreas: aulas, questões e laboratórios ativos e acessíveis.
import { esc, ic, cabecalho } from '../dom.js';
import { AREAS } from '../../../domain/areas.js';
import { LABS } from '../labs/registro.js';

export default async function areas(el, { acervo, casca }) {
  casca?.definirTitulo('Mapa de áreas');
  const [indice, questoes] = await Promise.all([acervo.indice(), acervo.questoes()]);
  const mapa = Object.entries(AREAS).filter(([id]) => id !== 'outras').map(([id, area]) => {
    const aulas = indice.aulas.filter((a) => a.area === id);
    const qs = questoes.filter((q) => q.area === id || (id === 'adm-publica' && q.area === 'direito'));
    const labs = Object.entries(LABS).filter(([, l]) => l.area === id);
    return { id, area, aulas, questoes: qs.length, labs };
  }).filter((x) => x.aulas.length || x.questoes || x.labs.length);
  const totais = {
    aulas: mapa.reduce((n, x) => n + x.aulas.length, 0),
    slides: mapa.reduce((n, x) => n + x.aulas.reduce((s, a) => s + a.slides, 0), 0),
    cartoes: mapa.reduce((n, x) => n + x.aulas.reduce((s, a) => s + a.cartoes, 0), 0),
    questoes: mapa.reduce((n, x) => n + x.questoes, 0),
    labs: mapa.reduce((n, x) => n + x.labs.length, 0),
  };
  el.innerHTML = `${cabecalho({ sobre: 'Acervo de estudo', titulo: 'Mapa de todas as áreas', texto: 'Conteúdo contado do catálogo realmente carregado pelo app. Abra qualquer área sem precisar definir cargo; o filtro de edital é opcional.' })}
    <div class="grade-4 mb3"><div class="card"><strong>${totais.aulas}</strong><div class="mini sutil">aulas</div></div><div class="card"><strong>${totais.slides}</strong><div class="mini sutil">slides</div></div><div class="card"><strong>${totais.questoes}</strong><div class="mini sutil">questões válidas</div></div><div class="card"><strong>${totais.labs}</strong><div class="mini sutil">laboratórios registrados</div></div></div>
    <div class="filtros"><a class="btn primario" href="#/aulas">${ic('slides')} Abrir todas as aulas</a><a class="btn" href="#/questoes">${ic('questoes')} Praticar questões</a><a class="btn" href="#/laboratorios">${ic('frasco')} Explorar laboratórios</a></div>
    <div class="grade-2">${mapa.map(({ id, area, aulas, questoes: qn, labs }) => `<section class="card area-mapa" style="--cor-area:${area.cor}">
      <div class="linha entre topo-al"><div class="linha nw"><span class="chip-area">${ic(area.icone)}</span><div><h2 class="mt0 mb0">${esc(area.nome)}</h2><span class="mini sutil">${aulas.length} aulas · ${qn} questões · ${labs.length} laboratórios</span></div></div><a class="btn peq" href="#/aulas?area=${encodeURIComponent(id)}">Estudar área</a></div>
      <div class="area-mapa-detalhe"><div><strong>Trilha</strong><div class="mini sutil">${aulas.slice().sort((a, b) => a.ordem - b.ordem).slice(0, 4).map((a) => `<a href="#/aulas/${encodeURIComponent(a.id)}">${esc(a.titulo)}</a>`).join(' · ') || 'Conteúdo em preparação'}</div></div>
      <div class="linha"><a href="#/questoes?area=${encodeURIComponent(id)}">${ic('questoes')} ${qn} questões</a><a href="#/laboratorios?area=${encodeURIComponent(id)}">${ic('frasco')} ${labs.length} laboratório(s)</a>${labs.map(([labId, l]) => `<a href="#/lab/${encodeURIComponent(labId)}">${ic(l.icone ?? 'frasco')} ${esc(l.nome)}</a>`).join('')}</div></div></section>`).join('')}</div>
    <div class="aviso info mt3">O acervo combina trilhas comuns, módulos especializados e práticas por área. Selecione um cargo na página inicial para ver o filtro do edital; nenhuma trilha desaparece do modo geral.</div>`;
}

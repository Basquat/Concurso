// Catálogo de aulas do cargo da conta: uma trilha por matéria da prova (na ordem do peso no edital),
// com progresso, "continuar de onde parei", filtros por situação e busca.
import { esc, ic, cabecalho, barra, pct } from '../dom.js';
import { AREAS, provaPorArea } from '../../../domain/areas.js';
import { cargoAlvo, semCargo } from '../componentes/cargo.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function aulas(el, { conteudo, servico, casca }, { params }) {
  casca?.definirTitulo('Aulas');
  if (semCargo(el, servico, 'Aulas em slides')) return;
  const [{ aulas: lista }, concurso] = await Promise.all([conteudo.indice(), conteudo.concurso(servico.progresso.alvo.concurso).catch(() => null)]);
  const cargo = concurso && cargoAlvo(servico.progresso, concurso);
  const prova = provaPorArea(cargo);
  const peso = (area) => prova.filter((d) => d.area === area).reduce((s, d) => s + d.pontos, 0);
  const areas = [...new Set(lista.map((a) => a.area))].sort((x, y) => peso(y) - peso(x));
  const f = { area: params.get('area') ?? '', situacao: '', busca: '' };

  const situacao = (a) => {
    const p = servico.progresso.aulas?.[a.id];
    return p?.concluida ? 'concluida' : p?.visto ? 'andamento' : 'nova';
  };

  const cartao = (a, n) => {
    const p = servico.progresso.aulas?.[a.id];
    const s = situacao(a);
    return `<a class="card cartao-lab" href="#/aulas/${esc(a.id)}">
      <div class="linha entre"><span class="tag ${s === 'concluida' ? 'ok' : s === 'andamento' ? 'aviso' : ''}">${s === 'concluida' ? `${ic('ok')} Concluída` : s === 'andamento' ? 'Em andamento' : `Aula ${n}`}</span><span class="mini sutil">${a.slides} slides · ~${a.duracao} min</span></div>
      <h3>${esc(a.titulo)}</h3><p>${esc(a.resumo)}</p>
      ${p?.visto ? barra(pct(Math.min(p.visto, a.slides), a.slides), p.concluida ? 'ok fina' : 'fina') : ''}
      <div class="rodape-card">${a.disciplina && a.disciplina !== AREAS[a.area]?.nome ? `<span>${esc(a.disciplina)}</span>` : ''}${a.cartoes ? `<span>${ic('cartoes')} ${a.cartoes}</span>` : ''}${a.quizzes ? `<span>${ic('questoes')} ${a.quizzes} quiz</span>` : ''}${a.labs.length ? `<span>${ic('frasco')} ${a.labs.length} lab</span>` : ''}</div></a>`;
  };

  const render = () => {
    const termos = norm(f.busca).split(/\s+/).filter(Boolean);
    const feitas = lista.filter((a) => situacao(a) === 'concluida').length;
    el.querySelector('#lista').innerHTML = areas.filter((ar) => !f.area || ar === f.area).map((area) => {
      const trilha = lista.filter((a) => a.area === area).sort((x, y) => x.ordem - y.ordem || x.titulo.localeCompare(y.titulo));
      const vis = trilha.filter((a) => (!f.situacao || situacao(a) === f.situacao) && termos.every((t) => norm(`${a.titulo} ${a.disciplina} ${a.resumo} ${a.busca}`).includes(t)));
      if (!vis.length) return '';
      const ar = AREAS[area];
      const ok = trilha.filter((a) => situacao(a) === 'concluida').length;
      const prox = trilha.find((a) => situacao(a) === 'andamento') ?? trilha.find((a) => situacao(a) === 'nova');
      const q = prova.filter((d) => d.area === area).reduce((s, d) => s + d.questoes, 0);
      return `<div class="secao-titulo"><span class="chip-area" style="--cor:${ar?.cor}">${ic(ar?.icone ?? 'livro')}</span><div><h2 style="font-size:1.1rem">${esc(ar?.nome ?? area)}</h2><span class="mini sutil">${ok} de ${trilha.length} aulas concluídas${q ? ` · ${q} questões na sua prova (${peso(area)} pontos)` : ''}</span></div><span class="linha-fina"></span>${prox ? `<a class="btn peq primario" href="#/aulas/${esc(prox.id)}">${ic('play')} ${situacao(prox) === 'andamento' ? 'Continuar' : 'Próxima aula'}</a>` : `<span class="tag ok">${ic('ok')} trilha concluída</span>`}</div>
        <div class="mb2">${barra(pct(ok, trilha.length), 'fina')}</div>
        <div class="grid">${vis.map((a) => cartao(a, trilha.indexOf(a) + 1)).join('')}</div>`;
    }).join('') || `<div class="vazio">${ic('busca')}<p>${lista.length ? 'Nenhuma aula com esses filtros.' : 'Ainda não há aulas para as disciplinas do seu cargo.'}</p></div>`;
    el.querySelector('#resumoAulas').innerHTML = `${feitas} de ${lista.length} aulas concluídas`;
    el.querySelectorAll('[data-area]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === f.area)));
    el.querySelectorAll('[data-sit]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sit === f.situacao)));
  };

  el.innerHTML = `${cabecalho({ sobre: 'Estudar', titulo: 'Aulas em slides', texto: `Trilhas das disciplinas da prova de ${esc(cargo ? `${cargo.codigo} – ${cargo.nome}` : 'seu cargo')}, na ordem do peso no edital. Cada aula tem resumo para leitura, quiz, flashcards, questões comentadas e prática.` })}
    <div class="filtros">
      <input type="search" id="buscaAula" placeholder="Buscar aula..." style="max-width:260px">
      <span class="espaco"></span><span class="pequeno muted" id="resumoAulas"></span>
    </div>
    <div class="filtros"><button class="filtro" type="button" data-area="">Todas as matérias</button>${areas.map((a) => `<button class="filtro" type="button" data-area="${esc(a)}">${esc(AREAS[a]?.curto ?? a)}</button>`).join('')}
      <span style="width:12px"></span>${[['', 'Todas'], ['nova', 'Novas'], ['andamento', 'Em andamento'], ['concluida', 'Concluídas']].map(([k, n]) => `<button class="filtro" type="button" data-sit="${k}">${n}</button>`).join('')}</div>
    <div id="lista"></div>`;
  el.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { f.area = b.dataset.area; render(); }));
  el.querySelectorAll('[data-sit]').forEach((b) => b.addEventListener('click', () => { f.situacao = b.dataset.sit; render(); }));
  el.querySelector('#buscaAula').addEventListener('input', (e) => { f.busca = e.target.value; render(); });
  render();
}

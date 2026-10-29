// Catálogo geral de aulas por área: progresso, continuação, filtros e seleção opcional por edital.
import { esc, ic, cabecalho, barra, pct } from '../dom.js';
import { AREAS, provaPorArea } from '../../../domain/areas.js';
import { cargoAlvo, rotuloCargo } from '../componentes/cargo.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function aulas(el, { conteudo, acervo, servico, casca, sessao }, { params }) {
  casca?.definirTitulo('Aulas');
  const [todos, questoes, concurso] = await Promise.all([
    acervo.indice(), acervo.questoes().catch(() => []),
    servico.progresso.alvo ? conteudo.concurso(servico.progresso.alvo.concurso).catch(() => null) : Promise.resolve(null),
  ]);
  const cargo = concurso && cargoAlvo(servico.progresso, concurso);
  const prova = provaPorArea(cargo);
  const peso = (area) => prova.filter((d) => d.area === area).reduce((s, d) => s + d.pontos, 0);
  const escopoSalvo = sessao.ler('config')?.escopoEstudo ?? 'todos';
  const f = { area: params.get('area') ?? '', situacao: '', busca: '', escopo: cargo && escopoSalvo === 'cargo' ? 'cargo' : 'todos' };
  let lista = todos.aulas;
  let areas = [];

  const aplicarEscopo = async () => {
    const cfg = { ...(sessao.ler('config') ?? {}), escopoEstudo: f.escopo };
    sessao.gravar('config', cfg);
    lista = f.escopo === 'cargo' && cargo ? (await conteudo.indice()).aulas : todos.aulas;
    areas = [...new Set(lista.map((a) => a.area))].sort((x, y) => peso(y) - peso(x));
    if (f.area && !areas.includes(f.area)) f.area = '';
  };
  await aplicarEscopo();

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
    const blocos = areas.filter((ar) => !f.area || ar === f.area).map((area) => {
      const trilha = lista.filter((a) => a.area === area).sort((x, y) => x.ordem - y.ordem || x.titulo.localeCompare(y.titulo));
      const vis = trilha.filter((a) => (!f.situacao || situacao(a) === f.situacao) && termos.every((t) => norm(`${a.titulo} ${a.disciplina} ${a.resumo} ${a.busca}`).includes(t)));
      if (!vis.length) return '';
      const ar = AREAS[area];
      const ok = trilha.filter((a) => situacao(a) === 'concluida').length;
      const prox = trilha.find((a) => situacao(a) === 'andamento') ?? trilha.find((a) => situacao(a) === 'nova');
      const q = prova.filter((d) => d.area === area).reduce((s, d) => s + d.questoes, 0);
      return `<section class="trilha-area"><div class="secao-titulo"><span class="chip-area" style="--cor:${ar?.cor}">${ic(ar?.icone ?? 'livro')}</span><div><h2 style="font-size:1.1rem">${esc(ar?.nome ?? area)}</h2><span class="mini sutil">${ok} de ${trilha.length} aulas concluídas${q ? ` · ${q} questões no edital (${peso(area)} pontos)` : ''}</span></div><span class="linha-fina"></span>${prox ? `<a class="btn peq primario" href="#/aulas/${esc(prox.id)}">${ic('play')} ${situacao(prox) === 'andamento' ? 'Continuar' : 'Próxima aula'}</a>` : `<span class="tag ok">${ic('ok')} trilha concluída</span>`}</div>
        <div class="mb2">${barra(pct(ok, trilha.length), 'fina')}</div><div class="grid">${vis.map((a) => cartao(a, trilha.indexOf(a) + 1)).join('')}</div></section>`;
    }).join('');
    el.querySelector('#lista').innerHTML = blocos || `<div class="vazio">${ic('busca')}<p>${lista.length ? 'Nenhuma aula com esses filtros.' : 'Nenhuma aula disponível neste escopo.'}</p></div>`;
    el.querySelector('#resumoAulas').textContent = `${feitas} de ${lista.length} aulas concluídas`;
    el.querySelector('#filtroArea').innerHTML = `<button class="filtro" type="button" data-area="">Todas as matérias</button>${areas.map((a) => `<button class="filtro" type="button" data-area="${esc(a)}">${esc(AREAS[a]?.curto ?? a)}</button>`).join('')}`;
    el.querySelectorAll('[data-area]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.area === f.area));
      b.addEventListener('click', () => { f.area = b.dataset.area; render(); });
    });
    el.querySelectorAll('[data-sit]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sit === f.situacao)));
    const escopo = el.querySelector('#escopoAulas');
    if (escopo) escopo.value = f.escopo;
  };

  el.innerHTML = `${cabecalho({ sobre: 'Estudar', titulo: 'Aulas e trilhas por área', texto: `Acervo completo${cargo ? ` · edital-alvo: ${esc(rotuloCargo(cargo))}` : ''}. Filtre por área, procure qualquer assunto e acompanhe slides, quizzes, cartões e práticas vinculadas.` })}
    <div class="area-resumo mb3"><div><strong>${todos.aulas.length} aulas</strong><span>${new Set(todos.aulas.map((a) => a.area)).size} áreas · ${todos.aulas.reduce((s, a) => s + a.slides, 0)} slides · ${todos.aulas.reduce((s, a) => s + a.cartoes, 0)} flashcards · ${questoes.length} questões válidas</span></div><a class="btn primario" href="#/areas">${ic('grade')} Mapa de áreas</a></div>
    ${cargo ? `<div class="filtros"><label class="campo" style="max-width:300px">Escopo do estudo<select id="escopoAulas"><option value="todos">Todas as áreas</option><option value="cargo">Meu edital — ${esc(rotuloCargo(cargo))}</option></select></label><span class="mini sutil">A escolha também vale para questões, simulados e flashcards.</span></div>` : '<div class="aviso info mb2">Você está vendo o acervo completo. Escolha um cargo no Início para filtrar por edital.</div>'}
    <div class="filtros"><input type="search" id="buscaAula" placeholder="Buscar aula, disciplina ou assunto..." style="max-width:320px"><span class="espaco"></span><span class="pequeno muted" id="resumoAulas"></span></div>
    <div class="filtros" id="filtroArea"></div>
    <div class="filtros">${[['', 'Todas'], ['nova', 'Novas'], ['andamento', 'Em andamento'], ['concluida', 'Concluídas']].map(([k, n]) => `<button class="filtro" type="button" data-sit="${k}" aria-pressed="${k === ''}">${n}</button>`).join('')}</div>
    <div id="lista"></div>`;

  el.querySelector('#escopoAulas')?.addEventListener('change', async (e) => {
    f.escopo = e.target.value;
    await aplicarEscopo();
    render();
  });
  el.querySelectorAll('[data-sit]').forEach((b) => b.addEventListener('click', () => { f.situacao = b.dataset.sit; render(); }));
  el.querySelector('#buscaAula').addEventListener('input', (e) => { f.busca = e.target.value; render(); });
  render();
}

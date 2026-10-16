// Catálogo de aulas: filtros por área, cargo, situação e busca.
import { esc, ic, cabecalho, barra, pct } from '../dom.js';
import { AREAS } from '../../../domain/areas.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function aulas(el, { conteudo, servico, casca }, { params }) {
  casca?.definirTitulo('Aulas');
  const { aulas: lista } = await conteudo.indice();
  const alvo = servico.progresso.alvo?.cargo;
  const f = { area: params.get('area') ?? '', meu: !!alvo && params.get('todas') == null, situacao: '', busca: '' };

  const situacao = (a) => {
    const p = servico.progresso.aulas?.[a.id];
    return p?.concluida ? 'concluida' : p?.visto ? 'andamento' : 'nova';
  };

  const render = () => {
    const termos = norm(f.busca).split(/\s+/).filter(Boolean);
    const vis = lista.filter((a) => (!f.area || a.area === f.area)
      && (!f.meu || a.cargos.includes('todos') || a.cargos.includes(alvo))
      && (!f.situacao || situacao(a) === f.situacao)
      && termos.every((t) => norm(`${a.titulo} ${a.disciplina} ${a.resumo} ${a.busca}`).includes(t)));
    const areas = [...new Set(lista.map((a) => a.area))];
    const feitas = lista.filter((a) => situacao(a) === 'concluida').length;
    const grupos = {};
    vis.forEach((a) => { (grupos[`${a.area}|${a.disciplina}`] ??= []).push(a); });

    el.querySelector('#lista').innerHTML = vis.length ? Object.entries(grupos).map(([k, as]) => {
      const [area, disc] = k.split('|');
      const ar = AREAS[area];
      return `<div class="secao-titulo"><span class="chip-area" style="--cor:${ar?.cor}">${ic(ar?.icone ?? 'livro')}</span><div><h2 style="font-size:1.1rem">${esc(disc || ar?.nome)}</h2><span class="mini sutil">${esc(ar?.nome ?? area)} · ${as.length} aula(s)</span></div><span class="linha-fina"></span></div>
        <div class="grid">${as.map((a) => {
          const p = servico.progresso.aulas?.[a.id];
          const s = situacao(a);
          return `<a class="card cartao-lab" href="#/aulas/${esc(a.id)}">
            <div class="linha entre"><span class="tag ${s === 'concluida' ? 'ok' : s === 'andamento' ? 'aviso' : ''}">${s === 'concluida' ? `${ic('ok')} Concluída` : s === 'andamento' ? 'Em andamento' : 'Nova'}</span><span class="mini sutil">${a.slides} slides · ~${a.duracao} min</span></div>
            <h3>${esc(a.titulo)}</h3><p>${esc(a.resumo)}</p>
            ${p?.visto ? barra(pct(Math.min(p.visto, a.slides), a.slides), p.concluida ? 'ok fina' : 'fina') : ''}
            <div class="rodape-card">${a.cartoes ? `<span>${ic('cartoes')} ${a.cartoes}</span>` : ''}${a.quizzes ? `<span>${ic('questoes')} ${a.quizzes} quiz</span>` : ''}${a.labs.length ? `<span>${ic('frasco')} ${a.labs.length} lab</span>` : ''}</div></a>`;
        }).join('')}</div>`;
    }).join('') : `<div class="vazio">${ic('busca')}<p>Nenhuma aula com esses filtros.</p></div>`;
    el.querySelector('#resumoAulas').innerHTML = `${feitas} de ${lista.length} aulas concluídas`;
    el.querySelectorAll('[data-area]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === f.area)));
    el.querySelectorAll('[data-sit]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sit === f.situacao)));
    void areas;
  };

  const areas = [...new Set(lista.map((a) => a.area))];
  el.innerHTML = `${cabecalho({ sobre: 'Estudar', titulo: 'Aulas em slides', texto: 'Aulas organizadas pelo conteúdo programático do edital, com resumo para leitura, quiz, flashcards, questões comentadas e laboratório para praticar.' })}
    <div class="filtros">
      <input type="search" id="buscaAula" placeholder="Buscar aula..." style="max-width:260px">
      ${alvo ? `<label class="opcao"><input type="checkbox" id="soMeu" ${f.meu ? 'checked' : ''}> Só do meu cargo (${esc(alvo)})</label>` : ''}
      <span class="espaco"></span><span class="pequeno muted" id="resumoAulas"></span>
    </div>
    <div class="filtros"><button class="filtro" type="button" data-area="">Todas as áreas</button>${areas.map((a) => `<button class="filtro" type="button" data-area="${esc(a)}">${esc(AREAS[a]?.curto ?? a)}</button>`).join('')}
      <span style="width:12px"></span>${[['', 'Todas'], ['nova', 'Novas'], ['andamento', 'Em andamento'], ['concluida', 'Concluídas']].map(([k, n]) => `<button class="filtro" type="button" data-sit="${k}">${n}</button>`).join('')}</div>
    <div id="lista"></div>`;
  el.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { f.area = b.dataset.area; render(); }));
  el.querySelectorAll('[data-sit]').forEach((b) => b.addEventListener('click', () => { f.situacao = b.dataset.sit; render(); }));
  el.querySelector('#soMeu')?.addEventListener('change', (e) => { f.meu = e.target.checked; render(); });
  el.querySelector('#buscaAula').addEventListener('input', (e) => { f.busca = e.target.value; render(); });
  render();
}

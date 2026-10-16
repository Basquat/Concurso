// Banco de questões: filtros (área, disciplina, assunto, dificuldade, situação, busca), sessões de prática
// com correção imediata e lista navegável.
import { esc, ic, cabecalho, barra, pct } from '../dom.js';
import { AREAS } from '../../../domain/areas.js';
import { embaralhar } from '../../../domain/quiz.js';
import { praticar, htmlQuestao } from '../componentes/questao.js';
import { semCargo } from '../componentes/cargo.js';

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function questoes(el, { conteudo, servico, casca }, { params }) {
  casca?.definirTitulo('Questões');
  if (semCargo(el, servico, 'Questões comentadas')) return;
  const todas = await conteudo.questoes();
  const f = { area: params.get('area') ?? '', disciplina: params.get('disciplina') ?? '', assunto: '', dif: '', sit: params.get('erros') ? 'erradas' : '', busca: '' };
  const r = () => servico.progresso.respostas;
  const situacao = (q) => (r()[q.id] ? (r()[q.id].ultima ? 'certas' : 'erradas') : 'novas');
  const filtradas = () => {
    const termos = norm(f.busca).split(/\s+/).filter(Boolean);
    return todas.filter((q) => (!f.area || q.area === f.area) && (!f.disciplina || q.disciplina === f.disciplina) && (!f.assunto || q.assunto === f.assunto)
      && (!f.dif || q.dificuldade === f.dif) && (!f.sit || situacao(q) === f.sit) && termos.every((t) => norm(`${q.enunciado} ${q.assunto} ${q.id}`).includes(t)));
  };

  function telaFiltros() {
    const vis = filtradas();
    const areas = [...new Set(todas.map((q) => q.area))];
    const discs = [...new Set(todas.filter((q) => !f.area || q.area === f.area).map((q) => q.disciplina))].sort();
    const assuntos = [...new Set(todas.filter((q) => (!f.area || q.area === f.area) && (!f.disciplina || q.disciplina === f.disciplina)).map((q) => q.assunto).filter(Boolean))].sort();
    const feitas = vis.filter((q) => r()[q.id]);
    const certas = feitas.filter((q) => r()[q.id].ultima).length;

    el.innerHTML = `${cabecalho({ sobre: 'Estudar', titulo: 'Questões comentadas', texto: 'Questões autorais no formato da banca (5 alternativas). Errou? Ela volta nas suas revisões espaçadas.' })}
      <div class="grade-3 mb3">
        <div class="card"><div class="mini sutil">Com os filtros atuais</div><div class="contagem" style="font-size:1.8rem">${vis.length}</div><div class="mini sutil">de ${todas.length} questões</div></div>
        <div class="card"><div class="mini sutil">Resolvidas</div><div class="contagem" style="font-size:1.8rem">${feitas.length}</div>${barra(pct(feitas.length, vis.length))}</div>
        <div class="card"><div class="mini sutil">Aproveitamento</div><div class="contagem" style="font-size:1.8rem">${feitas.length ? `${pct(certas, feitas.length)}%` : '—'}</div><div class="mini sutil">${certas} certas · ${feitas.length - certas} erradas</div></div>
      </div>
      <div class="filtros"><button class="filtro" type="button" data-area="" aria-pressed="${!f.area}">Todas</button>${areas.map((a) => `<button class="filtro" type="button" data-area="${a}" aria-pressed="${f.area === a}">${esc(AREAS[a]?.curto ?? a)}</button>`).join('')}</div>
      <div class="grade-4 mb2">
        <label class="campo">Disciplina<select data-f="disciplina"><option value="">Todas</option>${discs.map((d) => `<option ${d === f.disciplina ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
        <label class="campo">Assunto<select data-f="assunto"><option value="">Todos</option>${assuntos.map((d) => `<option ${d === f.assunto ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
        <label class="campo">Dificuldade<select data-f="dif"><option value="">Todas</option>${[['facil', 'Fácil'], ['media', 'Média'], ['dificil', 'Difícil']].map(([v, n]) => `<option value="${v}" ${v === f.dif ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="campo">Situação<select data-f="sit"><option value="">Todas</option>${[['novas', 'Não resolvidas'], ['erradas', 'Errei'], ['certas', 'Acertei']].map(([v, n]) => `<option value="${v}" ${v === f.sit ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
      <div class="linha mb3"><input type="search" data-f="busca" value="${esc(f.busca)}" placeholder="Buscar no enunciado..." style="max-width:320px">
        <span class="espaco"></span>
        <button class="btn primario grande" type="button" data-praticar ${vis.length ? '' : 'disabled'}>${ic('play')} Praticar ${Math.min(10, vis.length)} questões</button></div>
      <div class="secao-titulo"><h2 style="font-size:1.05rem">Lista</h2><span class="linha-fina"></span></div>
      <div class="pilha p">${vis.slice(0, 80).map((q) => {
        const s = situacao(q);
        return `<button class="tarefa" type="button" data-abrir="${esc(q.id)}" style="text-align:left;width:100%"><span class="tag ${s === 'certas' ? 'ok' : s === 'erradas' ? 'erro' : ''}">${s === 'certas' ? 'acertei' : s === 'erradas' ? 'errei' : 'nova'}</span>
          <span style="min-width:0;flex:1"><span class="tt">${esc(q.enunciado.replace(/```[\s\S]*?```/g, '[código]').slice(0, 150))}${q.enunciado.length > 150 ? '…' : ''}</span><br><span class="ds">${esc(q.disciplina)} · ${esc(q.assunto)}</span></span>${ic('dir', 'seta')}</button>`;
      }).join('')}${vis.length > 80 ? `<p class="mini sutil">Mostrando 80 de ${vis.length}. Refine os filtros.</p>` : ''}${!vis.length ? `<div class="vazio">${ic('busca')}<p>Nenhuma questão com esses filtros.</p></div>` : ''}</div>`;

    el.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => { f.area = b.dataset.area; f.disciplina = ''; f.assunto = ''; telaFiltros(); }));
    el.querySelectorAll('select[data-f]').forEach((s) => s.addEventListener('change', () => { f[s.dataset.f] = s.value; if (s.dataset.f === 'disciplina') f.assunto = ''; telaFiltros(); }));
    const busca = el.querySelector('input[data-f=busca]');
    let t;
    busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { f.busca = busca.value; telaFiltros(); el.querySelector('input[data-f=busca]').focus(); }, 300); });
    el.querySelector('[data-praticar]').addEventListener('click', () => sessao(ordenar(vis).slice(0, 10)));
    el.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => { const q = todas.find((x) => x.id === b.dataset.abrir); sessao([q]); }));
  }

  // Não resolvidas primeiro, depois erradas, depois acertadas (embaralhadas dentro de cada grupo).
  const ordenar = (lista) => ['novas', 'erradas', 'certas'].flatMap((s) => embaralhar(lista.filter((q) => situacao(q) === s)));

  function sessao(fila) {
    let k = 0;
    let acertos = 0;
    const xp0 = servico.progresso.xp;
    const proxima = () => {
      if (k >= fila.length) {
        el.innerHTML = `${cabecalho({ sobre: 'Sessão concluída', titulo: `${acertos} de ${fila.length} certas` })}
          <div class="card centro" style="padding:32px">${ic('trofeu', 'g')}<p class="mt1">Aproveitamento de <strong>${pct(acertos, fila.length)}%</strong> · +${servico.progresso.xp - xp0} XP. As erradas entraram nas suas revisões.</p>
          <div class="linha" style="justify-content:center"><button class="btn primario" type="button" data-mais>${ic('play')} Mais questões</button><button class="btn" type="button" data-voltar>Voltar aos filtros</button></div></div>`;
        el.querySelector('[data-mais]').onclick = () => sessao(ordenar(filtradas()).slice(0, 10));
        el.querySelector('[data-voltar]').onclick = telaFiltros;
        return;
      }
      el.innerHTML = `<div class="linha entre mb2"><button class="btn fantasma" type="button" data-sair>${ic('esq')} Filtros</button><span class="pequeno muted">${acertos} certa(s) até agora</span></div><div id="q"></div>`;
      el.querySelector('[data-sair]').onclick = telaFiltros;
      praticar(el.querySelector('#q'), fila[k], { servico, numero: k + 1, total: fila.length, proxima: k + 1 < fila.length ? 'Próxima' : 'Ver resultado', aoProxima: () => { k++; proxima(); } })
        .then(({ correta }) => { if (correta) acertos++; });
    };
    proxima();
  }

  void htmlQuestao;
  telaFiltros();
}

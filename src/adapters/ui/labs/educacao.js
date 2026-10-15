import { planoVazio, avaliarPlano, nivelBloom, BLOOM, MISSOES_EDU } from '../../../domain/educacao/plano.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const AVALIACOES = ['diagnóstica', 'formativa', 'somativa', ''];

export default async function educacao(el, { servico, labs }) {
  let plano = labs.carregar('educacao') ?? planoVazio();
  el.innerHTML = cabecalhoLab('educacao') + `<div class="split"><div class="pilha">
      <form class="card pilha" id="plano" autocomplete="off"></form>
      <details class="card"><summary><strong>Verbos por nível (Bloom revisada)</strong></summary><div class="pequeno" style="margin-top:8px">${Object.entries(BLOOM).map(([n, v]) => `<div><strong>${n}:</strong> ${v.join(', ')}</div>`).join('')}</div></details>
    </div><aside class="pilha"><div class="card" id="rubrica"></div><div class="card" id="missoes"></div></aside></div>`;
  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'educacao', missoes: MISSOES_EDU, servico });
  const form = el.querySelector('#plano');

  function desenharForm() {
    form.innerHTML = `<div class="linha"><label class="campo" style="flex:1">Tema / conteúdo<input data-f="tema" value="${esc(plano.tema)}" placeholder="Ex.: Frações equivalentes (6º ano)"></label>
        <label class="campo">Duração (min)<input data-f="duracao" type="number" min="10" max="300" value="${plano.duracao}" style="width:90px"></label></div>
      <div><strong>Objetivos de aprendizagem</strong>${plano.objetivos.map((o, i) => `<div class="linha" style="margin-top:6px"><span class="mono pequeno">${i + 1}.</span><input data-obj="${i}" value="${esc(o)}" placeholder="Verbo no infinitivo + conteúdo (ex.: Comparar frações...)" style="flex:1"><span class="tag" data-nivel="${i}">${nivelBloom(o) ?? '—'}</span>${plano.objetivos.length > 1 ? `<button type="button" class="btn peq" data-rmobj="${i}">✕</button>` : ''}</div>`).join('')}
        <button type="button" class="btn peq" id="addObj" style="margin-top:6px">+ objetivo</button></div>
      <div><strong>Sequência de atividades</strong>${plano.atividades.map((a, i) => `<div class="linha" style="margin-top:6px">
          <input data-at="${i}" data-k="descricao" value="${esc(a.descricao)}" placeholder="Descrição da atividade" style="flex:1;min-width:180px">
          <input data-at="${i}" data-k="minutos" type="number" min="1" value="${a.minutos}" style="width:70px" aria-label="Minutos">
          <select data-at="${i}" data-k="objetivo" aria-label="Objetivo atendido">${plano.objetivos.map((_, k) => `<option value="${k}" ${Number(a.objetivo) === k ? 'selected' : ''}>Obj. ${k + 1}</option>`).join('')}</select>
          <select data-at="${i}" data-k="avaliacao" aria-label="Avaliação">${AVALIACOES.map((v) => `<option value="${v}" ${a.avaliacao === v ? 'selected' : ''}>${v || 'sem avaliação'}</option>`).join('')}</select>
          ${plano.atividades.length > 1 ? `<button type="button" class="btn peq" data-rmat="${i}">✕</button>` : ''}</div>`).join('')}
        <button type="button" class="btn peq" id="addAt" style="margin-top:6px">+ atividade</button></div>
      <label class="campo">Inclusão e acessibilidade<textarea data-f="acessibilidade" rows="3" placeholder="Adaptações para estudantes com deficiência, TEA, dificuldades de aprendizagem...">${esc(plano.acessibilidade)}</textarea></label>`;
  }

  function rubrica() {
    const r = avaliarPlano(plano);
    el.querySelector('#rubrica').innerHTML = `<div class="linha entre"><strong>Rubrica</strong><span class="tag ${r.nota === 100 ? 'ok' : ''}">${r.nota}%</span></div>
      <ul class="missoes" style="margin-top:8px">${r.rubrica.map((c) => `<li class="${c.ok ? 'feita' : ''} pequeno"><strong>${c.ok ? '✅' : '⬜'} ${esc(c.criterio)}</strong>${c.ok ? '' : `<div class="muted">${esc(c.feedback)}</div>`}</li>`).join('')}</ul>`;
    labs.salvar('educacao', plano);
    painel.verificar((m) => m.check({ plano }));
  }

  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.f) plano[t.dataset.f] = t.type === 'number' ? Number(t.value) : t.value;
    if (t.dataset.obj !== undefined) { plano.objetivos[Number(t.dataset.obj)] = t.value; form.querySelector(`[data-nivel="${t.dataset.obj}"]`).textContent = nivelBloom(t.value) ?? '—'; }
    if (t.dataset.at !== undefined) plano.atividades[Number(t.dataset.at)][t.dataset.k] = t.type === 'number' ? Number(t.value) : t.value;
    rubrica();
  });
  form.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') rubrica(); });
  form.addEventListener('click', (e) => {
    const t = e.target;
    if (t.id === 'addObj') plano.objetivos.push('');
    else if (t.id === 'addAt') plano.atividades.push({ descricao: '', minutos: 10, objetivo: 0, avaliacao: 'formativa' });
    else if (t.dataset.rmobj !== undefined) { const i = Number(t.dataset.rmobj); plano.objetivos.splice(i, 1); plano.atividades.forEach((a) => { if (Number(a.objetivo) >= i) a.objetivo = Math.max(0, Number(a.objetivo) - 1); }); }
    else if (t.dataset.rmat !== undefined) plano.atividades.splice(Number(t.dataset.rmat), 1);
    else return;
    desenharForm();
    rubrica();
  });
  confirmarReinicio(el, () => { labs.limpar('educacao'); plano = planoVazio(); desenharForm(); rubrica(); });
  desenharForm();
  rubrica();
}

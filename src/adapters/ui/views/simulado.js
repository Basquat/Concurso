import { esc, graficoBarras } from '../dom.js';
import { montarSimulado, apurar } from '../../../domain/quiz.js';
import { origemTag } from './questoes.js';

const LETRAS = 'ABCDE';

export default async function simulado(el, { servico, conteudo }, { params }) {
  const [todas, trilhas] = await Promise.all([conteudo.questoes(), conteudo.trilhas()]);
  let timer = null;

  function configurar() {
    const pre = params.get('area');
    el.innerHTML = `<h1>Simulado</h1>
      <form class="card pilha" id="cfg" style="max-width:640px">
        <fieldset style="border:0;padding:0;margin:0"><legend class="pequeno muted">Áreas</legend>
          <div class="linha">${trilhas.map((t) => `<label class="linha pequeno"><input type="checkbox" name="area" value="${t.id}" ${!pre || pre === t.id ? 'checked' : ''}> ${esc(t.nome)} (${todas.filter((q) => q.area === t.id).length})</label>`).join('')}</div>
        </fieldset>
        <div class="linha">
          <label class="campo">Questões<input type="number" name="n" value="20" min="5" max="100"></label>
          <label class="campo">Tempo (minutos)<input type="number" name="min" value="40" min="5" max="300"></label>
        </div>
        <p class="pequeno muted" style="margin:0">Como na prova: você marca as respostas e só vê o gabarito ao entregar. Regra de bolso: ~2 a 3 min por questão objetiva.</p>
        <div><button class="btn primario">Começar</button></div>
      </form>`;
    el.querySelector('#cfg').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const areas = f.getAll('area');
      const base = todas.filter((q) => areas.includes(q.area));
      if (!base.length) return alert('Escolha ao menos uma área.');
      iniciar(montarSimulado(base, Math.min(Number(f.get('n')) || 20, base.length)), Number(f.get('min')) * 60);
    });
  }

  function iniciar(qs, segundos) {
    const marcadas = {};
    const inicio = Date.now();
    el.innerHTML = `<div class="linha entre" style="position:sticky;top:56px;background:var(--bg);padding:8px 0;z-index:5">
        <h1 style="margin:0">Simulado · ${qs.length} questões</h1>
        <div class="linha"><span class="tag" id="rel" aria-live="off"></span><span class="tag" id="cont">0/${qs.length} marcadas</span><button class="btn primario" id="entregar">Entregar</button></div>
      </div>
      <div class="pilha">${qs.map((q, n) => `<article class="card quiz" data-q="${esc(q.id)}">
        <div class="linha entre pequeno muted"><span><strong>${n + 1}.</strong> ${esc(q.disciplina)}</span>${origemTag(q)}</div>
        <p style="white-space:pre-line">${esc(q.enunciado)}</p>
        ${q.alternativas.map((a, k) => `<button class="alt" data-k="${k}"><b>${LETRAS[k]}</b>${esc(a)}</button>`).join('')}
      </article>`).join('')}</div>`;
    el.querySelectorAll('article').forEach((art) => art.addEventListener('click', (e) => {
      const b = e.target.closest('.alt');
      if (!b || b.disabled) return;
      marcadas[art.dataset.q] = Number(b.dataset.k);
      art.querySelectorAll('.alt').forEach((x) => x.classList.toggle('marcada', x === b));
      el.querySelector('#cont').textContent = `${Object.keys(marcadas).length}/${qs.length} marcadas`;
    }));
    const fim = inicio + segundos * 1000;
    const tique = () => {
      const r = Math.max(0, Math.round((fim - Date.now()) / 1000));
      el.querySelector('#rel').textContent = `⏱ ${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
      if (r === 0) entregar(true);
    };
    timer = setInterval(tique, 1000);
    tique();
    const entregar = (tempoEsgotado) => {
      clearInterval(timer);
      timer = null;
      const faltam = qs.length - Object.keys(marcadas).length;
      if (!tempoEsgotado && faltam && !confirm(`Ainda há ${faltam} questão(ões) em branco. Entregar mesmo assim?`)) { timer = setInterval(tique, 1000); return; }
      resultado(qs, marcadas, Math.round((Date.now() - inicio) / 1000), tempoEsgotado);
    };
    el.querySelector('#entregar').onclick = () => entregar(false);
  }

  function resultado(qs, marcadas, segundos, esgotado) {
    const r = apurar(qs, marcadas);
    for (const q of qs) if (marcadas[q.id] !== undefined) servico.responder(q, marcadas[q.id]);
    servico.concluirSimulado({ acertos: r.acertos, total: r.total, segundos });
    const disc = Object.entries(r.porDisciplina).map(([d, v]) => ({ rotulo: d, valor: Math.round((v.acertos / v.total) * 100) }));
    el.innerHTML = `<h1>Resultado</h1>
      ${esgotado ? '<div class="callout aviso">Tempo esgotado: o simulado foi entregue automaticamente.</div>' : ''}
      <div class="grid" style="margin:14px 0">
        <div class="card"><div class="muted pequeno">Acertos</div><div style="font-size:2rem;font-weight:800">${r.acertos}/${r.total}</div></div>
        <div class="card"><div class="muted pequeno">Aproveitamento</div><div style="font-size:2rem;font-weight:800" class="${r.pct >= 70 ? 'ok' : 'erro'}">${r.pct}%</div></div>
        <div class="card"><div class="muted pequeno">Tempo</div><div style="font-size:2rem;font-weight:800">${Math.floor(segundos / 60)}min ${segundos % 60}s</div></div>
      </div>
      <div class="card" style="margin-bottom:14px"><h3>% de acerto por disciplina</h3>${graficoBarras(disc, { formato: (v) => `${v}%` })}</div>
      <div class="linha" style="margin-bottom:14px"><button class="btn primario" id="novo">Novo simulado</button><a class="btn" href="#/questoes?erros=1">Revisar erros</a></div>
      <h2>Gabarito comentado</h2>
      <div class="pilha">${qs.map((q, n) => {
        const m = marcadas[q.id];
        return `<article class="card quiz"><div class="pequeno muted"><strong>${n + 1}.</strong> ${esc(q.disciplina)} · ${m === undefined ? '<span class="erro">em branco</span>' : m === q.correta ? '<span class="ok">acertou</span>' : '<span class="erro">errou</span>'}</div>
          <p style="white-space:pre-line">${esc(q.enunciado)}</p>
          ${q.alternativas.map((a, k) => `<button class="alt ${k === q.correta ? 'certa' : k === m ? 'errada' : ''}" disabled><b>${LETRAS[k]}</b>${esc(a)}</button>`).join('')}
          <p class="pequeno" style="margin-top:8px">${esc(q.explicacao)}</p></article>`;
      }).join('')}</div>`;
    el.querySelector('#novo').onclick = configurar;
  }

  configurar();
  return () => clearInterval(timer);
}

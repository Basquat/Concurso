import { avaliarPlanilha, formatar, deslocarFormula, ordenarLinhas, parseRef, ErroCel } from '../../../domain/sheet/formula.js';
import { planilhaInicial, MISSOES_PLANILHA, COLUNAS, LINHAS, verificar } from '../../../domain/sheet/missions.js';
import { esc, graficoBarras } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

export default async function planilha(el, { servico, labs }) {
  let st = labs.carregar('planilha') ?? { celulas: planilhaInicial(), grafico: null };
  let sel = 'F2';
  let filtro = { col: '', texto: '' };
  const opts = (v) => COLUNAS.map((c) => `<option ${c === v ? 'selected' : ''}>${c}</option>`).join('');

  el.innerHTML = cabecalhoLab('planilha') + `<div class="split"><div class="pilha">
      <div class="card">
        <div class="barra-formula"><strong class="mono" id="ref" style="min-width:42px">F2</strong><span class="muted">fx</span><input id="fx" aria-label="Conteúdo da célula" spellcheck="false" autocomplete="off"></div>
        <div class="linha pequeno" style="margin-bottom:8px">
          <button class="btn peq" id="fill">Preencher ↓ até a linha</button><input id="ate" type="number" value="9" min="2" max="${LINHAS}" style="width:64px">
          <span class="muted">|</span>
          <button class="btn peq" id="asc">Ordenar ↑</button><button class="btn peq" id="desc">Ordenar ↓</button><span class="muted">(coluna selecionada, linhas 2–9)</span>
          <span class="muted">|</span>
          Filtrar <select id="fcol"><option value="">—</option>${opts('')}</select><input id="ftxt" placeholder="contém…" style="width:110px">
        </div>
        <div style="overflow:auto" tabindex="0" id="grade" aria-label="Planilha"></div>
        <p class="pequeno muted" style="margin:8px 0 0">Clique numa célula e digite. Fórmulas começam com =. Use ; para separar argumentos (ex.: =SE(C2&lt;D2;"Repor";"OK")). Funções: SOMA, MÉDIA, MÍNIMO, MÁXIMO, CONT.NÚM, CONT.VALORES, CONT.SE, SOMASE, SE, E, OU, ARRED, PROCV (e equivalentes em inglês).</p>
      </div>
      <div class="card"><div class="linha"><strong>Gráfico</strong> rótulos <select id="grot">${opts(st.grafico?.rotulos ?? 'A')}</select> valores <select id="gval">${opts(st.grafico?.valores ?? 'F')}</select><button class="btn peq" id="gerar">Gerar gráfico de barras</button></div><div id="graf" style="margin-top:8px"></div></div>
    </div><aside class="card" id="missoes"></aside></div>`;

  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'planilha', missoes: MISSOES_PLANILHA, servico });
  const fx = el.querySelector('#fx');
  const grade = el.querySelector('#grade');

  function render() {
    const { valores } = avaliarPlanilha(st.celulas);
    let h = `<table class="planilha"><thead><tr><th></th>${COLUNAS.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
    for (let l = 1; l <= LINHAS; l++) {
      const oculta = filtro.col && filtro.texto && l >= 2 && l <= 9 && !String(formatar(valores[`${filtro.col}${l}`])).toLowerCase().includes(filtro.texto.toLowerCase());
      h += `<tr class="${oculta ? 'oculta' : ''}"><th>${l}</th>${COLUNAS.map((c) => {
        const r = `${c}${l}`;
        const v = valores[r];
        const cls = [r === sel ? 'sel' : '', typeof v === 'number' ? 'num' : '', v instanceof ErroCel ? 'err' : ''].join(' ');
        return `<td class="${cls}" data-r="${r}" title="${esc(st.celulas[r] ?? '')}"><div${l === 1 ? ' style="font-weight:600"' : ''}>${esc(formatar(v))}</div></td>`;
      }).join('')}</tr>`;
    }
    grade.innerHTML = h + '</tbody></table>';
    el.querySelector('#ref').textContent = sel;
    if (document.activeElement !== fx) fx.value = st.celulas[sel] ?? '';
    if (st.grafico) {
      const itens = [];
      for (let l = 2; l <= 9; l++) itens.push({ rotulo: formatar(valores[`${st.grafico.rotulos}${l}`]), valor: typeof valores[`${st.grafico.valores}${l}`] === 'number' ? valores[`${st.grafico.valores}${l}`] : 0 });
      el.querySelector('#graf').innerHTML = graficoBarras(itens);
    }
  }

  function mudou() {
    labs.salvar('planilha', st);
    render();
    const r = verificar(st.celulas, st);
    painel.verificar((m) => r[m.id]);
  }

  function confirmar(mover = true) {
    const v = fx.value;
    if (v.trim() === '') delete st.celulas[sel]; else st.celulas[sel] = v;
    if (mover) { const p = parseRef(sel); if (p.l < LINHAS) sel = `${COLUNAS[p.c]}${p.l + 1}`; }
    fx.value = st.celulas[sel] ?? '';
    mudou();
  }

  grade.addEventListener('click', (e) => {
    const td = e.target.closest('td[data-r]');
    if (!td) return;
    sel = td.dataset.r;
    fx.value = st.celulas[sel] ?? '';
    render();
    grade.focus();
  });
  grade.addEventListener('dblclick', () => fx.focus());
  grade.addEventListener('keydown', (e) => {
    const p = parseRef(sel);
    const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (mv) {
      e.preventDefault();
      const c = Math.min(COLUNAS.length - 1, Math.max(0, p.c + mv[0]));
      const l = Math.min(LINHAS, Math.max(1, p.l + mv[1]));
      sel = `${COLUNAS[c]}${l}`;
      fx.value = st.celulas[sel] ?? '';
      render();
    } else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); fx.focus(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delete st.celulas[sel]; fx.value = ''; mudou(); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); fx.value = e.key; fx.focus(); }
  });
  fx.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmar(); grade.focus(); }
    if (e.key === 'Escape') { fx.value = st.celulas[sel] ?? ''; grade.focus(); }
    if (e.key === 'Tab') { e.preventDefault(); confirmar(false); const p = parseRef(sel); if (p.c < COLUNAS.length - 1) sel = `${COLUNAS[p.c + 1]}${p.l}`; fx.value = st.celulas[sel] ?? ''; render(); grade.focus(); }
  });

  el.querySelector('#fill').onclick = () => {
    const p = parseRef(sel);
    const raw = st.celulas[sel];
    const ate = Number(el.querySelector('#ate').value);
    if (raw === undefined || ate <= p.l) return;
    for (let l = p.l + 1; l <= ate; l++) st.celulas[`${COLUNAS[p.c]}${l}`] = deslocarFormula(raw, l - p.l);
    mudou();
  };
  const ordenar = (desc) => { st.celulas = ordenarLinhas(st.celulas, { de: 2, ate: 9, colunas: COLUNAS, chave: sel.replace(/\d+/, ''), desc }); mudou(); };
  el.querySelector('#asc').onclick = () => ordenar(false);
  el.querySelector('#desc').onclick = () => ordenar(true);
  el.querySelector('#fcol').onchange = (e) => { filtro.col = e.target.value; render(); };
  el.querySelector('#ftxt').oninput = (e) => { filtro.texto = e.target.value; render(); };
  el.querySelector('#gerar').onclick = () => { st.grafico = { rotulos: el.querySelector('#grot').value, valores: el.querySelector('#gval').value }; mudou(); };
  confirmarReinicio(el, () => { labs.limpar('planilha'); st = { celulas: planilhaInicial(), grafico: null }; el.querySelector('#graf').innerHTML = ''; mudou(); });

  render();
  const r = verificar(st.celulas, st);
  painel.verificar((m) => r[m.id]);
}

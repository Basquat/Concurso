import { dadosBrutos, ETAPAS, montarModelo, compilarDefinicao, valorMedida, serie, alcancavel, parseCol, MISSOES_BI } from '../../../domain/bi/model.js';
import { esc, graficoBarras, graficoLinha } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const EIXOS = ['dRegiao[regiao]', 'dProduto[categoria]', 'dProduto[produto]', 'fVendas[mes]'];
const SEGMENTACOES = ['dRegiao[regiao]', 'dProduto[categoria]'];
const inicial = () => ({ etapas: [], relacoes: [{ de: 'fVendas.id_produto', para: 'dProduto.id' }], medidas: [], colunas: [], visuais: [], filtros: {} });
const num = (v) => (v === null || v === undefined ? '(vazio)' : typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : String(v));

export default async function bi(el, { servico, labs }) {
  const bruto = dadosBrutos();
  let st = { ...inicial(), ...(labs.carregar('bi') ?? {}) };
  let aba = 'pq';
  let erroDax = '';

  el.innerHTML = cabecalhoLab('bi') + `<div class="split"><div class="pilha">
      <div class="abas">${[['pq', '1 · Power Query (transformar)'], ['modelo', '2 · Modelo (relacionar)'], ['rel', '3 · Relatório (medidas e visuais)']].map(([k, n]) => `<button data-aba="${k}" class="${k === aba ? 'ativa' : ''}">${n}</button>`).join('')}</div>
      <div class="card" id="conteudo" style="border-top-left-radius:0"></div>
    </div><aside class="card" id="missoes"></aside></div>`;
  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'bi', missoes: MISSOES_BI, servico });
  const box = el.querySelector('#conteudo');

  function compilar() {
    const medidas = [];
    for (const m of st.medidas) { try { medidas.push(compilarDefinicao(m.texto)); } catch { /* ignorada */ } }
    const colunas = [];
    for (const c of st.colunas) { try { colunas.push(compilarDefinicao(c.texto)); } catch { /* ignorada */ } }
    try {
      return { modelo: montarModelo(bruto, st.etapas, st.relacoes, colunas), medidas, erroColuna: '' };
    } catch (e) {
      return { modelo: montarModelo(bruto, st.etapas, st.relacoes), medidas, erroColuna: `Coluna calculada com erro (ignorada): ${e.message}` };
    }
  }

  function render() {
    const { modelo, medidas, erroColuna } = compilar();
    if (aba === 'pq') powerQuery(modelo);
    else if (aba === 'modelo') modeloView(modelo);
    else relatorio(modelo, medidas, erroColuna);
    labs.salvar('bi', st);
    painel.verificar((m) => m.check({ modelo, medidas, visuais: st.visuais }));
  }

  function powerQuery(modelo) {
    const linhas = modelo.tabelas.fVendas;
    const cols = Object.keys(linhas[0] ?? bruto.fVendas[0]);
    const tipo = (c) => (linhas.every((l) => typeof l[c] === 'number') ? '1.2' : 'ABC');
    const vazios = (c) => linhas.filter((l) => l[c] === '' || l[c] === null || l[c] === undefined).length;
    const distintos = new Set(linhas.map((l) => JSON.stringify(l))).size;
    box.innerHTML = `<div class="linha entre"><strong>Tabela fVendas</strong><span class="pequeno muted">${linhas.length} linhas · ${linhas.length - distintos} duplicada(s) exata(s)</span></div>
      <p class="pequeno muted">Origem: arquivo CSV fictício exportado de um sistema de vendas (valores em formato brasileiro). Cada etapa é reaplicada sobre os dados brutos, como no Power Query.</p>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:12px" class="bi-pq">
        <div class="rolagem"><table class="tabela"><thead><tr>${cols.map((c) => `<th title="${vazios(c)} vazio(s)"><span class="tag">${tipo(c)}</span> ${esc(c)}<div class="pequeno ${vazios(c) ? 'erro' : 'muted'}" style="font-weight:400">${vazios(c)} vazio(s)</div></th>`).join('')}</tr></thead>
          <tbody>${linhas.slice(0, 25).map((l) => `<tr>${cols.map((c) => `<td class="${typeof l[c] === 'number' ? 'num' : ''}">${l[c] === '' ? '<span class="erro">(vazio)</span>' : esc(num(l[c]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="pilha">
          <div><strong class="pequeno">Etapas aplicadas</strong><ol class="pequeno" style="padding-left:18px;margin:6px 0">${['Fonte (CSV)', ...st.etapas.map((e) => `${ETAPAS[e.op].nome}${e.coluna ? ` [${e.coluna}]` : ''}`)].map((n, i) => `<li class="linha entre">${esc(n)}${i ? `<button class="btn peq" data-rmetapa="${i - 1}" aria-label="Remover etapa">✕</button>` : ''}</li>`).join('')}</ol></div>
          <label class="campo">Transformação<select id="op">${Object.entries(ETAPAS).map(([k, v]) => `<option value="${k}">${esc(v.nome)}</option>`).join('')}</select></label>
          <label class="campo">Coluna<select id="opcol">${cols.map((c) => `<option>${c}</option>`).join('')}</select></label>
          <button class="btn primario" id="aplicar">Aplicar etapa</button>
        </div>
      </div>`;
    if (matchMedia('(max-width: 720px)').matches) box.querySelector('.bi-pq').style.gridTemplateColumns = 'minmax(0,1fr)';
    box.querySelector('#aplicar').onclick = () => {
      const op = box.querySelector('#op').value;
      st.etapas.push(ETAPAS[op].coluna ? { op, coluna: box.querySelector('#opcol').value } : { op });
      render();
    };
    box.querySelectorAll('[data-rmetapa]').forEach((b) => b.addEventListener('click', () => { st.etapas.splice(Number(b.dataset.rmetapa), 1); render(); }));
  }

  function modeloView(modelo) {
    const tabelas = { fVendas: Object.keys(modelo.tabelas.fVendas[0] ?? bruto.fVendas[0]), dProduto: Object.keys(bruto.dProduto[0]), dRegiao: Object.keys(bruto.dRegiao[0]) };
    const pos = { dProduto: [20, 30], fVendas: [250, 30], dRegiao: [480, 30] };
    const caixa = (t) => { const [x, y] = pos[t]; return `<rect x="${x}" y="${y}" width="170" height="${28 + tabelas[t].length * 17}" rx="8" fill="var(--surface)" stroke="${t === 'fVendas' ? 'var(--primary)' : 'var(--border)'}" stroke-width="2"/><text x="${x + 10}" y="${y + 19}" font-weight="700" font-size="12" fill="var(--text)">${t}${t === 'fVendas' ? ' (fato)' : ' (dimensão)'}</text>${tabelas[t].map((c, i) => `<text x="${x + 12}" y="${y + 40 + i * 17}" font-size="11" fill="var(--muted)">${esc(c)}</text>`).join('')}`; };
    const linhas = st.relacoes.map((r) => {
      const [tA, cA] = r.de.split('.');
      const [tB, cB] = r.para.split('.');
      const ya = pos[tA][1] + 36 + tabelas[tA].indexOf(cA) * 17;
      const yb = pos[tB][1] + 36 + tabelas[tB].indexOf(cB) * 17;
      const xa = pos[tA][0] + (pos[tB][0] < pos[tA][0] ? 0 : 170);
      const xb = pos[tB][0] + (pos[tB][0] < pos[tA][0] ? 170 : 0);
      return `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="var(--primary)" stroke-width="2"/><text x="${(xa + xb) / 2}" y="${(ya + yb) / 2 - 6}" text-anchor="middle" font-size="11" fill="var(--text)">* : 1</text>`;
    }).join('');
    box.innerHTML = `<p class="pequeno muted">Esquema estrela: a tabela fato (fVendas) liga-se às dimensões por chaves. Relação muitos-para-um (*:1), filtro propagando da dimensão para a fato. Sem relacionamento, filtrar por região não afeta as vendas.</p>
      <div style="overflow:auto"><svg viewBox="0 0 670 210" style="min-width:560px;width:100%">${caixa('dProduto')}${caixa('fVendas')}${caixa('dRegiao')}${linhas}</svg></div>
      <h4>Relacionamentos</h4>
      <ul class="missoes">${st.relacoes.map((r, i) => `<li class="linha entre pequeno"><span class="mono">${esc(r.de)} (*) → ${esc(r.para)} (1)</span><button class="btn peq" data-rmrel="${i}">✕</button></li>`).join('') || '<li class="muted pequeno">Nenhum</li>'}</ul>
      <div class="linha" style="margin-top:10px"><label class="campo">De (fato)<select id="rde">${tabelas.fVendas.map((c) => `<option value="fVendas.${c}">fVendas.${c}</option>`).join('')}</select></label>
        <label class="campo">Para (dimensão)<select id="rpara">${['dProduto', 'dRegiao'].flatMap((t) => tabelas[t].map((c) => `<option value="${t}.${c}">${t}.${c}</option>`)).join('')}</select></label>
        <button class="btn primario" id="criarRel" style="align-self:end">Criar relacionamento</button></div><div id="relmsg" class="pequeno"></div>`;
    box.querySelector('#criarRel').onclick = () => {
      const de = box.querySelector('#rde').value;
      const para = box.querySelector('#rpara').value;
      const [tB, cB] = para.split('.');
      const msg = box.querySelector('#relmsg');
      if (new Set(bruto[tB].map((l) => l[cB])).size !== bruto[tB].length) { msg.innerHTML = `<span class="erro">${esc(para)} tem valores repetidos: o lado "1" precisa de chave única.</span>`; return; }
      if (st.relacoes.some((r) => r.para.startsWith(`${tB}.`))) { msg.innerHTML = `<span class="erro">Já existe relacionamento ativo com ${tB}.</span>`; return; }
      st.relacoes.push({ de, para });
      render();
    };
    box.querySelectorAll('[data-rmrel]').forEach((b) => b.addEventListener('click', () => { st.relacoes.splice(Number(b.dataset.rmrel), 1); render(); }));
  }

  function relatorio(modelo, medidas, erroColuna) {
    const valores = (col) => { const c = parseCol(col); return [...new Set(modelo.tabelas[c.tabela].map((l) => l[c.coluna]))].filter((v) => v !== '').sort(); };
    const visual = (v, i) => {
      let corpo;
      try {
        if (v.tipo === 'cartao') corpo = `<div style="font-size:2rem;font-weight:800">${esc(num(valorMedida(modelo, medidas, v.medida, st.filtros)))}</div>`;
        else {
          const s = serie(modelo, medidas, v.eixo, v.medida, st.filtros);
          corpo = v.tipo === 'barras' ? graficoBarras(s.map((p) => ({ ...p, valor: p.valor ?? 0 })), { formato: num }) : v.tipo === 'linha' ? graficoLinha(s, { formato: num })
            : `<table class="tabela"><thead><tr><th>${esc(v.eixo)}</th><th class="num">${esc(v.medida)}</th></tr></thead><tbody>${s.map((p) => `<tr><td>${esc(p.rotulo)}</td><td class="num">${esc(num(p.valor))}</td></tr>`).join('')}</tbody></table>`;
          if (!alcancavel(modelo, parseCol(v.eixo))) corpo = `<div class="callout aviso pequeno">Sem relacionamento entre fVendas e ${esc(parseCol(v.eixo).tabela)}: todos os itens mostram o total geral.</div>` + corpo;
        }
      } catch (e) { corpo = `<div class="callout err pequeno">${esc(e.message)}</div>`; }
      return `<div class="card"><div class="linha entre pequeno"><strong>${esc(v.medida)}${v.tipo === 'cartao' ? '' : ` por ${esc(v.eixo)}`}</strong><button class="btn peq" data-rmvis="${i}">✕</button></div>${corpo}</div>`;
    };
    box.innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
        <div class="pilha">
          <strong>Medidas e colunas calculadas (DAX)</strong>
          <textarea id="dax" class="mono" rows="3" placeholder='Faturamento = SUM(fVendas[valor])'></textarea>
          <div class="linha"><button class="btn primario" id="criarMed">Criar</button><span class="pequeno muted">Coluna calculada: fVendas[Nome] = expressão</span></div>
          <div id="daxerro">${[erroDax, erroColuna].filter(Boolean).map((m) => `<div class="callout err pequeno">${esc(m)}</div>`).join('')}</div>
          <ul class="missoes">${st.medidas.map((m, i) => { let v; try { v = num(valorMedida(modelo, medidas, compilarDefinicao(m.texto).nome)); } catch (e) { v = `⚠ ${e.message}`; } return `<li class="pequeno"><div class="linha entre"><span class="mono">∑ ${esc(m.texto)}</span><button class="btn peq" data-rmmed="${i}">✕</button></div><div class="muted">Total: ${esc(v)}</div></li>`; }).join('')}
            ${st.colunas.map((c, i) => `<li class="pequeno"><div class="linha entre"><span class="mono">▦ ${esc(c.texto)}</span><button class="btn peq" data-rmcol="${i}">✕</button></div></li>`).join('')}</ul>
        </div>
        <div class="pilha">
          <strong>Segmentações</strong>
          ${SEGMENTACOES.map((s) => `<fieldset style="border:1px solid var(--border);border-radius:8px;padding:6px 8px"><legend class="pequeno muted">${esc(s)}</legend><div class="linha">${valores(s).map((v) => `<label class="linha pequeno"><input type="checkbox" data-seg="${esc(s)}" value="${esc(v)}" ${(st.filtros[s] ?? []).includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('')}</div></fieldset>`).join('')}
          <strong>Novo visual</strong>
          <div class="linha"><select id="vtipo"><option value="barras">Barras</option><option value="linha">Linha</option><option value="tabela">Tabela</option><option value="cartao">Cartão</option></select>
            <select id="veixo">${EIXOS.map((e) => `<option>${e}</option>`).join('')}</select>
            <select id="vmed">${medidas.map((m) => `<option>${esc(m.nome)}</option>`).join('') || '<option value="">crie uma medida</option>'}</select>
            <button class="btn" id="criarVis">Adicionar</button></div>
        </div>
      </div>
      <div class="grid" style="margin-top:14px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">${st.visuais.map(visual).join('')}</div>`;
    // Erro de sintaxe impede a criação; erro de avaliação (ex.: SUM em texto) mantém a medida e aparece no resultado, como no Power BI.
    box.querySelector('#criarMed').onclick = () => {
      const texto = box.querySelector('#dax').value.trim();
      erroDax = '';
      try {
        const d = compilarDefinicao(texto);
        if (d.tipo === 'medida') {
          if (medidas.some((m) => m.nome === d.nome)) throw new Error(`Já existe a medida [${d.nome}].`);
          st.medidas.push({ texto });
        } else {
          if (d.tabela !== 'fVendas') throw new Error('Neste laboratório, colunas calculadas ficam em fVendas.');
          st.colunas.push({ texto });
        }
      } catch (e) { erroDax = e.message; }
      render();
    };
    box.querySelectorAll('[data-rmmed]').forEach((b) => b.addEventListener('click', () => { st.medidas.splice(Number(b.dataset.rmmed), 1); render(); }));
    box.querySelectorAll('[data-rmcol]').forEach((b) => b.addEventListener('click', () => { st.colunas.splice(Number(b.dataset.rmcol), 1); erroDax = ''; render(); }));
    box.querySelectorAll('[data-rmvis]').forEach((b) => b.addEventListener('click', () => { st.visuais.splice(Number(b.dataset.rmvis), 1); render(); }));
    box.querySelectorAll('[data-seg]').forEach((c) => c.addEventListener('change', () => {
      const s = c.dataset.seg;
      const sel = [...box.querySelectorAll(`[data-seg="${s}"]:checked`)].map((x) => x.value);
      if (sel.length) st.filtros[s] = sel; else delete st.filtros[s];
      render();
    }));
    box.querySelector('#criarVis').onclick = () => {
      const medida = box.querySelector('#vmed').value;
      if (!medida) return;
      st.visuais.push({ tipo: box.querySelector('#vtipo').value, eixo: box.querySelector('#veixo').value, medida });
      render();
    };
  }

  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; el.querySelectorAll('[data-aba]').forEach((x) => x.classList.toggle('ativa', x === b)); render(); }));
  confirmarReinicio(el, () => { labs.limpar('bi'); st = inicial(); erroDax = ''; render(); });
  render();
}

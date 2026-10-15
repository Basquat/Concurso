import { SEED, MISSOES_SQL, mesmoResultado, DIALETOS } from '../../../domain/sql/cenario.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const paraB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const deB64 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));

const EXEMPLOS = {
  'Tabelas do banco': "SELECT name, sql FROM sqlite_master WHERE type = 'table';",
  'Servidores e secretarias': 'SELECT s.nome, s.cargo, c.nome AS secretaria\nFROM servidores s\nJOIN secretarias c ON c.id = s.secretaria_id\nORDER BY c.nome, s.nome;',
  'Contratos vigentes em 2027': "SELECT fornecedor, objeto, valor\nFROM contratos\nWHERE fim >= '2027-01-01'\nORDER BY valor DESC;",
  'Testar chave estrangeira': "INSERT INTO servidores (nome, cargo, salario, admissao, secretaria_id)\nVALUES ('Teste', 'Estagiário', 1200, '2026-10-01', 99);",
  'Transação com ROLLBACK': "BEGIN;\nDELETE FROM contratos;\nSELECT COUNT(*) AS restantes FROM contratos;\nROLLBACK;\nSELECT COUNT(*) AS depois_do_rollback FROM contratos;",
};

export default async function sql(el, { servico, labs, sql: motor }) {
  el.innerHTML = cabecalhoLab('sql') + `<div class="split"><div class="pilha">
      <div class="card" style="display:grid;grid-template-columns:minmax(150px,200px) minmax(0,1fr);gap:12px">
        <div><div class="pequeno muted" style="margin-bottom:4px">Objetos do banco</div><div id="arvore" class="pequeno mono"></div></div>
        <div class="pilha">
          <textarea id="ed" class="mono" rows="8" spellcheck="false" aria-label="Editor SQL">SELECT * FROM servidores LIMIT 5;</textarea>
          <div class="linha">
            <button class="btn primario" id="run">▶ Executar (Ctrl+Enter)</button>
            <button class="btn" id="plano">Plano de execução</button>
            <select id="ex" aria-label="Exemplos"><option value="">Exemplos…</option>${Object.keys(EXEMPLOS).map((k) => `<option>${esc(k)}</option>`).join('')}</select>
          </div>
        </div>
      </div>
      <div class="abas" role="tablist"><button class="ativa" data-aba="res">Resultado</button><button data-aba="er">Modelo ER</button><button data-aba="dia">SQLite × PostgreSQL × MySQL</button></div>
      <div class="card" id="painel" style="border-top-left-radius:0"><p class="muted">Carregando o SQLite (WebAssembly)…</p></div>
    </div><aside class="card" id="missoes"></aside></div>`;

  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'sql', missoes: MISSOES_SQL, servico });
  const ed = el.querySelector('#ed');
  const saida = el.querySelector('#painel');
  let db;
  let aba = 'res';
  let ultimo = '<p class="muted">Escreva uma consulta e clique em Executar.</p>';

  async function abrir(novo) {
    db?.fechar();
    const salvo = !novo && labs.carregar('sql');
    db = await motor.abrir(salvo ? deB64(salvo) : undefined);
    if (!salvo) db.executar(SEED);
    arvore();
  }

  try { await abrir(false); } catch (e) { saida.innerHTML = `<div class="callout err">${esc(e.message)}</div>`; return; }
  saida.innerHTML = ultimo;

  function consultar(q) { try { return db.executar(q).resultados[0]?.linhas ?? []; } catch { return []; } }

  function arvore() {
    const tabelas = consultar("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((l) => l[0]);
    const indices = consultar("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY name");
    el.querySelector('#arvore').innerHTML = tabelas.map((t) => {
      const cols = consultar(`PRAGMA table_info("${t.replace(/"/g, '""')}")`);
      const fks = consultar(`PRAGMA foreign_key_list("${t.replace(/"/g, '""')}")`).map((f) => f[3]);
      return `<details open><summary>▦ ${esc(t)}</summary><div style="padding-left:12px">${cols.map((c) => `<div title="${esc(c[2])}">${c[5] ? '🔑' : fks.includes(c[1]) ? '🔗' : '·'} ${esc(c[1])} <span class="muted">${esc(c[2].toLowerCase())}</span></div>`).join('')}</div></details>`;
    }).join('') + (indices.length ? `<div class="muted" style="margin-top:6px">Índices</div>${indices.map((i) => `<div>⚡ ${esc(i[0])}</div>`).join('')}` : '');
  }

  function tabela({ colunas, linhas }) {
    return `<div class="rolagem" style="margin-bottom:10px"><table class="tabela"><thead><tr>${colunas.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((v) => `<td class="${typeof v === 'number' ? 'num' : ''}">${v === null ? '<span class="muted">NULL</span>' : esc(typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="pequeno muted">${linhas.length} linha(s)</div>`;
  }

  function salvar() {
    try { labs.salvar('sql', paraB64(db.exportar())); } catch { /* transação aberta: salva na próxima */ }
  }

  function executar(texto, plano = false) {
    const q = plano ? `EXPLAIN QUERY PLAN ${texto.trim().replace(/;\s*$/, '').split(';').pop()}` : texto;
    let r;
    const t0 = performance.now();
    try {
      r = db.executar(q);
    } catch (e) {
      ultimo = `<div class="callout err"><strong>Erro do SQLite:</strong> <span class="mono">${esc(e.message)}</span>${/FOREIGN KEY/.test(e.message) ? '<p class="pequeno" style="margin:6px 0 0">A chave estrangeira impediu um registro órfão: a secretaria referenciada não existe.</p>' : ''}</div>`;
      mostrar('res');
      return;
    }
    const ms = (performance.now() - t0).toFixed(1);
    const ehConsulta = /^\s*(SELECT|WITH|PRAGMA|EXPLAIN)\b/i.test(q.split(';').filter((s) => s.trim()).pop() ?? '');
    ultimo = r.resultados.length
      ? r.resultados.map(tabela).join('') + `<div class="pequeno muted">${ms} ms</div>`
      : ehConsulta
        ? `<div class="callout">A consulta não retornou linhas (0 linhas, ${ms} ms).${/NOT\s+IN/i.test(q) ? ' Dica: se a subconsulta do NOT IN tiver algum NULL, a comparação vira "desconhecido" e nenhuma linha passa.' : ''}</div>`
        : `<div class="callout okc">Comando executado. Linhas afetadas: ${r.alteradas}. (${ms} ms)</div>`;
    if (plano) ultimo = `<p class="pequeno muted">Plano do SQLite: "SCAN" = leitura da tabela inteira; "SEARCH … USING INDEX" = acesso pelo índice.</p>` + ultimo;
    mostrar('res');
    arvore();
    salvar();
    const ultimoRes = r.resultados.at(-1)?.linhas;
    painel.verificar((m) => {
      if (m.referencia) return !!ultimoRes && !plano && mesmoResultado(ultimoRes, db.executar(m.referencia).resultados[0]?.linhas ?? [], m.ordenado);
      if (m.exigeTransacao && !(/\bBEGIN\b/i.test(texto) && /\b(COMMIT|END)\b/i.test(texto))) return false;
      return consultar(m.estado)[0]?.[0] === 1;
    });
  }

  function diagramaER() {
    const tabelas = consultar("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((l) => l[0]);
    const W = 190;
    const info = tabelas.map((t, i) => {
      const cols = consultar(`PRAGMA table_info("${t}")`);
      return { t, cols, fks: consultar(`PRAGMA foreign_key_list("${t}")`), x: 20 + (i % 3) * (W + 60), y: 20 + Math.floor(i / 3) * 210 };
    });
    const pos = Object.fromEntries(info.map((b) => [b.t, b]));
    const altura = Math.max(...info.map((b) => b.y + 30 + b.cols.length * 18), 200) + 20;
    const linhas = info.flatMap((b) => b.fks.map((f) => {
      const alvo = pos[f[2]];
      if (!alvo) return '';
      const yc = b.y + 34 + b.cols.findIndex((c) => c[1] === f[3]) * 18;
      const ya = alvo.y + 34 + Math.max(0, alvo.cols.findIndex((c) => c[1] === f[4])) * 18;
      const [x1, x2] = b.x < alvo.x ? [b.x + W, alvo.x] : b.x > alvo.x ? [b.x, alvo.x + W] : [b.x + W, alvo.x + W];
      return `<path d="M${x1},${yc} C${(x1 + x2) / 2 + (x1 === x2 ? 40 : 0)},${yc} ${(x1 + x2) / 2 + (x1 === x2 ? 40 : 0)},${ya} ${x2},${ya}" fill="none" stroke="var(--primary)" stroke-width="1.5" marker-end="url(#seta)"/>`;
    })).join('');
    const caixas = info.map((b) => `<g><rect x="${b.x}" y="${b.y}" width="${W}" height="${30 + b.cols.length * 18}" rx="6" fill="var(--surface)" stroke="var(--border)"/>
      <rect x="${b.x}" y="${b.y}" width="${W}" height="24" rx="6" fill="var(--primary-soft)"/><text x="${b.x + 8}" y="${b.y + 16}" font-weight="700" fill="var(--text)" font-size="12">${esc(b.t)}</text>
      ${b.cols.map((c, k) => `<text x="${b.x + 8}" y="${b.y + 38 + k * 18}" font-size="11" fill="var(--text)">${c[5] ? '🔑 ' : b.fks.some((f) => f[3] === c[1]) ? '🔗 ' : ''}${esc(c[1])} <tspan fill="var(--muted)">${esc(c[2].toLowerCase())}</tspan></text>`).join('')}</g>`).join('');
    return `<p class="pequeno muted">Gerado a partir do esquema atual (PRAGMA table_info / foreign_key_list). Setas: chave estrangeira → tabela referenciada. Crie tabelas e veja o diagrama mudar.</p>
      <div style="overflow:auto"><svg viewBox="0 0 ${3 * (W + 60)} ${altura}" style="min-width:640px;width:100%"><defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--primary)"/></marker></defs>${linhas}${caixas}</svg></div>`;
  }

  function mostrar(qual) {
    aba = qual;
    el.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === aba));
    if (aba === 'res') saida.innerHTML = ultimo;
    if (aba === 'er') saida.innerHTML = diagramaER();
    if (aba === 'dia') saida.innerHTML = `<p class="pequeno muted">Este laboratório executa SQLite. Use a tabela para adaptar o que aprendeu ao banco cobrado no edital.</p><div class="rolagem" style="max-height:none"><table class="tabela"><thead><tr><th>Recurso</th><th>SQLite (aqui)</th><th>PostgreSQL</th><th>MySQL</th></tr></thead><tbody>${DIALETOS.map((l) => `<tr>${l.map((c, i) => (i ? `<td class="mono pequeno">${esc(c)}</td>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.aba)));
  el.querySelector('#run').onclick = () => executar(ed.value);
  el.querySelector('#plano').onclick = () => executar(ed.value, true);
  el.querySelector('#ex').onchange = (e) => { if (e.target.value) { ed.value = EXEMPLOS[e.target.value]; e.target.value = ''; ed.focus(); } };
  ed.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); executar(ed.value); }
    if (e.key === 'Tab') { e.preventDefault(); ed.setRangeText('  ', ed.selectionStart, ed.selectionEnd, 'end'); }
  });
  confirmarReinicio(el, async () => { labs.limpar('sql'); await abrir(true); ultimo = '<div class="callout okc">Banco recriado com os dados originais.</div>'; mostrar('res'); });
  return () => db?.fechar();
}

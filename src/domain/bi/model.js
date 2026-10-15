// Laboratório de BI inspirado no fluxo do Power BI: Power Query (etapas aplicadas), modelo
// estrela com relacionamentos, medidas em um subconjunto de DAX e visuais com contexto de filtro.
// Dados 100% fictícios gerados de forma determinística.

function rng(seed) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun'];

export function dadosBrutos() {
  const dProduto = [
    { id: 1, produto: 'Notebook', categoria: 'Informática', preco: 3800 }, { id: 2, produto: 'Monitor', categoria: 'Informática', preco: 950 },
    { id: 3, produto: 'Cadeira', categoria: 'Mobiliário', preco: 720 }, { id: 4, produto: 'Mesa', categoria: 'Mobiliário', preco: 1100 },
    { id: 5, produto: 'Papel A4', categoria: 'Expediente', preco: 25 }, { id: 6, produto: 'Toner', categoria: 'Expediente', preco: 210 },
  ];
  const dRegiao = [{ id: 1, regiao: 'Norte' }, { id: 2, regiao: 'Nordeste' }, { id: 3, regiao: 'Centro-Oeste' }, { id: 4, regiao: 'Sudeste' }, { id: 5, regiao: 'Sul' }];
  const r = rng(2026);
  const fVendas = [];
  for (let i = 1; i <= 120; i++) {
    const p = dProduto[Math.floor(r() * dProduto.length)];
    const qtd = 1 + Math.floor(r() * (p.preco < 300 ? 40 : 6));
    const valor = qtd * p.preco * (0.9 + r() * 0.2);
    fVendas.push({
      id_venda: i, mes: MESES[Math.floor(r() * MESES.length)], id_produto: p.id,
      id_regiao: i % 41 === 0 ? '' : 1 + Math.floor(r() * 5), quantidade: qtd,
      valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // texto, como num CSV brasileiro
    });
  }
  for (const i of [7, 33, 58, 90]) fVendas.push({ ...fVendas[i] }); // duplicatas de importação
  return { fVendas, dProduto, dRegiao };
}

// ---------- Power Query ----------

export const ETAPAS = {
  removerDuplicadas: { nome: 'Remover linhas duplicadas', coluna: false },
  removerVazios: { nome: 'Remover linhas com valor vazio na coluna', coluna: true },
  tipoNumero: { nome: 'Alterar tipo para número decimal (pt-BR)', coluna: true },
};

export function aplicarEtapas(linhas, etapas) {
  let out = linhas.map((l) => ({ ...l }));
  for (const e of etapas) {
    if (e.op === 'removerDuplicadas') {
      const vistos = new Set();
      out = out.filter((l) => { const k = JSON.stringify(l); return !vistos.has(k) && vistos.add(k); });
    } else if (e.op === 'removerVazios') out = out.filter((l) => l[e.coluna] !== '' && l[e.coluna] !== null && l[e.coluna] !== undefined);
    else if (e.op === 'tipoNumero') {
      out = out.map((l) => {
        const v = l[e.coluna];
        const n = typeof v === 'number' ? v : Number(String(v).replace(/\./g, '').replace(',', '.'));
        return { ...l, [e.coluna]: Number.isFinite(n) ? n : null };
      });
    }
  }
  return out;
}

// ---------- modelo e contexto de filtro ----------

// modelo: { tabelas: { fVendas: [...], dProduto: [...], dRegiao: [...] }, relacoes: [{ de: 'fVendas.id_produto', para: 'dProduto.id' }], colunasCalc: [] }
export const parseCol = (s) => { const m = /^(\w+)\[([^\]]+)\]$/.exec(String(s).trim()); return m ? { tabela: m[1], coluna: m[2] } : null; };

function valorColuna(modelo, linha, col) {
  if (col.tabela === 'fVendas') return linha[col.coluna];
  const rel = modelo.relacoes.find((r) => r.de.startsWith('fVendas.') && r.para.startsWith(`${col.tabela}.`));
  if (!rel) return undefined; // sem relacionamento o filtro não se propaga
  const chave = linha[rel.de.split('.')[1]];
  const dim = modelo.tabelas[col.tabela].find((d) => d[rel.para.split('.')[1]] === chave);
  return dim?.[col.coluna];
}

export function alcancavel(modelo, col) {
  return col.tabela === 'fVendas' || modelo.relacoes.some((r) => r.de.startsWith('fVendas.') && r.para.startsWith(`${col.tabela}.`));
}

// filtros: { 'dRegiao[regiao]': ['Sul'] }
export function linhasNoContexto(modelo, filtros) {
  const ativos = Object.entries(filtros).map(([k, vals]) => [parseCol(k), vals]).filter(([c]) => c && alcancavel(modelo, c));
  return modelo.tabelas.fVendas.filter((l) => ativos.every(([c, vals]) => vals.includes(valorColuna(modelo, l, c))));
}

// ---------- DAX (subconjunto) ----------

class ErroDax extends Error {}

function lexer(s) {
  const re = /\s*(?:(\d+(?:\.\d+)?)|("(?:[^"]|"")*")|(\w+)\[([^\]]+)\]|\[([^\]]+)\]|([A-Za-zÀ-ÿ_]\w*)|(<=|>=|<>|[-+*/(),=<>&]))/y;
  const toks = [];
  let i = 0;
  while (i < s.length && /\S/.test(s.slice(i))) {
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) throw new ErroDax(`Sintaxe inválida perto de "${s.slice(i, i + 12)}"`);
    i = re.lastIndex;
    if (m[1]) toks.push({ t: 'num', v: Number(m[1]) });
    else if (m[2]) toks.push({ t: 'str', v: m[2].slice(1, -1).replace(/""/g, '"') });
    else if (m[3]) toks.push({ t: 'col', v: `${m[3]}[${m[4]}]` });
    else if (m[5]) toks.push({ t: 'med', v: m[5] });
    else if (m[6]) toks.push({ t: 'id', v: m[6].toUpperCase(), raw: m[6] });
    else toks.push({ t: 'op', v: m[7] });
  }
  return toks;
}

function parse(toks) {
  let p = 0;
  const ver = (v) => toks[p]?.t === 'op' && toks[p].v === v;
  const nivel = (ops, prox) => () => { let a = prox(); while (toks[p]?.t === 'op' && ops.includes(toks[p].v)) { const op = toks[p++].v; a = { k: 'bin', op, a, b: prox() }; } return a; };
  const prim = () => {
    const t = toks[p++];
    if (!t) throw new ErroDax('Expressão incompleta.');
    if (t.t === 'num' || t.t === 'str') return { k: 'val', v: t.v };
    if (t.t === 'col') return { k: 'col', c: parseCol(t.v) };
    if (t.t === 'med') return { k: 'med', nome: t.v };
    if (t.t === 'op' && t.v === '-') return { k: 'neg', a: prim() };
    if (t.t === 'op' && t.v === '(') { const e = comp(); if (!ver(')')) throw new ErroDax('Falta ")".'); p++; return e; }
    if (t.t === 'id' && ver('(')) {
      p++;
      const args = [];
      if (!ver(')')) { do { args.push(comp()); } while (ver(',') && ++p); }
      if (!ver(')')) throw new ErroDax(`Falta ")" em ${t.v}.`);
      p++;
      return { k: 'fn', nome: t.v, args };
    }
    if (t.t === 'id') return { k: 'tab', nome: t.raw };
    throw new ErroDax(`Token inesperado: ${t.v}`);
  };
  const termo = nivel(['*', '/'], prim);
  const soma = nivel(['+', '-', '&'], termo);
  const comp = nivel(['=', '<>', '<', '>', '<=', '>='], soma);
  const ast = comp();
  if (p < toks.length) throw new ErroDax(`Sobrou "${toks[p].v}" no fim da expressão.`);
  return ast;
}

// "Nome = expressão" (medida) ou "fVendas[Nome] = expressão" (coluna calculada)
export function compilarDefinicao(texto) {
  const m = /^\s*(?:(\w+)\[([^\]]+)\]|([^=[\]]+?))\s*=\s*([\s\S]+)$/.exec(texto);
  if (!m) throw new ErroDax('Use o formato: Nome da Medida = EXPRESSÃO');
  const ast = parse(lexer(m[4]));
  return m[1] ? { tipo: 'coluna', tabela: m[1], nome: m[2], ast, texto } : { tipo: 'medida', nome: m[3].trim(), ast, texto };
}

const AGREGACOES = { SUM: (v) => v.reduce((s, x) => s + x, 0), AVERAGE: (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null), MIN: (v) => (v.length ? Math.min(...v) : null), MAX: (v) => (v.length ? Math.max(...v) : null) };

function avaliar(n, ctx) {
  switch (n.k) {
    case 'val': return n.v;
    case 'neg': return -avaliar(n.a, ctx);
    case 'col':
      if (!ctx.linha) throw new ErroDax(`A coluna ${n.c.tabela}[${n.c.coluna}] não pode ser usada sozinha numa medida: agregue-a (ex.: SUM).`);
      if (n.c.tabela !== 'fVendas') throw new ErroDax(`Use RELATED(${n.c.tabela}[${n.c.coluna}]) para ler coluna de outra tabela.`);
      return ctx.linha[n.c.coluna];
    case 'med': {
      const def = ctx.medidas.find((m) => m.nome === n.nome);
      if (!def) throw new ErroDax(`A medida [${n.nome}] não existe.`);
      if ((ctx.prof ?? 0) > 8) throw new ErroDax('Dependência circular entre medidas.');
      return avaliar(def.ast, { ...ctx, linha: null, prof: (ctx.prof ?? 0) + 1 });
    }
    case 'bin': {
      const a = avaliar(n.a, ctx);
      const b = avaliar(n.b, ctx);
      switch (n.op) {
        case '+': return (a ?? 0) + (b ?? 0);
        case '-': return (a ?? 0) - (b ?? 0);
        case '*': return a === null || b === null ? null : a * b;
        case '/': if (!b) throw new ErroDax('Divisão por zero: prefira DIVIDE(numerador, denominador), que devolve vazio.'); return a / b;
        case '&': return `${a ?? ''}${b ?? ''}`;
        default: return { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[n.op];
      }
    }
    case 'fn': return funcao(n, ctx);
    default: throw new ErroDax('Expressão inválida.');
  }
}

function funcao(n, ctx) {
  const linhas = () => linhasNoContexto(ctx.modelo, ctx.filtros);
  const col = (i) => { const a = n.args[i]; if (a?.k !== 'col') throw new ErroDax(`${n.nome} espera uma coluna, ex.: ${n.nome}(fVendas[valor]).`); return a.c; };
  if (AGREGACOES[n.nome]) {
    const c = col(0);
    if (c.tabela !== 'fVendas') throw new ErroDax(`Neste laboratório, agregue colunas da tabela fato (fVendas).`);
    const valores = linhas().map((l) => l[c.coluna]);
    if (valores.some((v) => typeof v === 'string' && v !== '')) throw new ErroDax(`A função ${n.nome} não pode trabalhar com valores do tipo Texto. Altere o tipo de fVendas[${c.coluna}] no Power Query.`);
    return AGREGACOES[n.nome](valores.filter((v) => typeof v === 'number'));
  }
  switch (n.nome) {
    case 'COUNTROWS': {
      if (n.args[0]?.k !== 'tab' || n.args[0].nome !== 'fVendas') throw new ErroDax('Use COUNTROWS(fVendas).');
      return linhas().length;
    }
    case 'DISTINCTCOUNT': { const c = col(0); return new Set(linhas().map((l) => valorColuna(ctx.modelo, l, c))).size; }
    case 'DIVIDE': {
      const a = avaliar(n.args[0], ctx);
      const b = avaliar(n.args[1], ctx);
      return !b ? (n.args[2] ? avaliar(n.args[2], ctx) : null) : a / b;
    }
    case 'RELATED': {
      if (!ctx.linha) throw new ErroDax('RELATED só funciona em contexto de linha (colunas calculadas).');
      const c = col(0);
      if (!alcancavel(ctx.modelo, c)) throw new ErroDax(`Não há relacionamento entre fVendas e ${c.tabela}.`);
      return valorColuna(ctx.modelo, ctx.linha, c);
    }
    case 'CALCULATE': {
      const filtros = { ...ctx.filtros };
      for (const f of n.args.slice(1)) {
        if (f.k !== 'bin' || f.op !== '=' || f.a.k !== 'col' || f.b.k !== 'val') throw new ErroDax('Filtros do CALCULATE neste laboratório: Tabela[coluna] = "valor".');
        filtros[`${f.a.c.tabela}[${f.a.c.coluna}]`] = [f.b.v]; // substitui o filtro existente na coluna, como no DAX
      }
      return avaliar(n.args[0], { ...ctx, filtros, linha: null });
    }
    case 'BLANK': return null;
    default: throw new ErroDax(`Função ${n.nome} não implementada no laboratório (suportadas: SUM, AVERAGE, MIN, MAX, COUNTROWS, DISTINCTCOUNT, DIVIDE, CALCULATE, RELATED).`);
  }
}

export function montarModelo(bruto, etapas, relacoes, colunasCalc = []) {
  const modelo = { tabelas: { ...bruto, fVendas: aplicarEtapas(bruto.fVendas, etapas) }, relacoes };
  for (const c of colunasCalc) {
    modelo.tabelas.fVendas = modelo.tabelas.fVendas.map((l) => ({ ...l, [c.nome]: avaliar(c.ast, { modelo, filtros: {}, medidas: [], linha: l }) }));
  }
  return modelo;
}

export function valorMedida(modelo, medidas, nome, filtros = {}) {
  const def = medidas.find((m) => m.nome === nome);
  if (!def) throw new ErroDax(`Medida ${nome} não encontrada.`);
  return avaliar(def.ast, { modelo, medidas, filtros });
}

// Série para um visual: um ponto por valor distinto do eixo.
export function serie(modelo, medidas, eixo, medida, filtros = {}) {
  const c = parseCol(eixo);
  const valores = [...new Set(modelo.tabelas[c.tabela].map((l) => l[c.coluna]))].filter((v) => v !== '' && v !== undefined);
  if (c.coluna === 'mes') valores.sort((a, b) => MESES.indexOf(a) - MESES.indexOf(b));
  else valores.sort((a, b) => String(a).localeCompare(String(b)));
  return valores.map((v) => ({ rotulo: v, valor: valorMedida(modelo, medidas, medida, { ...filtros, [eixo]: [v] }) }));
}

// ---------- missões ----------

function referencia() {
  const b = dadosBrutos();
  const limpo = aplicarEtapas(b.fVendas, [{ op: 'removerDuplicadas' }, { op: 'removerVazios', coluna: 'id_regiao' }, { op: 'tipoNumero', coluna: 'valor' }]);
  const total = limpo.reduce((s, l) => s + l.valor, 0);
  const sul = limpo.filter((l) => l.id_regiao === 5).reduce((s, l) => s + l.valor, 0);
  return { linhas: limpo.length, total, ticket: total / limpo.length, sul };
}
let REF;
const ref = () => (REF ??= referencia());
const perto = (a, b) => typeof a === 'number' && Math.abs(a - b) < 0.01;
const medidaCom = (s, re, alvo) => s.medidas.some((m) => re.test(m.texto) && (() => { try { return perto(valorMedida(s.modelo, s.medidas, m.nome), alvo); } catch { return false; } })());

export const MISSOES_BI = [
  { id: 'limpeza', titulo: 'Power Query: dados limpos', xp: 40, descricao: 'Remova duplicadas, exclua vendas sem região e converta fVendas[valor] para número.', check: (s) => s.modelo.tabelas.fVendas.length === ref().linhas && s.modelo.tabelas.fVendas.every((l) => typeof l.valor === 'number') },
  { id: 'relacao', titulo: 'Modelo estrela', xp: 30, descricao: 'Crie o relacionamento que falta entre fVendas e dRegiao.', check: (s) => s.modelo.relacoes.some((r) => r.de === 'fVendas.id_regiao' && r.para === 'dRegiao.id') },
  { id: 'faturamento', titulo: 'Primeira medida', xp: 30, descricao: 'Crie uma medida de faturamento total com SUM.', check: (s) => medidaCom(s, /SUM\s*\(/i, ref().total) },
  { id: 'ticket', titulo: 'Ticket médio', xp: 40, descricao: 'Crie a medida Ticket Médio = faturamento ÷ número de vendas usando DIVIDE.', check: (s) => medidaCom(s, /DIVIDE\s*\(/i, ref().ticket) },
  { id: 'calculate', titulo: 'Contexto de filtro', xp: 50, descricao: 'Crie uma medida com CALCULATE que retorne o faturamento somente da região Sul.', check: (s) => medidaCom(s, /CALCULATE\s*\(/i, ref().sul) },
  { id: 'visual', titulo: 'Dashboard regional', xp: 30, descricao: 'Monte um gráfico de barras de faturamento por dRegiao[regiao] (com valores diferentes por região).', check: (s) => s.visuais.some((v) => v.tipo === 'barras' && v.eixo === 'dRegiao[regiao]' && (() => { try { return new Set(serie(s.modelo, s.medidas, v.eixo, v.medida).map((p) => p.valor)).size > 1; } catch { return false; } })()) },
];

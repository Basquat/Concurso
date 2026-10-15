// Motor de planilha: avalia fórmulas no estilo Excel/Calc (nomes em português e inglês).
// Separador de argumentos: ";" (pt-BR, decimal com vírgula) ou "," (en, decimal com ponto).

export class ErroCel {
  constructor(cod) { this.cod = cod; }
  toString() { return this.cod; }
}
const E = {
  div: new ErroCel('#DIV/0!'), valor: new ErroCel('#VALOR!'), nome: new ErroCel('#NOME?'),
  ref: new ErroCel('#REF!'), na: new ErroCel('#N/D'), circ: new ErroCel('#CIRC!'),
};

export const colIdx = (c) => [...c].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
export const colNome = (i) => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
export const ref = (c, l) => `${colNome(c)}${l}`;
export const parseRef = (r) => { const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(r.toUpperCase()); return m ? { c: colIdx(m[1]), l: Number(m[2]) } : null; };

// Converte o texto digitado: número (aceita vírgula decimal), fórmula ou texto.
export function interpretar(raw) {
  const s = String(raw ?? '').trim();
  if (s === '') return null;
  if (s.startsWith('=')) return { formula: s.slice(1) };
  const n = s.replace(/^R\$\s*/, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(n)) return Number(n.replace(/\./g, '').replace(',', '.'));
  if (/^-?\d+(,\d+)?$/.test(n)) return Number(n.replace(',', '.'));
  if (/^-?\d*\.\d+$/.test(n)) return Number(n);
  return s;
}

// ---------- lexer / parser ----------

// Fórmula com ";" fora de textos = estilo pt-BR, então "2,5" é número decimal.
function lexer(f) {
  const toks = [];
  const ptBR = f.replace(/"(?:[^"]|"")*"/g, '').includes(';');
  const re = new RegExp(String.raw`\s*(?:(\d+(?:[.${ptBR ? ',' : ''}]\d+)?)|("(?:[^"]|"")*")|(\$?[A-Za-z]+\$?\d+(?![\w.(]))|([A-Za-zÀ-ÿ_][\wÀ-ÿ.]*)|(<=|>=|<>|[-+*/^&=<>():;,]))`, 'y');
  let i = 0;
  while (i < f.length) {
    if (/^\s+$/.test(f.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(f);
    if (!m) throw E.nome;
    i = re.lastIndex;
    if (m[1]) toks.push({ t: 'num', v: Number(m[1].replace(',', '.')) });
    else if (m[2]) toks.push({ t: 'str', v: m[2].slice(1, -1).replace(/""/g, '"') });
    else if (m[3]) toks.push({ t: 'ref', v: m[3].toUpperCase() });
    else if (m[4]) toks.push({ t: 'id', v: m[4] });
    else toks.push({ t: 'op', v: m[5] });
  }
  return toks;
}

function parser(toks) {
  let p = 0;
  const ver = (v) => toks[p]?.t === 'op' && toks[p].v === v;
  const pega = (v) => { if (!ver(v)) throw E.nome; p++; };
  const nivel = (ops, prox) => () => {
    let a = prox();
    while (toks[p]?.t === 'op' && ops.includes(toks[p].v)) { const op = toks[p++].v; a = { k: 'bin', op, a, b: prox() }; }
    return a;
  };
  const primario = () => {
    const t = toks[p++];
    if (!t) throw E.nome;
    if (t.t === 'num') return { k: 'val', v: t.v };
    if (t.t === 'str') return { k: 'val', v: t.v };
    if (t.t === 'op' && t.v === '-') return { k: 'neg', a: potencia() };
    if (t.t === 'op' && t.v === '+') return potencia();
    if (t.t === 'op' && t.v === '(') { const e = comparacao(); pega(')'); return e; }
    if (t.t === 'ref') {
      if (ver(':')) { p++; const b = toks[p++]; if (b?.t !== 'ref') throw E.ref; return { k: 'range', a: parseRef(t.v), b: parseRef(b.v) }; }
      return { k: 'ref', r: parseRef(t.v) };
    }
    if (t.t === 'id') {
      const nome = normalizar(t.v);
      if (ver('(')) {
        p++;
        const args = [];
        if (!ver(')')) { do { args.push(comparacao()); } while ((ver(';') || ver(',')) && ++p); }
        pega(')');
        return { k: 'fn', nome, args };
      }
      if (['VERDADEIRO', 'TRUE'].includes(nome)) return { k: 'val', v: true };
      if (['FALSO', 'FALSE'].includes(nome)) return { k: 'val', v: false };
    }
    throw E.nome;
  };
  const potencia = nivel(['^'], primario);
  const termo = nivel(['*', '/'], potencia);
  const soma = nivel(['+', '-'], termo);
  const concat = nivel(['&'], soma);
  const comparacao = nivel(['=', '<>', '<', '>', '<=', '>='], concat);
  const ast = comparacao();
  if (p < toks.length) throw E.nome;
  return ast;
}

const normalizar = (s) => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ---------- avaliação ----------

const vazio = (v) => v === null || v === undefined || v === '';

function num(v) {
  if (v instanceof ErroCel) throw v;
  if (vazio(v)) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = interpretar(v);
  if (typeof n === 'number') return n;
  throw E.valor;
}

const txt = (v) => {
  if (v instanceof ErroCel) throw v;
  if (vazio(v)) return '';
  if (typeof v === 'boolean') return v ? 'VERDADEIRO' : 'FALSO';
  return typeof v === 'number' ? String(v).replace('.', ',') : String(v);
};

function comparar(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (vazio(a) && typeof b === 'number') return -b;
  if (vazio(b) && typeof a === 'number') return a;
  return txt(a).toLowerCase().localeCompare(txt(b).toLowerCase());
}

function criterio(c) {
  const m = typeof c === 'string' ? /^(<=|>=|<>|<|>|=)?(.*)$/.exec(c) : null;
  const op = m?.[1] ?? '=';
  let alvo = m ? m[2] : c;
  const n = typeof alvo === 'string' ? interpretar(alvo) : alvo;
  if (typeof n === 'number') alvo = n;
  return (v) => {
    if (typeof alvo === 'number' && typeof v !== 'number') return op === '<>';
    const d = comparar(v, alvo);
    return { '=': d === 0, '<>': d !== 0, '<': d < 0, '>': d > 0, '<=': d <= 0, '>=': d >= 0 }[op];
  };
}

const FUNCOES = {
  SOMA: (a) => numerosDe(a).reduce((s, x) => s + x, 0),
  MEDIA: (a) => { const n = numerosDe(a); if (!n.length) throw E.div; return n.reduce((s, x) => s + x, 0) / n.length; },
  MINIMO: (a) => { const n = numerosDe(a); return n.length ? Math.min(...n) : 0; },
  MAXIMO: (a) => { const n = numerosDe(a); return n.length ? Math.max(...n) : 0; },
  'CONT.NUM': (a) => a.flat().filter((v) => typeof v === 'number').length,
  'CONT.VALORES': (a) => a.flat().filter((v) => !vazio(v)).length,
  'CONT.SE': ([faixa, c]) => faixa.filter(criterio(c)).length,
  SOMASE: ([faixa, c, soma]) => { const f = criterio(c); return (soma ?? faixa).reduce((s, v, i) => s + (f(faixa[i]) && typeof v === 'number' ? v : 0), 0); },
  SE: null, // avaliada de forma preguiçosa em avaliarNo
  E: (a) => a.flat().every((v) => num(v) !== 0),
  OU: (a) => a.flat().some((v) => num(v) !== 0),
  NAO: ([v]) => num(v) === 0,
  ARRED: ([v, d = 0]) => { const f = 10 ** num(d); return Math.round(num(v) * f + Math.sign(num(v)) * 1e-9) / f; },
  ABS: ([v]) => Math.abs(num(v)),
  CONCATENAR: (a) => a.flat().map(txt).join(''),
  PROCV: ([valor, tabela, col, aprox = true], larg) => {
    const c = num(col);
    if (c < 1 || c > larg) throw E.ref;
    const linhas = [];
    for (let i = 0; i < tabela.length; i += larg) linhas.push(tabela.slice(i, i + larg));
    let achou = null;
    if (num(aprox) === 0) achou = linhas.find((l) => comparar(l[0], valor) === 0);
    else for (const l of linhas) { if (comparar(l[0], valor) <= 0) achou = l; else break; }
    if (!achou) throw E.na;
    return achou[c - 1];
  },
};
Object.assign(FUNCOES, {
  SUM: FUNCOES.SOMA, AVERAGE: FUNCOES.MEDIA, MIN: FUNCOES.MINIMO, MAX: FUNCOES.MAXIMO, COUNT: FUNCOES['CONT.NUM'],
  COUNTA: FUNCOES['CONT.VALORES'], COUNTIF: FUNCOES['CONT.SE'], SUMIF: FUNCOES.SOMASE, AND: FUNCOES.E, OR: FUNCOES.OU,
  NOT: FUNCOES.NAO, ROUND: FUNCOES.ARRED, CONCAT: FUNCOES.CONCATENAR, VLOOKUP: FUNCOES.PROCV,
});

function numerosDe(args) {
  const out = [];
  for (const a of args) {
    if (Array.isArray(a)) { for (const v of a) { if (v instanceof ErroCel) throw v; if (typeof v === 'number') out.push(v); } } else out.push(num(a));
  }
  return out;
}

// Avalia todas as células. Retorna { valores: {A1: valor|ErroCel} }.
export function avaliarPlanilha(celulas) {
  const valores = {};
  const visitando = new Set();
  const asts = {};

  const valorDe = (r) => {
    if (r in valores) return valores[r];
    const bruto = interpretar(celulas[r]);
    if (!bruto || typeof bruto !== 'object') return (valores[r] = bruto);
    if (visitando.has(r)) throw E.circ;
    visitando.add(r);
    let v;
    try {
      asts[r] ??= parser(lexer(bruto.formula));
      v = avaliarNo(asts[r]);
      if (Array.isArray(v)) v = E.valor;
    } catch (e) {
      if (!(e instanceof ErroCel)) throw e;
      v = e;
    } finally { visitando.delete(r); }
    return (valores[r] = v);
  };

  const faixa = ({ a, b }) => {
    const out = [];
    for (let l = Math.min(a.l, b.l); l <= Math.max(a.l, b.l); l++) {
      for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) out.push(valorDe(ref(c, l)));
    }
    return out;
  };

  const avaliarNo = (n) => {
    switch (n.k) {
      case 'val': return n.v;
      case 'ref': {
        const v = valorDe(ref(n.r.c, n.r.l));
        if (v instanceof ErroCel) throw v;
        return v;
      }
      case 'range': return faixa(n);
      case 'neg': return -num(avaliarNo(n.a));
      case 'bin': {
        const a = avaliarNo(n.a);
        const b = avaliarNo(n.b);
        switch (n.op) {
          case '+': return num(a) + num(b);
          case '-': return num(a) - num(b);
          case '*': return num(a) * num(b);
          case '/': { const d = num(b); if (d === 0) throw E.div; return num(a) / d; }
          case '^': return num(a) ** num(b);
          case '&': return txt(a) + txt(b);
          default: { const d = comparar(a, b); return { '=': d === 0, '<>': d !== 0, '<': d < 0, '>': d > 0, '<=': d <= 0, '>=': d >= 0 }[n.op]; }
        }
      }
      case 'fn': {
        if (n.nome === 'SE' || n.nome === 'IF') {
          const cond = num(avaliarNo(n.args[0])) !== 0;
          const ramo = n.args[cond ? 1 : 2];
          return ramo ? avaliarNo(ramo) : cond;
        }
        const fn = FUNCOES[n.nome];
        if (!fn) throw E.nome;
        const args = n.args.map(avaliarNo);
        const larg = n.args[1]?.k === 'range' ? Math.abs(n.args[1].b.c - n.args[1].a.c) + 1 : 1;
        try {
          return fn(args, larg);
        } catch (e) {
          if (e instanceof TypeError) throw E.valor; // ex.: CONT.SE com célula única em vez de intervalo
          throw e;
        }
      }
    }
    throw E.nome;
  };

  for (const r of Object.keys(celulas)) valorDe(r);
  return { valores };
}

// Desloca referências relativas (sem $) de uma fórmula — base de "preencher para baixo" e ordenação.
export function deslocarFormula(raw, dLin, dCol = 0) {
  if (!String(raw).startsWith('=')) return raw;
  return raw.split(/("(?:[^"]|"")*")/).map((parte, i) => (i % 2 ? parte : parte.replace(/(^|[^A-Za-z$])(\$?)([A-Z]+)(\$?)(\d+)(?![\w(])/g,
    (_, pre, dc, c, dl, l) => `${pre}${dc}${dc ? c : colNome(colIdx(c) + dCol)}${dl}${dl ? l : Number(l) + dLin}`))).join('');
}

// Reordena as linhas [de..ate] pela coluna `chave`, ajustando as fórmulas de cada linha movida.
export function ordenarLinhas(celulas, { de, ate, colunas, chave, desc }) {
  const { valores } = avaliarPlanilha(celulas);
  const linhas = [];
  for (let l = de; l <= ate; l++) linhas.push(l);
  linhas.sort((a, b) => {
    const d = comparar(valores[`${chave}${a}`] ?? '', valores[`${chave}${b}`] ?? '');
    return desc ? -d : d;
  });
  const novas = { ...celulas };
  linhas.forEach((origem, i) => {
    const destino = de + i;
    for (const c of colunas) {
      const v = celulas[`${c}${origem}`];
      if (v === undefined) delete novas[`${c}${destino}`];
      else novas[`${c}${destino}`] = deslocarFormula(v, destino - origem);
    }
  });
  return novas;
}

export function formatar(v) {
  if (v instanceof ErroCel) return v.cod;
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('pt-BR') : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  if (typeof v === 'boolean') return v ? 'VERDADEIRO' : 'FALSO';
  return v ?? '';
}

// Lógica proposicional: parser e tabela-verdade. Operadores: ~ ¬ (não), ^ ∧ & (e), v ∨ | (ou), -> → (se...então),
// <-> ↔ (se e somente se), xor ⊻. Variáveis: letras minúsculas exceto v.

export function tokenizar(s) {
  const t = String(s).replace(/<->|↔/g, ' I ').replace(/->|→/g, ' C ').replace(/xor|⊻/gi, ' X ').replace(/[~¬!]/g, ' N ').replace(/[∧^&]/g, ' E ').replace(/[∨|]|\bv\b/g, ' O ').replace(/([()])/g, ' $1 ');
  return t.split(/\s+/).filter(Boolean);
}

// Precedência: N > E > O/X > C > I
export function parse(s) {
  const tk = tokenizar(s);
  let i = 0;
  const ver = () => tk[i];
  const comer = (x) => { if (tk[i] !== x) throw new Error(`Esperado "${x}" na posição ${i + 1}`); i++; };
  const nivel = (ops, prox, dir = false) => () => {
    let a = prox();
    while (ops.includes(ver())) { const op = tk[i++]; const b = dir ? nivel(ops, prox, true)() : prox(); a = { op, a, b }; }
    return a;
  };
  const atomo = () => {
    const x = tk[i++];
    if (x === 'N') return { op: 'N', a: atomo() };
    if (x === '(') { const e = bi(); comer(')'); return e; }
    if (!x || !/^[a-uw-z]$/.test(x)) throw new Error(`Símbolo inesperado: ${x ?? 'fim'}`);
    return { v: x };
  };
  const e = nivel(['E'], atomo);
  const ou = nivel(['O', 'X'], e);
  const cond = nivel(['C'], ou, true);
  const bi = nivel(['I'], cond);
  const r = bi();
  if (i < tk.length) throw new Error(`Sobrou: ${tk.slice(i).join(' ')}`);
  return r;
}

export const variaveis = (n, s = new Set()) => { if (n.v) s.add(n.v); if (n.a) variaveis(n.a, s); if (n.b) variaveis(n.b, s); return [...s].sort(); };
export function avaliar(n, val) {
  if (n.v) return val[n.v];
  const a = avaliar(n.a, val);
  if (n.op === 'N') return !a;
  const b = avaliar(n.b, val);
  return { E: a && b, O: a || b, X: a !== b, C: !a || b, I: a === b }[n.op];
}

export function tabela(expr) {
  const n = parse(expr);
  const vs = variaveis(n);
  const linhas = [];
  for (let k = 0; k < 2 ** vs.length; k++) {
    const val = Object.fromEntries(vs.map((v, j) => [v, !((k >> (vs.length - 1 - j)) & 1)]));
    linhas.push({ val, r: avaliar(n, val) });
  }
  const vs2 = linhas.filter((l) => l.r).length;
  return { vars: vs, linhas, tipo: vs2 === linhas.length ? 'tautologia' : vs2 === 0 ? 'contradição' : 'contingência' };
}

export function equivalentes(e1, e2) {
  const vs = [...new Set([...variaveis(parse(e1)), ...variaveis(parse(e2))])];
  for (let k = 0; k < 2 ** vs.length; k++) {
    const val = Object.fromEntries(vs.map((v, j) => [v, !((k >> j) & 1)]));
    if (avaliar(parse(e1), val) !== avaliar(parse(e2), val)) return false;
  }
  return true;
}

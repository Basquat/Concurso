// Revisão espaçada (variante do algoritmo SM-2). Cada cartão guarda:
//   e = facilidade (1,3 a 3,0), i = intervalo em dias, r = acertos seguidos, l = lapsos (esquecimentos), v = vencimento (aaaa-mm-dd).
// Notas: 0 = errei, 1 = difícil, 2 = bom, 3 = fácil. Questões usam 2 (acerto) ou 0 (erro).

export const NOTAS = [['Errei', 'x'], ['Difícil', 'alerta'], ['Bom', 'ok'], ['Fácil', 'raio']];

const somarDias = (iso, n) => {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(a, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export function agendar(cartao, nota, hoje) {
  const c = { e: 2.5, i: 0, r: 0, l: 0, ...cartao };
  if (nota <= 0) {
    c.r = 0;
    c.i = 1;
    c.l += 1;
    c.e = Math.max(1.3, c.e - 0.2);
  } else {
    c.r += 1;
    if (c.r === 1) c.i = nota === 3 ? 3 : 1;
    else if (c.r === 2) c.i = nota === 1 ? 3 : nota === 3 ? 8 : 6;
    else c.i = Math.max(c.i + 1, Math.round(c.i * c.e * (nota === 1 ? 0.8 : nota === 3 ? 1.3 : 1)));
    c.e = Math.min(3, Math.max(1.3, c.e + (nota === 1 ? -0.15 : nota === 3 ? 0.15 : 0)));
  }
  c.i = Math.min(c.i, 365);
  c.v = somarDias(hoje, c.i);
  c.u = hoje;
  return c;
}

export const vencidos = (srs = {}, hoje) => Object.entries(srs).filter(([, c]) => c.v <= hoje).map(([id]) => id);

// Próximos dias com revisões marcadas (para o painel). Devolve [{ dia, n }].
export function previsao(srs = {}, hoje, dias = 7) {
  const out = [];
  for (let k = 0; k < dias; k++) {
    const d = somarDias(hoje, k);
    out.push({ dia: d, n: Object.values(srs).filter((c) => (k === 0 ? c.v <= d : c.v === d)).length });
  }
  return out;
}

// Domínio de um conjunto de cartões: 0 (novo) a 1 (consolidado), pela média de intervalos.
export const dominio = (cartoes) => (cartoes.length ? cartoes.reduce((s, c) => s + Math.min(1, (c?.i ?? 0) / 21), 0) / cartoes.length : 0);

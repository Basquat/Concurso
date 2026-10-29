// Motor dos laboratórios de treino. Cada laboratório (src/domain/treinos/<grupo>.js) é uma lista de exercícios:
//   { tipo: 'calc', id, titulo, formula, gerar(rng) → { enunciado, resposta, unidade?, passos?, tol?, aceitas? } }
//   { tipo: 'classificar', id, titulo, pergunta?, categorias: [...], itens: [[texto, categoria, explicação?], ...] }
//   { tipo: 'ordenar', id, titulo, passos: [...na ordem correta], explicacao? }

// Gerador pseudoaleatório com semente (mulberry32): exercícios reproduzíveis nos testes.
export function sorteador(semente = Date.now()) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const escolha = (rng, lista) => lista[Math.floor(rng() * lista.length)];
export const inteiro = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
export function embaralhar(lista, rng = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const arred = (n, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas;
// Formato brasileiro para enunciados e explicações: 1.234,56.
export const br = (n, casas = 2) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas });
export const reais = (n) => `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// "1.234,56" e "1234.56" → número. Com vírgula, pontos são milhar; sem vírgula, o ponto é decimal.
export function numero(s) {
  let t = String(s ?? '').trim().replace(/\s|R\$|%/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  return t === '' ? NaN : Number(t);
}
const normal = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();

export function conferir(ex, resposta) {
  if (typeof ex.resposta === 'number') {
    const n = numero(resposta);
    const tol = ex.tol ?? Math.max(0.011, Math.abs(ex.resposta) * 0.001);
    return Number.isFinite(n) && Math.abs(n - ex.resposta) <= tol;
  }
  return [ex.resposta, ...(ex.aceitas ?? [])].some((r) => normal(r) === normal(resposta));
}

export const rodada = (itens, n = 10, rng = Math.random) => embaralhar(itens, rng).slice(0, Math.min(n, itens.length));
export const conferirOrdem = (passos, ordem) => ordem.map((p, i) => p === passos[i]);

// Missões derivadas dos exercícios: 3 cálculos certos, rodada com 80%+ ou ordem correta.
export function missoesDe(spec) {
  return spec.exercicios.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    xp: e.tipo === 'calc' ? 20 : 15,
    descricao: e.tipo === 'calc' ? 'Acerte 3 cálculos.' : e.tipo === 'classificar' ? 'Faça uma rodada com 80% ou mais de acertos.' : 'Coloque todas as etapas na ordem correta.',
    checar: (s) => (e.tipo === 'calc' ? (s.acertos?.[e.id] ?? 0) >= 3 : e.tipo === 'classificar' ? (s.melhor?.[e.id] ?? 0) >= 80 : !!s.ordenado?.[e.id]),
  }));
}

// Validação estrutural usada pelos testes: todo exercício precisa ser respondível.
export function validar(id, spec, semente = 1) {
  const erros = [];
  if (!spec?.exercicios?.length) return [`${id}: sem exercícios`];
  const rng = sorteador(semente);
  const ids = new Set();
  for (const e of spec.exercicios) {
    const onde = `${id}/${e.id}`;
    if (ids.has(e.id)) erros.push(`${onde}: id repetido`);
    ids.add(e.id);
    if (e.tipo === 'calc') {
      for (let k = 0; k < 40; k++) {
        const x = e.gerar(rng);
        if (!x.enunciado) erros.push(`${onde}: sem enunciado`);
        if (typeof x.resposta === 'number' ? !Number.isFinite(x.resposta) : !String(x.resposta ?? '').trim()) { erros.push(`${onde}: resposta inválida (${x.resposta}) em "${x.enunciado}"`); break; }
        if (!conferir(x, typeof x.resposta === 'number' ? String(x.resposta) : x.resposta)) erros.push(`${onde}: a própria resposta não confere`);
      }
    } else if (e.tipo === 'classificar') {
      if (e.categorias.length < 2) erros.push(`${onde}: menos de 2 categorias`);
      if (e.itens.length < 5) erros.push(`${onde}: menos de 5 itens`);
      for (const [t, c] of e.itens) if (!e.categorias.includes(c)) erros.push(`${onde}: "${t}" em categoria inexistente "${c}"`);
      for (const c of e.categorias) if (!e.itens.some((i) => i[1] === c)) erros.push(`${onde}: categoria "${c}" sem itens`);
    } else if (e.tipo === 'ordenar') {
      if (e.passos.length < 3) erros.push(`${onde}: menos de 3 etapas`);
      if (new Set(e.passos).size !== e.passos.length) erros.push(`${onde}: etapas repetidas`);
    } else erros.push(`${onde}: tipo desconhecido ${e.tipo}`);
  }
  return erros;
}

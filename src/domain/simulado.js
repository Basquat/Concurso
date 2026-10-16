// Simulado no formato do edital: composição por área (ex.: 12 Português, 6 Lógica, 12 Adm. Pública, 30 Específicos),
// pontuação ponderada e critério de aprovação (≥ 50% dos pontos sem zerar nenhuma área).
import { embaralhar, corrigir } from './quiz.js';

/**
 * @param {object[]} questoes banco completo
 * @param {{ area: string, disciplina?: string, n: number, valor?: number }[]} composicao
 * @param {{ preferir?: (q) => number, rng?: () => number }} op preferir: menor = escolhida antes (ex.: não respondidas)
 */
export function comporSimulado(questoes, composicao, { preferir = () => 0, rng = Math.random } = {}) {
  const usadas = new Set();
  const itens = [];
  const faltas = [];
  for (const parte of composicao) {
    const base = embaralhar(questoes.filter((q) => q.area === parte.area && !usadas.has(q.id)), rng).sort((a, b) => preferir(a) - preferir(b));
    const escolhidas = base.slice(0, parte.n);
    escolhidas.forEach((q) => { usadas.add(q.id); itens.push({ q, area: parte.area, disciplina: parte.disciplina ?? q.disciplina, valor: parte.valor ?? 1 }); });
    if (escolhidas.length < parte.n) faltas.push({ area: parte.area, pedido: parte.n, obtido: escolhidas.length });
  }
  return { itens, faltas };
}

// respostas: { [idQuestao]: índice }
export function apurarProva(itens, respostas) {
  const porArea = {};
  let pontos = 0;
  let max = 0;
  let acertos = 0;
  for (const it of itens) {
    const a = (porArea[it.area] ??= { disciplina: it.disciplina, total: 0, acertos: 0, pontos: 0, max: 0 });
    const ok = corrigir(it.q, respostas[it.q.id]);
    a.total++;
    a.max += it.valor;
    max += it.valor;
    if (ok) { a.acertos++; a.pontos += it.valor; pontos += it.valor; acertos++; }
  }
  const zerou = Object.values(porArea).some((a) => a.total > 0 && a.acertos === 0);
  return { porArea, pontos, max, acertos, total: itens.length, pct: max ? Math.round((pontos / max) * 100) : 0, aprovado: max > 0 && pontos >= max / 2 && !zerou, zerou };
}

// Provas fixas numeradas (1, 2, 3…): cada área é ordenada de forma estável pelo id e a prova k pega a fatia k;
// com banco suficiente, as provas não repetem questões entre si.
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
export function provaFixa(questoes, composicao, k) {
  const itens = [];
  for (const parte of composicao) {
    const base = questoes.filter((q) => q.area === parte.area).sort((a, b) => hash(a.id) - hash(b.id) || a.id.localeCompare(b.id));
    for (let i = 0; i < Math.min(parte.n, base.length); i++) {
      const q = base[(k * parte.n + i) % base.length];
      itens.push({ q, area: parte.area, disciplina: parte.disciplina ?? q.disciplina, valor: parte.valor ?? 1 });
    }
  }
  return { itens, faltas: [] };
}

// Progresso do estudante: XP, níveis, sequência de dias e conquistas.
// Funções puras: recebem o estado e devolvem um novo estado.

export const XP = { acerto: 10, erro: 2, simulado: 30 };

export const NIVEIS = [
  [0, 'Iniciante'], [100, 'Aprendiz'], [300, 'Estudante'], [600, 'Dedicado'],
  [1000, 'Focado'], [1600, 'Avançado'], [2400, 'Especialista'], [3500, 'Mestre'], [5000, 'Lenda'],
];

export function progressoVazio() {
  return { xp: 0, respostas: {}, missoes: {}, simulados: [], dias: [], alvo: null };
}

export function nivel(xp) {
  let i = 0;
  while (i + 1 < NIVEIS.length && xp >= NIVEIS[i + 1][0]) i++;
  const [base, titulo] = NIVEIS[i];
  const prox = NIVEIS[i + 1]?.[0] ?? null;
  return { numero: i + 1, titulo, base, prox, pct: prox ? Math.round(((xp - base) / (prox - base)) * 100) : 100 };
}

const dia = (d) => d.toISOString().slice(0, 10);

// Dias consecutivos com atividade, contando até hoje (ou ontem, se hoje ainda não estudou).
export function sequencia(dias, hoje = new Date()) {
  const set = new Set(dias);
  const d = new Date(hoje);
  if (!set.has(dia(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dia(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function marcarDia(p, agora) {
  const hoje = dia(agora);
  return p.dias.includes(hoje) ? p.dias : [...p.dias, hoje].slice(-400);
}

export function registrarResposta(p, { id, area, correta }, agora = new Date()) {
  const ant = p.respostas[id] ?? { tentativas: 0, erros: 0 };
  return {
    ...p,
    xp: p.xp + (correta ? XP.acerto : XP.erro),
    dias: marcarDia(p, agora),
    respostas: { ...p.respostas, [id]: { area, tentativas: ant.tentativas + 1, erros: ant.erros + (correta ? 0 : 1), ultima: correta } },
  };
}

// XP de missão só na primeira conclusão.
export function registrarMissao(p, chave, xp, agora = new Date()) {
  if (p.missoes[chave]) return p;
  return { ...p, xp: p.xp + xp, dias: marcarDia(p, agora), missoes: { ...p.missoes, [chave]: dia(agora) } };
}

export function registrarSimulado(p, { acertos, total, segundos }, agora = new Date()) {
  const s = { data: dia(agora), acertos, total, segundos };
  return { ...p, xp: p.xp + XP.simulado, dias: marcarDia(p, agora), simulados: [...p.simulados, s].slice(-50) };
}

export function conquistas(p) {
  const r = Object.values(p.respostas);
  const acertos = r.filter((x) => x.ultima).length;
  const missoes = Object.keys(p.missoes);
  const lista = [
    ['primeira', 'Primeiro passo', 'Respondeu a primeira questão', r.length >= 1],
    ['50q', 'Maratonista', 'Respondeu 50 questões', r.length >= 50],
    ['25a', 'Certeiro', '25 questões com acerto na última tentativa', acertos >= 25],
    ['lab', 'Mão na massa', 'Concluiu a primeira missão de laboratório', missoes.length >= 1],
    ['10lab', 'Profissional', 'Concluiu 10 missões de laboratório', missoes.length >= 10],
    ['linux', 'Sysadmin', 'Todas as missões do terminal Linux', missoes.filter((k) => k.startsWith('linux/')).length >= 11],
    ['sim', 'Prova de fogo', 'Concluiu um simulado', p.simulados.length >= 1],
    ['sim80', 'Aprovado', 'Simulado com 80% ou mais', p.simulados.some((s) => s.acertos / s.total >= 0.8)],
    ['seq7', 'Constância', '7 dias seguidos de estudo', sequencia(p.dias) >= 7],
  ];
  return lista.map(([id, nome, desc, ok]) => ({ id, nome, desc, ok }));
}

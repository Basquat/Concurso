// Plano de aula avaliado por rubrica explícita (critérios de alinhamento construtivo).
// Verbos organizados pela Taxonomia de Bloom revisada (Anderson & Krathwohl, 2001).

export const BLOOM = {
  Lembrar: ['identificar', 'listar', 'nomear', 'reconhecer', 'definir', 'recordar'],
  Compreender: ['explicar', 'resumir', 'classificar', 'comparar', 'interpretar', 'exemplificar', 'descrever'],
  Aplicar: ['aplicar', 'resolver', 'calcular', 'utilizar', 'executar', 'demonstrar'],
  Analisar: ['analisar', 'diferenciar', 'organizar', 'relacionar', 'distinguir'],
  Avaliar: ['avaliar', 'julgar', 'justificar', 'argumentar', 'criticar', 'verificar'],
  Criar: ['criar', 'elaborar', 'planejar', 'produzir', 'propor', 'construir'],
};
const VAGOS = ['entender', 'saber', 'conhecer', 'aprender', 'compreender bem', 'perceber'];

export function nivelBloom(objetivo) {
  const verbo = String(objetivo).trim().toLowerCase().split(/\s+/)[0] ?? '';
  for (const [nivel, verbos] of Object.entries(BLOOM)) if (verbos.includes(verbo)) return nivel;
  return null;
}

export function planoVazio() {
  return { tema: '', duracao: 50, objetivos: [''], atividades: [{ descricao: '', minutos: 10, objetivo: 0, avaliacao: 'formativa' }], acessibilidade: '' };
}

// Retorna a rubrica: [{ criterio, ok, feedback }] e a nota em %.
export function avaliarPlano(p) {
  const objs = p.objetivos.map((o) => o.trim()).filter(Boolean);
  const ativs = p.atividades.filter((a) => a.descricao.trim());
  const soma = ativs.reduce((s, a) => s + Number(a.minutos || 0), 0);
  const tipos = new Set(ativs.map((a) => a.avaliacao).filter(Boolean));
  const vagos = objs.filter((o) => VAGOS.some((v) => o.toLowerCase().startsWith(v)));
  const semBloom = objs.filter((o) => !nivelBloom(o));
  const semAtividade = objs.map((_, i) => i).filter((i) => !ativs.some((a) => Number(a.objetivo) === i));
  const niveis = new Set(objs.map(nivelBloom).filter(Boolean));
  const rubrica = [
    { criterio: 'Tema definido', ok: p.tema.trim().length >= 3, feedback: 'Informe o tema/conteúdo da aula.' },
    { criterio: 'Objetivos observáveis', ok: objs.length > 0 && !vagos.length && !semBloom.length, feedback: vagos.length ? `Verbos vagos não são mensuráveis: "${vagos[0]}". Troque por um verbo observável (ex.: identificar, comparar, resolver).` : semBloom.length ? `Comece cada objetivo com um verbo no infinitivo da Taxonomia de Bloom ("${semBloom[0]}").` : 'Escreva ao menos um objetivo.' },
    { criterio: 'Progressão cognitiva', ok: niveis.size >= 2, feedback: 'Use objetivos de pelo menos dois níveis de Bloom (ex.: Compreender e Aplicar).' },
    { criterio: 'Alinhamento objetivo ↔ atividade', ok: objs.length > 0 && !semAtividade.length, feedback: `Todo objetivo precisa de ao menos uma atividade que o desenvolva (falta para o objetivo ${semAtividade.map((i) => i + 1).join(', ')}).` },
    { criterio: 'Tempo coerente', ok: soma === Number(p.duracao), feedback: `As atividades somam ${soma} min, mas a aula tem ${p.duracao} min.` },
    { criterio: 'Avaliação formativa durante a aula', ok: tipos.has('formativa'), feedback: 'Inclua uma atividade com avaliação formativa (acompanha a aprendizagem e permite ajustar o ensino).' },
    { criterio: 'Diagnóstico ou verificação final', ok: tipos.has('diagnóstica') || tipos.has('somativa'), feedback: 'Inclua avaliação diagnóstica (início) ou somativa (fechamento).' },
    { criterio: 'Inclusão e acessibilidade', ok: p.acessibilidade.trim().length >= 15, feedback: 'Descreva adaptações para estudantes com deficiência ou dificuldades (ex.: material ampliado, Libras, tempo adicional).' },
  ];
  return { rubrica, nota: Math.round((rubrica.filter((r) => r.ok).length / rubrica.length) * 100) };
}

export const MISSOES_EDU = [
  { id: 'plano-completo', titulo: 'Plano de aula nota 100', xp: 60, descricao: 'Monte um plano de aula que atenda a todos os critérios da rubrica.', check: (s) => avaliarPlano(s.plano).nota === 100 },
];

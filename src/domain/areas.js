// Áreas de estudo da 2.0 e ligação com as disciplinas da prova (edital UFBA 2026: 60 questões objetivas).

export const AREAS = {
  portugues: { nome: 'Língua Portuguesa', curto: 'Português', cor: 'var(--c-portugues)', icone: 'redacao' },
  logica: { nome: 'Raciocínio Lógico', curto: 'Lógica', cor: 'var(--c-logica)', icone: 'cerebro' },
  informatica: { nome: 'Noções de Informática', curto: 'Informática', cor: 'var(--c-info)', icone: 'cpu' },
  'adm-publica': { nome: 'Administração Pública e Legislação', curto: 'Adm. Pública', cor: 'var(--c-direito)', icone: 'balanca' },
  ti: { nome: 'Tecnologia da Informação', curto: 'TI', cor: 'var(--c-ti)', icone: 'codigo' },
  gestao: { nome: 'Administração e Gestão', curto: 'Gestão', cor: 'var(--c-adm)', icone: 'grafico' },
  contabil: { nome: 'Contabilidade e Finanças', curto: 'Contabilidade', cor: 'var(--c-contabil)', icone: 'calculadora' },
  saude: { nome: 'Saúde', curto: 'Saúde', cor: 'var(--c-saude)', icone: 'saude' },
  educacao: { nome: 'Educação', curto: 'Educação', cor: 'var(--c-educacao)', icone: 'formatura' },
  outras: { nome: 'Outras áreas técnicas', curto: 'Outras', cor: 'var(--c-outros)', icone: 'frasco' },
};

// Programa do edital → área. Ex.: lp-e → portugues; ce-402 → ti.
export function areaDoPrograma(id) {
  if (/^lp-/.test(id)) return 'portugues';
  if (/^rl-/.test(id)) return 'logica';
  if (/^info-/.test(id)) return 'informatica';
  if (/^ap-/.test(id)) return 'adm-publica';
  const ce = id.replace(/^ce-/, '');
  if (['206', '402'].includes(ce)) return 'ti';
  if (['201', '401'].includes(ce)) return 'gestao';
  if (['202', '405'].includes(ce)) return 'contabil';
  if (['203', '406', '412'].includes(ce) || /^40[8]|^413/.test(ce)) return 'saude';
  if (ce === '411') return 'educacao';
  return 'outras';
}

const DISCIPLINA_AREA = { 'Língua Portuguesa': 'portugues', 'Raciocínio Lógico': 'logica', 'Noções de Informática': 'informatica', 'Administração Pública': 'adm-publica' };

// Composição da prova objetiva do cargo, por área: [{ area, disciplina, questoes, valor, pontos }].
export function provaPorArea(cargo) {
  if (!cargo?.objetiva) return [];
  const ce = cargo.programas.find((p) => p.startsWith('ce-'));
  return cargo.objetiva.map((d) => ({
    area: DISCIPLINA_AREA[d.disciplina] ?? (ce ? areaDoPrograma(ce) : 'outras'),
    disciplina: d.disciplina,
    questoes: d.questoes,
    valor: d.valor,
    pontos: d.questoes * d.valor,
  }));
}

// Área da 1.0 → área da 2.0 (progresso antigo continua contando).
export function areaV2(area, disciplina = '') {
  if (area === 'gerais') return /portugu/i.test(disciplina) ? 'portugues' : 'logica';
  if (area === 'direito') return 'adm-publica';
  if (area === 'adm') return /inform/i.test(disciplina) ? 'informatica' : 'adm-publica';
  return AREAS[area] ? area : 'outras';
}

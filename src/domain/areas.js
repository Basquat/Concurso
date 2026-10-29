// Áreas de estudo da 2.0 e ligação com as disciplinas da prova (edital UFBA 2026: 60 questões objetivas).

export const AREAS = {
  portugues: { nome: 'Língua Portuguesa', curto: 'Português', cor: 'var(--c-portugues)', icone: 'redacao' },
  logica: { nome: 'Raciocínio Lógico', curto: 'Lógica', cor: 'var(--c-logica)', icone: 'cerebro' },
  informatica: { nome: 'Noções de Informática', curto: 'Informática', cor: 'var(--c-info)', icone: 'cpu' },
  'adm-publica': { nome: 'Administração Pública e Legislação', curto: 'Adm. Pública', cor: 'var(--c-direito)', icone: 'balanca' },
  ti: { nome: 'Tecnologia da Informação', curto: 'TI', cor: 'var(--c-ti)', icone: 'codigo' },
  gestao: { nome: 'Administração e Gestão', curto: 'Gestão', cor: 'var(--c-adm)', icone: 'grafico' },
  contabil: { nome: 'Contabilidade e Finanças', curto: 'Contabilidade', cor: 'var(--c-contabil)', icone: 'calculadora' },
  financas: { nome: 'Finanças pessoais', curto: 'Finanças', cor: 'var(--c-contabil)', icone: 'dinheiro' },
  investimentos: { nome: 'Investimentos', curto: 'Investimentos', cor: 'var(--c-adm)', icone: 'grafico' },
  rh: { nome: 'Recursos Humanos', curto: 'RH', cor: 'var(--c-info)', icone: 'usuarios' },
  direito: { nome: 'Direito do Trabalho', curto: 'Trabalho', cor: 'var(--c-direito)', icone: 'balanca' },
  'dir-constitucional': { nome: 'Direito Constitucional', curto: 'Constitucional', cor: 'var(--c-direito)', icone: 'bandeira' },
  'dir-administrativo': { nome: 'Direito Administrativo', curto: 'Administrativo', cor: 'var(--c-direito)', icone: 'carimbo' },
  'dir-penal': { nome: 'Direito Penal', curto: 'Penal', cor: 'var(--c-penal)', icone: 'escudo' },
  'dir-proc-penal': { nome: 'Direito Processual Penal', curto: 'Proc. Penal', cor: 'var(--c-penal)', icone: 'documento' },
  'dir-civil': { nome: 'Direito Civil', curto: 'Civil', cor: 'var(--c-civil)', icone: 'usuario' },
  'dir-proc-civil': { nome: 'Direito Processual Civil', curto: 'Proc. Civil', cor: 'var(--c-civil)', icone: 'arquivoTexto' },
  'dir-tributario': { nome: 'Direito Tributário', curto: 'Tributário', cor: 'var(--c-economia)', icone: 'calculadora' },
  'dir-previdenciario': { nome: 'Direito Previdenciário', curto: 'Previdenciário', cor: 'var(--c-civil)', icone: 'escudoOk' },
  matematica: { nome: 'Matemática', curto: 'Matemática', cor: 'var(--c-mat)', icone: 'regua' },
  'mat-financeira': { nome: 'Matemática Financeira', curto: 'Mat. Financeira', cor: 'var(--c-mat)', icone: 'dinheiro' },
  estatistica: { nome: 'Estatística', curto: 'Estatística', cor: 'var(--c-estat)', icone: 'grafico' },
  ingles: { nome: 'Língua Inglesa', curto: 'Inglês', cor: 'var(--c-ingles)', icone: 'globo' },
  arquivologia: { nome: 'Arquivologia', curto: 'Arquivologia', cor: 'var(--c-arquivo)', icone: 'pasta' },
  economia: { nome: 'Economia', curto: 'Economia', cor: 'var(--c-economia)', icone: 'grafico' },
  bancarios: { nome: 'Conhecimentos Bancários', curto: 'Bancários', cor: 'var(--c-banco)', icone: 'predio' },
  'conhecimentos-gerais': { nome: 'História e Geografia do Brasil', curto: 'Hist. e Geo.', cor: 'var(--c-gerais)', icone: 'mapa' },
  'seg-trabalho': { nome: 'Segurança do Trabalho', curto: 'Seg. Trabalho', cor: 'var(--c-saude)', icone: 'alerta' },
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

// Composição da prova objetiva do cargo, por área: [{ area, disciplina, questoes, valor, pontos }]. Concursos-modelo
// informam a área de cada disciplina (d.area); no edital da UFBA ela vem do nome da disciplina ou do programa específico.
export function provaPorArea(cargo) {
  if (!cargo?.objetiva) return [];
  const ce = cargo.programas.find((p) => p.startsWith('ce-'));
  return cargo.objetiva.map((d) => ({
    area: d.area ?? DISCIPLINA_AREA[d.disciplina] ?? (ce ? areaDoPrograma(ce) : 'outras'),
    disciplina: d.disciplina,
    questoes: d.questoes,
    valor: d.valor,
    pontos: d.questoes * d.valor,
  }));
}

// Área da 1.0 → área da 2.0 (progresso antigo continua contando).
export function areaV2(area, disciplina = '') {
  if (area === 'gerais') return /portugu/i.test(disciplina) ? 'portugues' : 'logica';
  if (area === 'adm') return /inform/i.test(disciplina) ? 'informatica' : 'adm-publica';
  return AREAS[area] ? area : 'outras';
}

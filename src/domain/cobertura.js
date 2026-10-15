// Matriz de cobertura: relaciona cada conteúdo do edital aos recursos da plataforma por palavras-chave.
// ponytail: casamento por regex, não semântico — um tópico pode casar com recurso genérico; o estado
// "coberto" é conservador (exige teoria + 3 questões) e a matriz mostra o critério ao usuário.

const LAB = (lab, cenario) => ({ lab, cenario });
export const REGRAS = [
  [/linux|shell ?script|\bbash\b|debian|suse|red hat|ubuntu|centos|sistemas de arquivos|usuários, grupos/i, 'ti', 'Sistemas operacionais Linux', LAB('linux', 'Servidor com incidentes: logs, disco cheio, processo suspeito, nginx, firewall e SSH')],
  [/banco de dados|\bsql\b|mysql|postgres|sgbd|transaç|normaliza|modelagem (conceitual|lógica|de dados)|data warehouse|procedures|triggers/i, 'ti', 'Banco de dados', LAB('sql', 'Banco de uma prefeitura fictícia: junções, agregações, integridade, transações e índices')],
  [/redes? de computadores|tcp\/ip|ipv[46]|modelo (de referência )?osi|vlan|roteamento|\bdns\b|\bdhcp\b|subnetting|endereçamento|conectividade|cabeamento/i, 'ti', 'Redes de computadores', LAB('redes', 'Diagnóstico de rede com gateway, máscara e DNS incorretos')],
  [/nuvem|cloud|virtualiza|cluster|alta disponibilidade|balanceamento|escalabilidade|iaas|paas|saas|fail ?over|infraestrutura como código|\biac\b|containers?|kubernetes/i, 'ti', 'Computação em nuvem', LAB('aws', 'Arquitetura de alta disponibilidade com falha de zona e pico de acesso')],
  [/segurança da informação|criptograf|malware|vírus|phishing|ransomware|backup|27001|27002|27005|firewall|\bids\b|\bips\b|cert\.?br|ameaças cibernéticas|hardening/i, 'ti', 'Segurança da informação', LAB('linux', 'Endurecimento de servidor: firewall, SSH e remoção de processo malicioso')],
  [/engenharia de software|análise de requisitos|levantamento e análise de requisitos|testes de software|garantia d[ae] qualidade|\buml\b|scrum|kanban|\bgit\b|devops|ci\/cd|qualidade de código|ciclo de vida|controle de versões/i, 'ti', 'Engenharia de software', LAB('ide', 'Exercícios com testes automatizados e análise de código')],
  [/linguage(m|ns) de programação|algoritm|fluxograma|orientad[oa] a objetos|desenvolvimento (web|orientado)|\bapis?\b/i, 'ti', 'Programação', LAB('ide', 'Exercícios em JavaScript e PHP executados de verdade; Java com análise estática')],
  [/business intelligence|\bbi\b|data lake|ciência de dados|interpretação de dados|análise de dados|mineração/i, 'ti', 'Análise de dados e BI', LAB('bi', 'Limpeza de dados, modelo estrela e medidas DAX')],
  [/planilhas?|editores? de (texto|escritório)|office|processadores de texto/i, 'adm', 'Informática para escritório', LAB('planilha', 'Controle de estoque do almoxarifado com fórmulas')],
  [/estoques?|almoxarifado|recursos materiais|inventário|armazenagem/i, 'adm', 'Administração pública', LAB('planilha', 'Controle de estoque do almoxarifado com fórmulas')],
  [/contabilidade|contábe?i|lançamentos?|partidas dobradas|balanço (patrimonial|orçamentário|financeiro)|balanços públicos|balancete|escrituração|demonstraç(ão|ões) (contábe|do resultado)|plano de contas/i, 'contabil', 'Contabilidade geral', LAB('contabil', 'Escrituração de empresa comercial fictícia até o balanço')],
  [/orçament|despesa pública|receita pública|empenho|4\.320|\bldo\b|\bloa\b|\bppa\b|restos a pagar|siafi|pcasp|nbc tsp/i, 'contabil', 'Contabilidade pública'],
  [/licita|14\.133|contrataç(ão|ões)|contratos administrativos|pregão|dispensa|inexigibilidade/i, 'adm', 'Licitações e contratos'],
  [/9\.784|processo administrativo|acesso à informação|12\.527|transparência/i, 'adm', 'Processo administrativo e transparência'],
  [/lgpd|13\.709|dados pessoais/i, 'direito', 'Proteção de dados (LGPD)'],
  [/constituição|princípios constitucionais|administração (direta|indireta)|agentes públicos|8\.112|estado, governo|organização administrativa|servidores públicos/i, 'adm', 'Administração pública'],
  [/atos administrativos|poderes administrativos|improbidade|8\.429|controle (administrativo|judicial|legislativo)|responsabilidade civil do estado/i, 'direito', 'Direito administrativo'],
  [/medicamentos?|terapêutica medicamentosa|cálculo de doses/i, 'saude', 'Cálculo de medicação', LAB('saude', 'Cálculos de gotejamento e dose em exercícios teóricos')],
  [/biossegurança|infecç(ão|ões)|esteriliza|segurança do paciente|assepsia/i, 'saude', 'Biossegurança e segurança do paciente'],
  [/\bsus\b|sistema único de saúde|8\.080|vigilância/i, 'saude', 'Legislação do SUS'],
  [/9\.394|\bldb\b|diretrizes e bases/i, 'educacao', 'Legislação educacional'],
  [/avaliação (educacional|da aprendizagem)|planejamento educacional|didática|currículo|metodologias? (de ensino|ativas)|projeto político/i, 'educacao', 'Didática e avaliação', LAB('educacao', 'Plano de aula corrigido por rubrica')],
  [/compreensão e interpretação|ortografia|crase|concordância|regência|pontuação|coesão|morfossintaxe|(?<!web )semântica|redação oficial|tipologia (textual|e gêneros)|gêneros textuais/i, 'gerais', 'Língua portuguesa'],
  [/lógica|proposi|tabelas?-verdade|morgan|teoria dos conjuntos|operações com conjuntos|argumentação|probabilidade|combinatória|contagem/i, 'gerais', 'Raciocínio lógico'],
];

const REF = /(Lei(?: Complementar)? n[ºo°] ?[\d.]+\/?\d*|Decreto n[ºo°] ?[\d.]+\/?\d*|Instrução Normativa [A-Z/]+ n[ºo°] ?[\d/]+|ISO(?:\/IEC)? ?\d{4,5}(?::\d{4})?|NBR(?: ISO)? ?\d{3,5}(?:-\d)?|NR[- ]?\d{1,2}|Manual de Redação da Presidência da República|COBIT 2019|ITIL 4|PMBOK)/g;

export function mapear(texto) {
  const trilhas = [];
  const labs = [];
  const cenarios = [];
  for (const [re, area, disciplina, extra] of REGRAS) {
    if (!re.test(texto)) continue;
    if (!trilhas.some((t) => t.area === area && t.disciplina === disciplina)) trilhas.push({ area, disciplina });
    if (extra && !labs.includes(extra.lab)) { labs.push(extra.lab); cenarios.push(extra.cenario); }
  }
  return { trilhas, labs, cenarios };
}

export function referencias(texto) {
  return [...new Set(texto.match(REF) ?? [])];
}

export function avaliarItem(texto, contarQuestoes) {
  const m = mapear(texto);
  const questoes = m.trilhas.reduce((s, t) => s + contarQuestoes(t.area, t.disciplina), 0);
  const lacunas = [];
  if (!m.trilhas.length) lacunas.push('Conteúdo ainda não mapeado para teoria, questões ou laboratório');
  else if (questoes < 3) lacunas.push(questoes ? `Só ${questoes} questão(ões) relacionada(s)` : 'Sem questões relacionadas');
  const estado = !m.trilhas.length ? 'lacuna' : questoes >= 3 ? 'coberto' : 'parcial';
  return { ...m, questoes, estado, lacunas };
}

// Linhas da matriz para um cargo de um concurso (dados no formato de data/concursos/*.json).
export function matriz(concurso, codigoCargo, contarQuestoes) {
  const cargo = concurso.cargos.find((c) => c.codigo === codigoCargo);
  if (!cargo) return [];
  const dificuldade = cargo.nivel === 'D' ? 'Intermediária' : 'Avançada';
  return cargo.programas.flatMap((pid) => {
    const p = concurso.programas[pid];
    return p.blocos.flatMap((b) => b.itens.map((item, i) => {
      const texto = `${b.titulo ?? ''} ${item}`;
      const refs = referencias(texto);
      return {
        cargo: `${cargo.codigo} – ${cargo.nome}`, disciplina: p.disciplina, bloco: b.titulo, numero: i + 1, conteudo: item,
        referencia: refs.length ? refs.join('; ') : 'Edital nº 007/2026, Anexo II', dificuldade, ...avaliarItem(texto, contarQuestoes),
      };
    }));
  });
}

export function resumo(linhas) {
  const r = { total: linhas.length, coberto: 0, parcial: 0, lacuna: 0 };
  for (const l of linhas) r[l.estado]++;
  return r;
}

// Catálogo dos laboratórios: metadados, transparência sobre o que é real/simulado e carregamento sob demanda.
// real: 'real' (a tecnologia de verdade roda no navegador), 'misto' (parte real, parte simulada), 'simulado' (modelo fiel).
import { esc, toast, ic } from '../dom.js';

export const LABS = {
  // ---------- Tecnologia da Informação ----------
  code: {
    nome: 'Code Studio', area: 'ti', icone: 'codigo', real: 'real', nivel: 'todos', novo: true,
    resumo: 'O editor do VS Code com projetos em JavaScript, TypeScript, Python, PHP, Java, SQL, HTML/CSS, React, Vue, Flask e FastAPI — executados de verdade.',
    simulado: 'Editor Monaco (o mesmo do VS Code). Executam de verdade no navegador: JavaScript/TypeScript (Web Worker), Python 3.12 com pacotes (Pyodide), PHP 8 (php-wasm), Java (compilador javac via CheerpJ), SQL (SQLite e PostgreSQL 17), e HTML/CSS/React/Vue num iframe isolado. Frameworks de servidor (Express, Spring Boot, Laravel) e mobile (Kotlin/Flutter) são reproduzidos em ambientes fiéis quando não há runtime no navegador — cada modelo de projeto informa isso.',
    carregar: () => import('./code.js'),
  },
  sql: {
    nome: 'SQL Studio', area: 'ti', icone: 'banco', real: 'real', nivel: 'todos', legado: true,
    resumo: 'SQLite e PostgreSQL 17 reais: consultas, junções, views, triggers, procedures, transações, EXPLAIN e exercícios corrigidos pelo resultado.',
    simulado: 'Os dois bancos são reais, compilados para WebAssembly (sql.js e PGlite) e executam no seu navegador. Recursos de servidor como usuários/GRANT em rede, replicação e extensões nativas não estão disponíveis.',
    carregar: () => import('./sql.js'),
  },
  git: {
    nome: 'Git e versionamento', area: 'ti', icone: 'git', real: 'simulado', nivel: 'basico', novo: true,
    resumo: 'Terminal com git: commits, branches, merge fast-forward e 3-way, conflitos e reset, com grafo de commits ao vivo.',
    simulado: 'Motor próprio que segue o modelo de dados do Git (diretório de trabalho, index, commits com pais, branches e HEAD) e as mesmas mensagens do git. Sem remotos (push/pull) nesta versão.',
    carregar: () => import('./git.js'),
  },
  docker: {
    nome: 'Docker e Compose', area: 'ti', icone: 'caixa', real: 'simulado', nivel: 'intermediario', novo: true,
    resumo: 'docker run, ps, logs, exec, volumes, portas, build de imagem a partir do Dockerfile e docker compose.',
    simulado: 'Não há contêineres reais no navegador. O simulador segue a semântica e as mensagens do Docker CLI 27 (ciclo de vida, portas em uso, variáveis obrigatórias, conflito de nomes, remoção de imagem em uso).',
    carregar: () => import('./docker.js'),
  },
  linux: {
    nome: 'Terminal Linux', area: 'ti', icone: 'terminal', real: 'simulado', nivel: 'todos', legado: true,
    resumo: 'Administre um servidor: arquivos, permissões, logs, processos, serviços, firewall e SSH.',
    simulado: 'Sistema de arquivos, usuários, processos e serviços existem só na memória do navegador. O interpretador implementa um subconjunto do Bash (pipes, &&, ;, >, >>, globs, chaves) e cerca de 50 comandos com mensagens no padrão GNU/Linux. Não há kernel nem execução real; comandos destrutivos são bloqueados.',
    carregar: () => import('./linux.js'),
  },
  aws: {
    nome: 'Arquitetura AWS', area: 'ti', icone: 'nuvem', real: 'simulado', nivel: 'intermediario', legado: true,
    resumo: 'Monte arquiteturas com VPC, sub-redes, balanceador, Auto Scaling, RDS, S3, Lambda e IAM; valide, estime custos e simule falhas.',
    simulado: 'Nenhuma chamada é feita à AWS e nenhuma credencial é pedida. As validações reproduzem regras documentadas (ALB em duas ou mais AZs, DB subnet group em duas ou mais AZs, um Internet Gateway por VPC, encadeamento de Security Groups). Custos são aproximações on-demand de us-east-1 apenas para comparação.',
    carregar: () => import('./aws.js'),
  },
  redes: {
    nome: 'Redes e sub-redes', area: 'ti', icone: 'rede', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Calcule sub-redes CIDR e diagnostique uma rede com gateway, máscara e DNS errados.',
    simulado: 'Cálculos IPv4 são exatos. A topologia (duas LANs e um roteador) é um modelo didático: o ping considera ARP na mesma sub-rede, gateway padrão, rota de volta e resolução DNS.',
    carregar: () => import('./redes.js'),
  },
  bi: {
    nome: 'Análise de dados (BI)', area: 'ti', icone: 'grafico', real: 'misto', nivel: 'intermediario', legado: true,
    resumo: 'Fluxo do Power BI: limpar dados, relacionar tabelas, criar medidas DAX e montar visuais.',
    simulado: 'Inspirado no fluxo do Power BI; não é o Power BI. Os dados são processados de verdade, com contexto de filtro e propagação por relacionamentos. O DAX implementado é um subconjunto.',
    carregar: () => import('./bi.js'),
  },
  servidor: {
    nome: 'Montagem de servidor', area: 'ti', icone: 'servidor', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Monte e configure um servidor Ubuntu didático: pacotes, serviços, usuários e rede.',
    simulado: 'Modelo em memória de um Ubuntu 22.04: pacotes, serviços e usuários existem apenas como estado.',
    carregar: () => import('./servidor.js'),
  },
  'system-design': {
    nome: 'System Design', area: 'ti', icone: 'camadas', real: 'simulado', nivel: 'avancado', legado: true,
    resumo: 'Projete sistemas escaláveis: requisitos, arquitetura, componentes, trade-offs e avaliação.',
    simulado: 'O validador reproduz regras gerais de arquitetura; a avaliação é heurística.',
    carregar: () => import('./system-design.js'),
  },
  scrum: {
    nome: 'Time Scrum', area: 'ti', icone: 'kanban', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Product backlog, planejamento de sprint, Daily, burndown, retrospectiva e métricas.',
    simulado: 'Modelo didático de Scrum com papéis, artefatos e cerimônias; métricas calculadas a partir do estado.',
    carregar: () => import('./scrum.js'),
  },
  // ---------- Administração Pública ----------
  sei: {
    nome: 'SEI — processo eletrônico', area: 'adm-publica', icone: 'documento', real: 'simulado', nivel: 'basico', novo: true,
    resumo: 'Inicie processos, inclua e assine documentos, tramite entre unidades e conclua, como no SEI da UFBA.',
    simulado: 'Reprodução didática do fluxo do SEI (NUP, documentos internos/externos, assinatura, níveis de acesso, andamento). Nada é enviado a nenhum sistema real.',
    carregar: () => import('./sei.js'),
  },
  // ---------- Português e Lógica ----------
  redacao: {
    nome: 'Redação discursiva', area: 'portugues', icone: 'redacao', real: 'simulado', nivel: 'todos', novo: true,
    resumo: 'Escreva no formato do edital (20 a 30 linhas), com contagem de linhas, revisão automática e autoavaliação pelos 4 critérios.',
    simulado: 'A contagem de linhas é estimada (~75 caracteres por linha da folha). A revisão aponta problemas estruturais; a nota é autoavaliada pelos critérios da Tabela 13.2 do edital.',
    carregar: () => import('./redacao.js'),
  },
  logica: {
    nome: 'Tabela-verdade e equivalências', area: 'logica', icone: 'cerebro', real: 'real', nivel: 'basico', novo: true,
    resumo: 'Digite qualquer proposição e veja a tabela-verdade, a classificação (tautologia, contradição, contingência) e teste equivalências.',
    simulado: 'O avaliador lógico é exato: calcula todas as combinações de valores.',
    carregar: () => import('./logica.js'),
  },
  // ---------- Informática ----------
  planilha: {
    nome: 'Planilha eletrônica', area: 'informatica', icone: 'grade', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Controle de estoque com SOMA, SE, CONT.SE, SOMASE e PROCV, ordenação e gráfico.',
    simulado: 'Motor de fórmulas próprio, compatível com a sintaxe do Excel/Calc em português e inglês.',
    carregar: () => import('./planilha.js'),
  },
  // ---------- Contabilidade (EXPANDIDO) ----------
  contabil: {
    nome: 'Escrituração contábil', area: 'contabil', icone: 'calculadora', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Pratique escrituração, consulte razão e balancete, analise demonstrações e indicadores, simule custos, receitas e despesas públicas e exercícios de auditoria.',
    simulado: 'Ambiente educacional com empresa e órgão público fictícios. Lançamentos, relatórios, margem de contribuição, ponto de equilíbrio, fluxos estimados e sequências orçamentárias são calculados localmente; não substitui sistema contábil, PCASP completo, DFC normativa nem orientação profissional.',
    carregar: () => import('./contabil.js'),
  },
  // ---------- Saúde ----------
  saude: {
    nome: 'Cálculos de enfermagem', area: 'saude', icone: 'saude', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Gotejamento em macro e microgotas e volume de medicamento por regra de três.',
    simulado: 'Exercícios gerados com as fórmulas usuais do ensino de enfermagem. Não substitui protocolo institucional, prescrição nem dupla checagem.',
    carregar: () => import('./saude.js'),
  },
  // ---------- Educação ----------
  educacao: {
    nome: 'Planejamento de aula', area: 'educacao', icone: 'formatura', real: 'simulado', nivel: 'basico', legado: true,
    resumo: 'Plano de aula com objetivos (Bloom), atividades, avaliação e acessibilidade, corrigido por rubrica.',
    simulado: 'A rubrica verifica critérios explícitos de alinhamento, tempo e inclusão; é apoio formativo.',
    carregar: () => import('./educacao.js'),
  },
  // ---------- Práticas guiadas (formulário + cálculo) ----------
  financas: {
    nome: 'Orçamento e reserva', area: 'financas', icone: 'dinheiro', real: 'simulado', nivel: 'basico',
    resumo: 'Orçamento mensal, saldo e meta de reserva de emergência com valores fictícios.',
    simulado: 'Calculadora educacional com cenários fictícios de renda e despesas; não é aconselhamento financeiro.',
    carregar: () => import('./praticas.js'),
  },
  investimentos: {
    nome: 'Carteira e juros compostos', area: 'investimentos', icone: 'grafico', real: 'simulado', nivel: 'basico',
    resumo: 'Valor futuro de um aporte e relação entre prazo, risco e perfil do investidor.',
    simulado: 'Rentabilidades hipotéticas, sem impostos nem custos; não são previsões de mercado.',
    carregar: () => import('./praticas.js'),
  },
  rh: {
    nome: 'Vaga e integração', area: 'rh', icone: 'usuarios', real: 'simulado', nivel: 'basico',
    resumo: 'Estruture uma vaga com competências observáveis e um plano de integração (onboarding).',
    simulado: 'Formulário educacional; não use dados pessoais reais.',
    carregar: () => import('./praticas.js'),
  },
  direito: {
    nome: 'Checklist de rescisão', area: 'direito', icone: 'balanca', real: 'simulado', nivel: 'basico',
    resumo: 'Estimativa simples de 13º proporcional e aviso prévio em cenário hipotético.',
    simulado: 'Cálculo simplificado; não inclui férias, médias, descontos nem convenções coletivas e não substitui orientação jurídica.',
    carregar: () => import('./praticas.js'),
  },
  // ---------- Treinos: exercícios corrigidos na hora (conteúdo em src/domain/treinos/<grupo>.js) ----------
  ...treinos({
    exatas: {
      matematica: ['Matemática básica', 'matematica', 'regua', 'basico', 'Porcentagem, aumentos sucessivos, regra de três, MMC/MDC, frações e conjuntos numéricos.'],
      algebra: ['Álgebra e progressões', 'matematica', 'grafico', 'intermediario', 'PA, PG, equações do 1º e 2º graus e tipos de função.'],
      geometria: ['Geometria', 'matematica', 'regua', 'basico', 'Áreas, volumes, Pitágoras, polígonos e classificação de triângulos.'],
      'mat-financeira': ['Matemática financeira', 'mat-financeira', 'dinheiro', 'intermediario', 'Juros simples e compostos, desconto, taxa equivalente, SAC e Price.'],
      estatistica: ['Estatística descritiva', 'estatistica', 'grafico', 'basico', 'Média, mediana, moda, variância, desvio padrão, média ponderada e tipos de variável.'],
      probabilidade: ['Contagem e probabilidade', 'logica', 'cerebro', 'intermediario', 'Anagramas, arranjos, combinações e probabilidade com moedas e dados.'],
      argumentos: ['Argumentos e equivalências', 'logica', 'cerebro', 'intermediario', 'Contrapositiva, negação da condicional, validade de argumentos e problemas com conjuntos.'],
      economia: ['Economia aplicada', 'economia', 'grafico', 'intermediario', 'Elasticidade, PIB real, multiplicador, desemprego, juro real e política econômica.'],
      quimica: ['Química de laboratório', 'outras', 'quimica', 'basico', 'Concentração, molaridade, massa a pesar, diluição e preparo de soluções.'],
      eletricidade: ['Eletricidade básica', 'outras', 'raio', 'basico', 'Lei de Ohm, potência, consumo em kWh e associação de resistores.'],
    },
  }),
};

// Tabela compacta { grupo: { id: [nome, área, ícone, nível, resumo] } } → entradas do catálogo.
function treinos(grupos) {
  const simulado = 'Exercícios autorais corrigidos na hora: cálculos com valores sorteados e resposta pela fórmula, classificação com explicação e ordenação de etapas. Não reproduz nenhum sistema real.';
  return Object.fromEntries(Object.entries(grupos).flatMap(([grupo, labs]) => Object.entries(labs).map(([id, [nome, area, icone, nivel, resumo]]) =>
    [id, { nome, area, icone, nivel, resumo, real: 'treino', novo: true, simulado, treino: grupo, carregar: () => import('./treino.js') }])));
}

export const NIVEL = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado', todos: 'Todos os níveis' };
export const SELO_REAL = {
  real: ['real', 'Tecnologia real'],
  misto: ['aviso', 'Real + simulado'],
  simulado: ['sim', 'Simulação fiel'],
  treino: ['info', 'Treino corrigido'],
};

// ---------- Compatibilidade com os laboratórios da 1.0 ----------
// A moldura (views/lab.js) já mostra título e "o que é real"; aqui fica só a barra de ações.
export function cabecalhoLab(id, extras = '') {
  return `<div class="linha fim mb2 lab-acoes-legado">${extras}<button class="btn perigo peq" type="button" data-reiniciar>${ic('recarregar')} Reiniciar ambiente</button></div>`;
}

// Painel de missões: verificação por estado, conclusão registrada uma única vez com XP.
export function painelMissoes(el, { lab, missoes, servico }) {
  const desenhar = () => {
    const abertas = new Set([...el.querySelectorAll('details[open]')].map((d) => d.dataset.id));
    const feitas = missoes.filter((m) => servico.progresso.missoes[`${lab}/${m.id}`]).length;
    const proxima = missoes.find((m) => !servico.progresso.missoes[`${lab}/${m.id}`]);
    el.innerHTML = `<div class="linha entre mb1"><h2 style="margin:0;font-size:1rem">Missões</h2><span class="pequeno muted">${feitas} de ${missoes.length}</span></div>
      <div class="progresso fina mb2"><span style="width:${missoes.length ? (feitas / missoes.length) * 100 : 0}%"></span></div>
      <ul class="missoes">${missoes.map((m) => {
        const feita = !!servico.progresso.missoes[`${lab}/${m.id}`];
        return `<li class="missao ${feita ? 'feita' : ''} ${m === proxima ? 'atual' : ''}"><div class="titulo"><span>${feita ? ic('okCirculo') : ''} ${esc(m.titulo)}</span><span class="estado ${feita ? 'feito' : ''}">${feita ? 'Concluída' : `+${m.xp} XP`}</span></div>
          <div class="desc">${esc(m.descricao)}</div>${m.dica ? `<details data-id="${esc(m.id)}" ${abertas.has(m.id) ? 'open' : ''}><summary>Dica</summary>${esc(m.dica)}</details>` : ''}</li>`;
      }).join('')}</ul>`;
  };
  desenhar();
  return {
    verificar(checar) {
      let nova = false;
      for (const m of missoes) {
        let ok = false;
        try { ok = checar(m); } catch { ok = false; }
        if (ok && servico.concluirMissao(lab, m)) { nova = true; toast(`Missão concluída: ${m.titulo} (+${m.xp} XP)`, { tipo: 'xp' }); }
      }
      if (nova) desenhar();
    },
    redesenhar: desenhar,
  };
}

export function confirmarReinicio(el, aoConfirmar) {
  el.querySelector('[data-reiniciar]')?.addEventListener('click', () => {
    if (confirm('Reiniciar o ambiente do laboratório? O estado atual será descartado; missões concluídas e XP continuam.')) aoConfirmar();
  });
}
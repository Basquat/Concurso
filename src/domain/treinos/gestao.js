// Treinos de gestão, gestão de pessoas, arquivologia, contabilidade, orçamento público, finanças, investimentos e
// sistema financeiro. Cálculos com valores fictícios; não constituem orientação financeira.
import { escolha, inteiro, arred, br, reais } from './motor.js';

const pct = (n) => `${br(n)}%`;

export default {
  gestao: {
    intro: 'Funções administrativas, níveis de planejamento, escolas da administração, liderança e o ciclo PDCA.',
    teoria: 'Funções (Fayol/neoclássicos): planejar, organizar, dirigir e controlar. Planejamento estratégico (longo prazo, organização toda), tático (médio prazo, departamentos) e operacional (curto prazo, tarefas).',
    exercicios: [
      { tipo: 'classificar', id: 'funcoes', titulo: 'Funções administrativas', pergunta: 'A atividade corresponde à função de:', categorias: ['Planejamento', 'Organização', 'Direção', 'Controle'], itens: [
        ['Definir metas para o próximo ano', 'Planejamento'], ['Formular estratégias a partir de uma análise SWOT', 'Planejamento'], ['Escolher cursos de ação futuros', 'Planejamento'],
        ['Elaborar o organograma do órgão', 'Organização'], ['Distribuir tarefas, recursos e autoridade', 'Organização'], ['Definir a departamentalização', 'Organização'],
        ['Motivar e liderar a equipe', 'Direção'], ['Comunicar decisões aos subordinados', 'Direção'], ['Conduzir reunião de alinhamento', 'Direção'],
        ['Comparar resultados com as metas', 'Controle'], ['Acompanhar indicadores de desempenho', 'Controle'], ['Corrigir desvios do orçamento', 'Controle'],
      ] },
      { tipo: 'classificar', id: 'niveis', titulo: 'Níveis de planejamento', pergunta: 'O plano é:', categorias: ['Estratégico', 'Tático', 'Operacional'], itens: [
        ['Missão, visão e objetivos de longo prazo da instituição', 'Estratégico'], ['Elaborado pela alta direção e abrange a organização toda', 'Estratégico'],
        ['Plano de marketing do departamento comercial', 'Tático'], ['Plano do setor financeiro para os próximos dois anos', 'Tático'], ['Desdobramento da estratégia pela gerência intermediária', 'Tático'],
        ['Escala semanal de atendimento ao público', 'Operacional'], ['Procedimento passo a passo do protocolo', 'Operacional'], ['Cronograma diário de entregas', 'Operacional'],
      ] },
      { tipo: 'classificar', id: 'escolas', titulo: 'Teorias da administração', pergunta: 'A ideia pertence à:', categorias: ['Administração Científica', 'Teoria Clássica', 'Relações Humanas', 'Burocracia', 'Teoria dos Sistemas', 'Teoria da Contingência'], itens: [
        ['Estudo de tempos e movimentos e ênfase nas tarefas (Taylor)', 'Administração Científica'], ['Pagamento por produção e "the one best way"', 'Administração Científica'],
        ['Ênfase na estrutura e 14 princípios de administração (Fayol)', 'Teoria Clássica'], ['Prever, organizar, comandar, coordenar e controlar', 'Teoria Clássica'],
        ['Experiência de Hawthorne e ênfase nas pessoas (Mayo)', 'Relações Humanas'], ['Grupos informais influenciam a produtividade', 'Relações Humanas'],
        ['Racionalidade, impessoalidade e formalidade (Weber)', 'Burocracia'], ['Autoridade racional-legal e hierarquia definida', 'Burocracia'],
        ['Organização como sistema aberto, com entradas, processamento e saídas', 'Teoria dos Sistemas'], ['Sinergia e homeostase', 'Teoria dos Sistemas'],
        ['Não há uma única melhor maneira: tudo depende do ambiente e da tecnologia', 'Teoria da Contingência'],
      ] },
      { tipo: 'classificar', id: 'lideranca', titulo: 'Estilos de liderança', pergunta: 'O comportamento descreve a liderança:', categorias: ['Autocrática', 'Democrática', 'Liberal (laissez-faire)', 'Situacional'], itens: [
        ['O líder decide sozinho e impõe as ordens', 'Autocrática'], ['Forte controle e pouca participação do grupo', 'Autocrática'],
        ['Decisões debatidas pelo grupo, com orientação do líder', 'Democrática'], ['O líder estimula a participação e o consenso', 'Democrática'],
        ['Total liberdade ao grupo, participação mínima do líder', 'Liberal (laissez-faire)'], ['O líder só intervém quando solicitado', 'Liberal (laissez-faire)'],
        ['O estilo varia conforme a maturidade dos liderados', 'Situacional'], ['Combinação de comportamento de tarefa e de relacionamento conforme o caso (Hersey e Blanchard)', 'Situacional'],
      ] },
      { tipo: 'ordenar', id: 'pdca', titulo: 'Ciclo PDCA', passos: ['Planejar (Plan): definir metas e métodos', 'Executar (Do): treinar e fazer', 'Verificar (Check): medir e comparar com as metas', 'Agir (Act): padronizar o que deu certo ou corrigir'], explicacao: 'O ciclo gira continuamente: cada volta é uma melhoria.' },
    ],
  },

  projetos: {
    intro: 'Valor agregado (EVM), estimativa PERT, grupos de processos e ferramentas da qualidade.',
    teoria: 'EVM: PV (valor planejado), EV (valor agregado), AC (custo real). CV = EV − AC; SV = EV − PV; CPI = EV/AC; SPI = EV/PV. CPI < 1: acima do orçamento; SPI < 1: atrasado. PERT: (O + 4M + P)/6.',
    exercicios: [
      { tipo: 'calc', id: 'evm', titulo: 'Valor agregado', formula: 'CPI = EV ÷ AC; SPI = EV ÷ PV', gerar: (r) => {
        const pv = escolha(r, [100, 120, 150, 200, 250]) * 1000; const ev = pv * escolha(r, [0.8, 0.9, 1, 1.1]); const ac = ev * escolha(r, [0.8, 0.9, 1.1, 1.25]); const pede = escolha(r, ['CPI', 'SPI']);
        const v = pede === 'CPI' ? ev / ac : ev / pv;
        return { enunciado: `Projeto com PV = ${reais(pv)}, EV = ${reais(ev)} e AC = ${reais(ac)}. Qual o ${pede}? (2 casas)`, resposta: arred(v), tol: 0.011, passos: `${pede} = ${pede === 'CPI' ? `EV ÷ AC = ${reais(ev)} ÷ ${reais(ac)}` : `EV ÷ PV = ${reais(ev)} ÷ ${reais(pv)}`} = **${br(v)}** → ${v < 1 ? (pede === 'CPI' ? 'acima do orçamento' : 'atrasado') : v > 1 ? (pede === 'CPI' ? 'abaixo do orçamento' : 'adiantado') : 'conforme o plano'}.` };
      } },
      { tipo: 'calc', id: 'variacao', titulo: 'Variação de custo e de prazo', formula: 'CV = EV − AC; SV = EV − PV', gerar: (r) => {
        const pv = escolha(r, [50, 80, 100, 150]) * 1000; const ev = pv * escolha(r, [0.75, 0.9, 1.1]); const ac = ev * escolha(r, [0.85, 1.2]); const pede = r() < 0.5 ? 'CV' : 'SV';
        const v = pede === 'CV' ? ev - ac : ev - pv;
        return { enunciado: `PV = ${reais(pv)}, EV = ${reais(ev)}, AC = ${reais(ac)}. Qual a ${pede === 'CV' ? 'variação de custo (CV)' : 'variação de prazo (SV)'}, em reais? (negativo se desfavorável)`, resposta: v, unidade: 'R$', passos: `${pede} = ${pede === 'CV' ? 'EV − AC' : 'EV − PV'} = **${reais(v)}** (${v < 0 ? 'desfavorável' : 'favorável'}).` };
      } },
      { tipo: 'calc', id: 'pert', titulo: 'Estimativa PERT', formula: 'E = (O + 4M + P) ÷ 6', gerar: (r) => {
        const m = inteiro(r, 5, 20); const o = m - inteiro(r, 1, 4); const p = m + inteiro(r, 2, 10);
        return { enunciado: `Atividade com estimativas otimista ${o}, mais provável ${m} e pessimista ${p} dias. Qual a duração esperada (PERT)? (2 casas)`, resposta: arred((o + 4 * m + p) / 6), unidade: 'dias', passos: `(${o} + 4×${m} + ${p}) ÷ 6 = **${br((o + 4 * m + p) / 6)} dias**` };
      } },
      { tipo: 'ordenar', id: 'grupos', titulo: 'Grupos de processos (PMBOK)', passos: ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento e controle', 'Encerramento'], explicacao: 'Monitoramento e controle acontece ao longo de todo o projeto, em paralelo à execução.' },
      { tipo: 'classificar', id: 'qualidade', titulo: 'Ferramentas da qualidade', pergunta: 'A ferramenta descrita é:', categorias: ['Diagrama de Ishikawa', 'Diagrama de Pareto', 'Histograma', 'Fluxograma', 'Folha de verificação', 'Carta de controle'], itens: [
        ['Organiza causas em categorias como método, máquina, mão de obra e material', 'Diagrama de Ishikawa'], ['Também chamado espinha de peixe ou causa e efeito', 'Diagrama de Ishikawa'],
        ['Barras em ordem decrescente para priorizar os poucos problemas vitais (80/20)', 'Diagrama de Pareto'],
        ['Mostra a distribuição de frequência de uma variável', 'Histograma'],
        ['Representa graficamente a sequência das etapas de um processo', 'Fluxograma'],
        ['Formulário para coletar e contar ocorrências de forma organizada', 'Folha de verificação'],
        ['Acompanha a variação de um processo ao longo do tempo com limites superior e inferior', 'Carta de controle'],
      ] },
    ],
  },

  'gestao-pessoas': {
    intro: 'Os processos de gestão de pessoas, teorias de motivação, métodos de avaliação de desempenho e recrutamento.',
    teoria: 'Chiavenato: processos de agregar, aplicar, recompensar, desenvolver, manter e monitorar pessoas. Herzberg: fatores higiênicos (evitam insatisfação) e motivacionais (geram satisfação).',
    exercicios: [
      { tipo: 'classificar', id: 'processos', titulo: 'Processos de gestão de pessoas', pergunta: 'A atividade pertence ao processo de:', categorias: ['Agregar', 'Aplicar', 'Recompensar', 'Desenvolver', 'Manter', 'Monitorar'], itens: [
        ['Recrutamento de candidatos', 'Agregar'], ['Seleção por provas e entrevistas', 'Agregar'],
        ['Desenho de cargos', 'Aplicar'], ['Avaliação de desempenho', 'Aplicar'], ['Integração (orientação) de novos servidores', 'Aplicar'],
        ['Plano de remuneração', 'Recompensar'], ['Benefícios e incentivos', 'Recompensar'],
        ['Treinamento e capacitação', 'Desenvolver'], ['Programas de desenvolvimento gerencial', 'Desenvolver'],
        ['Higiene, segurança e qualidade de vida no trabalho', 'Manter'], ['Relações sindicais e disciplina', 'Manter'],
        ['Banco de dados e sistemas de informação de RH', 'Monitorar'],
      ] },
      { tipo: 'classificar', id: 'motivacao', titulo: 'Teorias de motivação', pergunta: 'O conceito pertence a:', categorias: ['Maslow', 'Herzberg', 'McClelland', 'Vroom', 'McGregor'], itens: [
        ['Hierarquia de necessidades: fisiológicas, segurança, sociais, estima e autorrealização', 'Maslow'], ['Uma necessidade satisfeita deixa de motivar', 'Maslow'],
        ['Fatores higiênicos (salário, condições) e fatores motivacionais (reconhecimento, responsabilidade)', 'Herzberg'], ['Teoria dos dois fatores', 'Herzberg'],
        ['Necessidades de realização, afiliação e poder', 'McClelland'],
        ['Motivação = expectativa × instrumentalidade × valência', 'Vroom'], ['Teoria da expectância', 'Vroom'],
        ['Teoria X (pessoas evitam trabalho) e Teoria Y (pessoas buscam responsabilidade)', 'McGregor'],
      ] },
      { tipo: 'classificar', id: 'avaliacao', titulo: 'Métodos de avaliação de desempenho', pergunta: 'O método é:', categorias: ['Escala gráfica', 'Escolha forçada', 'Incidentes críticos', 'Avaliação 360°', 'Administração por objetivos'], itens: [
        ['Fatores pontuados em graus numa tabela de dupla entrada', 'Escala gráfica'],
        ['O avaliador escolhe, em blocos de frases, a que mais e a que menos descreve o avaliado', 'Escolha forçada'],
        ['Registra comportamentos extremamente positivos ou negativos', 'Incidentes críticos'],
        ['Avaliado por chefes, pares, subordinados e clientes', 'Avaliação 360°'], ['Feedback de múltiplas fontes', 'Avaliação 360°'],
        ['Metas definidas em conjunto e resultados comparados a elas', 'Administração por objetivos'],
      ] },
      { tipo: 'classificar', id: 'recrutamento', titulo: 'Recrutamento interno ou externo?', pergunta: 'A característica é típica do recrutamento:', categorias: ['Interno', 'Externo'], itens: [
        ['Mais rápido e mais barato', 'Interno'], ['Motiva os funcionários pela perspectiva de crescimento', 'Interno'], ['Aproveita investimentos já feitos em treinamento', 'Interno'], ['Pode gerar conflitos entre quem foi e quem não foi promovido', 'Interno'],
        ['Traz novas ideias e experiências', 'Externo'], ['Renova a cultura organizacional', 'Externo'], ['Mais caro e demorado', 'Externo'], ['Enriquece o capital intelectual com talentos do mercado', 'Externo'],
      ] },
    ],
  },

  arquivologia: {
    intro: 'Três idades, princípios arquivísticos, métodos de arquivamento e o fluxo do protocolo.',
    teoria: 'Corrente: uso frequente (valor primário). Intermediário: uso eventual, aguardando prazos. Permanente: valor secundário (histórico), guarda definitiva.',
    exercicios: [
      { tipo: 'classificar', id: 'idades', titulo: 'Teoria das três idades', pergunta: 'O documento está na fase:', categorias: ['Corrente', 'Intermediária', 'Permanente'], itens: [
        ['Processo de compra em andamento, consultado diariamente', 'Corrente'], ['Contrato vigente usado pela fiscalização', 'Corrente'], ['Folhas de ponto do mês atual', 'Corrente'],
        ['Prestação de contas aprovada, aguardando prazo legal de guarda', 'Intermediária'], ['Processo concluído consultado raramente', 'Intermediária'],
        ['Ata de fundação da universidade', 'Permanente'], ['Fotografias históricas da inauguração do prédio', 'Permanente'], ['Documentos recolhidos ao arquivo histórico por valor secundário', 'Permanente'],
      ] },
      { tipo: 'classificar', id: 'principios', titulo: 'Princípios arquivísticos', pergunta: 'A definição corresponde ao princípio da:', categorias: ['Proveniência', 'Organicidade', 'Unicidade', 'Indivisibilidade', 'Cumulatividade'], itens: [
        ['Documentos de uma entidade não se misturam aos de outra', 'Proveniência'], ['Respeito aos fundos', 'Proveniência'],
        ['O arquivo reflete as funções e atividades do produtor', 'Organicidade'],
        ['Cada documento é único em seu contexto de produção', 'Unicidade'],
        ['O fundo deve ser preservado sem dispersão nem mutilação', 'Indivisibilidade'],
        ['O arquivo é uma formação progressiva, natural e orgânica', 'Cumulatividade'],
      ] },
      { tipo: 'classificar', id: 'metodos', titulo: 'Métodos de arquivamento', pergunta: 'A organização descrita usa o método:', categorias: ['Alfabético', 'Geográfico', 'Numérico', 'Ideográfico (por assunto)'], itens: [
        ['Fichas de servidores pelo sobrenome', 'Alfabético'], ['Pastas de fornecedores pela razão social', 'Alfabético'],
        ['Correspondências por estado e cidade de origem', 'Geográfico'], ['Relatórios das filiais por região', 'Geográfico'],
        ['Processos pelo número de protocolo', 'Numérico'], ['Notas fiscais pela numeração sequencial', 'Numérico'],
        ['Documentos por tema: compras, pessoal, contratos', 'Ideográfico (por assunto)'], ['Pastas por função, conforme o plano de classificação', 'Ideográfico (por assunto)'],
      ] },
      { tipo: 'ordenar', id: 'protocolo', titulo: 'Fluxo do protocolo', passos: ['Recebimento', 'Classificação (ostensivo ou sigiloso)', 'Registro', 'Autuação (formação do processo)', 'Distribuição', 'Tramitação'] },
    ],
  },

  'analise-balancos': {
    intro: 'Índices de liquidez, endividamento e rentabilidade, depreciação, CMV e classificação de contas.',
    teoria: 'Liquidez corrente = AC/PC; seca = (AC − estoques)/PC; geral = (AC + RLP)/(PC + PNC). Endividamento geral = (PC + PNC)/Ativo total. Margem líquida = lucro líquido/receita líquida. CMV = EI + compras − EF.',
    exercicios: [
      { tipo: 'calc', id: 'liquidez', titulo: 'Índices de liquidez', formula: 'LC = AC ÷ PC; LS = (AC − Estoques) ÷ PC', gerar: (r) => {
        const pc = escolha(r, [40, 50, 80, 100, 120]) * 1000; const ac = pc * escolha(r, [0.8, 1.2, 1.5, 2]); const est = ac * escolha(r, [0.2, 0.3, 0.4]); const seca = r() < 0.5;
        const v = seca ? (ac - est) / pc : ac / pc;
        return { enunciado: `Ativo circulante ${reais(ac)} (dos quais ${reais(est)} em estoques) e passivo circulante ${reais(pc)}. Qual a liquidez ${seca ? 'seca' : 'corrente'}? (2 casas)`, resposta: arred(v), passos: `${seca ? `(${reais(ac)} − ${reais(est)}) ÷ ${reais(pc)}` : `${reais(ac)} ÷ ${reais(pc)}`} = **${br(v)}**` };
      } },
      { tipo: 'calc', id: 'endividamento', titulo: 'Endividamento geral', formula: '(PC + PNC) ÷ Ativo total × 100', gerar: (r) => {
        const at = escolha(r, [200, 400, 500, 800, 1000]) * 1000; const pc = at * escolha(r, [0.1, 0.2, 0.25]); const pnc = at * escolha(r, [0.1, 0.15, 0.3]);
        return { enunciado: `Ativo total ${reais(at)}, passivo circulante ${reais(pc)} e passivo não circulante ${reais(pnc)}. Qual o endividamento geral (%)?`, resposta: ((pc + pnc) / at) * 100, unidade: '%', passos: `(${reais(pc)} + ${reais(pnc)}) ÷ ${reais(at)} = **${pct(((pc + pnc) / at) * 100)}** do ativo financiado por terceiros.` };
      } },
      { tipo: 'calc', id: 'margem', titulo: 'Margem líquida', formula: 'lucro líquido ÷ receita líquida × 100', gerar: (r) => {
        const rec = escolha(r, [200, 500, 800, 1000, 2000]) * 1000; const ll = rec * escolha(r, [0.04, 0.05, 0.08, 0.1, 0.12]);
        return { enunciado: `Receita líquida ${reais(rec)} e lucro líquido ${reais(ll)}. Qual a margem líquida (%)?`, resposta: (ll / rec) * 100, unidade: '%', passos: `${reais(ll)} ÷ ${reais(rec)} = **${pct((ll / rec) * 100)}**` };
      } },
      { tipo: 'calc', id: 'depreciacao', titulo: 'Depreciação linear', formula: '(custo − valor residual) ÷ vida útil', gerar: (r) => {
        const custo = escolha(r, [12000, 50000, 60000, 90000, 120000]); const res = custo * escolha(r, [0, 0.1, 0.2]); const vida = escolha(r, [4, 5, 10]);
        return { enunciado: `Equipamento custou ${reais(custo)}, com valor residual de ${reais(res)} e vida útil de ${vida} anos. Qual a depreciação anual (linear)?`, resposta: (custo - res) / vida, unidade: 'R$', passos: `(${reais(custo)} − ${reais(res)}) ÷ ${vida} = **${reais((custo - res) / vida)}** por ano.` };
      } },
      { tipo: 'calc', id: 'cmv', titulo: 'Custo das mercadorias vendidas', formula: 'CMV = EI + Compras − EF', gerar: (r) => {
        const ei = escolha(r, [10, 20, 30, 50]) * 1000; const comp = escolha(r, [80, 100, 150, 200]) * 1000; const ef = escolha(r, [15, 25, 40]) * 1000;
        return { enunciado: `Estoque inicial ${reais(ei)}, compras ${reais(comp)} e estoque final ${reais(ef)}. Qual o CMV?`, resposta: ei + comp - ef, unidade: 'R$', passos: `${reais(ei)} + ${reais(comp)} − ${reais(ef)} = **${reais(ei + comp - ef)}**` };
      } },
      { tipo: 'classificar', id: 'grupos', titulo: 'Grupos de contas', pergunta: 'A conta pertence ao grupo:', categorias: ['Ativo circulante', 'Ativo não circulante', 'Passivo circulante', 'Passivo não circulante', 'Patrimônio líquido', 'Resultado (receita ou despesa)'], itens: [
        ['Caixa', 'Ativo circulante'], ['Estoques de mercadorias', 'Ativo circulante'], ['Duplicatas a receber em 60 dias', 'Ativo circulante'],
        ['Veículos de uso da empresa', 'Ativo não circulante', 'Imobilizado.'], ['Marcas e patentes', 'Ativo não circulante', 'Intangível.'], ['Imóvel alugado a terceiros', 'Ativo não circulante', 'Investimentos.'],
        ['Fornecedores', 'Passivo circulante'], ['Salários a pagar', 'Passivo circulante'], ['Impostos a recolher', 'Passivo circulante'],
        ['Financiamento bancário de longo prazo', 'Passivo não circulante'],
        ['Capital social', 'Patrimônio líquido'], ['Reservas de lucros', 'Patrimônio líquido'],
        ['Receita de vendas', 'Resultado (receita ou despesa)'], ['Despesa com aluguel', 'Resultado (receita ou despesa)'],
      ] },
      { tipo: 'classificar', id: 'natureza', titulo: 'Natureza do saldo', pergunta: 'A conta tem saldo de natureza:', categorias: ['Devedora', 'Credora'], itens: [
        ['Caixa', 'Devedora'], ['Estoques', 'Devedora'], ['Despesas de salários', 'Devedora'], ['Veículos', 'Devedora'], ['Prejuízos acumulados', 'Devedora', 'Conta redutora do PL.'],
        ['Fornecedores', 'Credora'], ['Capital social', 'Credora'], ['Receita de serviços', 'Credora'], ['Depreciação acumulada', 'Credora', 'Conta redutora do ativo.'], ['Perdas estimadas com créditos de liquidação duvidosa', 'Credora', 'Redutora do ativo.'],
      ] },
    ],
  },

  'orcamento-publico': {
    intro: 'Estágios da receita e da despesa, classificação econômica e os instrumentos PPA, LDO e LOA.',
    teoria: 'Despesa: fixação, empenho, liquidação e pagamento. Receita: previsão, lançamento, arrecadação e recolhimento. Categorias econômicas: correntes e de capital (Lei 4.320/1964).',
    exercicios: [
      { tipo: 'ordenar', id: 'despesa', titulo: 'Estágios da despesa pública', passos: ['Fixação (na LOA)', 'Empenho', 'Liquidação', 'Pagamento'], explicacao: 'O empenho reserva a dotação; a liquidação verifica o direito do credor; o pagamento extingue a obrigação.' },
      { tipo: 'ordenar', id: 'receita', titulo: 'Estágios da receita pública', passos: ['Previsão', 'Lançamento', 'Arrecadação', 'Recolhimento'] },
      { tipo: 'classificar', id: 'receitas', titulo: 'Receitas correntes x de capital', pergunta: 'A receita é:', categorias: ['Corrente', 'De capital'], itens: [
        ['Tributária (impostos, taxas e contribuições de melhoria)', 'Corrente'], ['Contribuições sociais', 'Corrente'], ['Patrimonial (aluguéis e rendimentos)', 'Corrente'], ['Receita de serviços', 'Corrente'], ['Transferências correntes', 'Corrente'], ['Receita agropecuária', 'Corrente'],
        ['Operações de crédito (empréstimos obtidos)', 'De capital'], ['Alienação de bens', 'De capital'], ['Amortização de empréstimos concedidos', 'De capital'], ['Transferências de capital', 'De capital'],
      ] },
      { tipo: 'classificar', id: 'despesas', titulo: 'Despesas correntes x de capital', pergunta: 'A despesa é:', categorias: ['Corrente', 'De capital'], itens: [
        ['Pessoal e encargos sociais', 'Corrente'], ['Juros e encargos da dívida', 'Corrente'], ['Material de consumo', 'Corrente'], ['Diárias e passagens', 'Corrente'], ['Contas de energia e água', 'Corrente'],
        ['Construção de escola (investimento)', 'De capital'], ['Compra de equipamentos permanentes', 'De capital'], ['Aquisição de imóvel já em uso (inversão financeira)', 'De capital'], ['Amortização da dívida', 'De capital'],
      ] },
      { tipo: 'classificar', id: 'instrumentos', titulo: 'PPA, LDO ou LOA?', pergunta: 'A característica é do(a):', categorias: ['PPA', 'LDO', 'LOA'], itens: [
        ['Diretrizes, objetivos e metas de médio prazo, por 4 anos', 'PPA'], ['Vigora do 2º ano de um mandato até o 1º do seguinte', 'PPA'],
        ['Metas e prioridades para o exercício seguinte', 'LDO'], ['Orienta a elaboração da LOA', 'LDO'], ['Contém o Anexo de Metas Fiscais (LRF)', 'LDO'],
        ['Estima a receita e fixa a despesa do exercício', 'LOA'], ['Orçamentos fiscal, da seguridade social e de investimento das estatais', 'LOA'],
      ] },
    ],
  },

  'orcamento-pessoal': {
    intro: 'Reserva de emergência, comprometimento da renda, poder dos aportes mensais e o custo do rotativo.',
    teoria: 'Reserva de emergência: de 3 a 6 meses de despesas essenciais (mais para renda variável). Valor futuro de aportes mensais: VF = PMT × [(1 + i)ⁿ − 1] ÷ i.',
    exercicios: [
      { tipo: 'calc', id: 'reserva', titulo: 'Reserva de emergência', formula: 'despesas mensais × meses', gerar: (r) => {
        const d = escolha(r, [1800, 2500, 3200, 4000, 5500]); const m = escolha(r, [3, 4, 6, 12]);
        return { enunciado: `Despesas essenciais de ${reais(d)} por mês. Qual a reserva para ${m} meses?`, resposta: d * m, unidade: 'R$', passos: `${reais(d)} × ${m} = **${reais(d * m)}**` };
      } },
      { tipo: 'calc', id: 'comprometimento', titulo: 'Comprometimento da renda', formula: 'parcelas ÷ renda × 100', gerar: (r) => {
        const renda = escolha(r, [2500, 3000, 4000, 5000, 8000]); const parc = renda * escolha(r, [0.15, 0.2, 0.3, 0.35, 0.45]);
        return { enunciado: `Renda líquida de ${reais(renda)} e parcelas de dívidas somando ${reais(parc)}. Quanto da renda está comprometido (%)?`, resposta: (parc / renda) * 100, unidade: '%', passos: `${reais(parc)} ÷ ${reais(renda)} = **${pct((parc / renda) * 100)}**. Acima de 30% costuma acender o alerta.` };
      } },
      { tipo: 'calc', id: 'aportes', titulo: 'Aportes mensais', formula: 'VF = PMT × [(1 + i)ⁿ − 1] ÷ i', gerar: (r) => {
        const pmt = escolha(r, [100, 200, 300, 500]); const i = escolha(r, [0.5, 0.8, 1]); const n = escolha(r, [12, 24, 36, 60]); const vf = (pmt * ((1 + i / 100) ** n - 1)) / (i / 100);
        return { enunciado: `Aplicando ${reais(pmt)} todo mês, a ${br(i)}% a.m., quanto haverá após ${n} meses? (2 casas)`, resposta: arred(vf), unidade: 'R$', tol: 0.05, passos: `${reais(pmt)} × [(1 + ${br(i / 100, 3)})^${n} − 1] ÷ ${br(i / 100, 3)} = **${reais(vf)}** (aportado: ${reais(pmt * n)}).` };
      } },
      { tipo: 'calc', id: 'rotativo', titulo: 'Juros do rotativo', formula: 'dívida × (1 + i)ⁿ', gerar: (r) => {
        const d = escolha(r, [500, 1000, 2000, 3000]); const i = escolha(r, [8, 10, 12, 15]); const n = escolha(r, [1, 2, 3]);
        const v = d * (1 + i / 100) ** n;
        return { enunciado: `Fatura de ${reais(d)} entra no rotativo a ${i}% ao mês. Sem pagamentos, quanto será a dívida em ${n} mês(es)? (2 casas)`, resposta: arred(v), unidade: 'R$', tol: 0.02, passos: `${reais(d)} × ${br(1 + i / 100)}^${n} = **${reais(v)}** — por isso o rotativo é a dívida mais cara.` };
      } },
      { tipo: 'classificar', id: 'despesas', titulo: 'Tipos de despesa', pergunta: 'No orçamento doméstico, a despesa é:', categorias: ['Fixa', 'Variável', 'Eventual'], itens: [
        ['Aluguel', 'Fixa'], ['Mensalidade escolar', 'Fixa'], ['Plano de saúde', 'Fixa'], ['Parcela do financiamento', 'Fixa'],
        ['Supermercado', 'Variável'], ['Conta de energia', 'Variável'], ['Combustível', 'Variável'], ['Lazer no fim de semana', 'Variável'],
        ['IPVA', 'Eventual', 'Anual: provisione mensalmente.'], ['Conserto do carro', 'Eventual'], ['Presente de aniversário', 'Eventual'], ['Material escolar no início do ano', 'Eventual'],
      ] },
    ],
  },

  'renda-fixa': {
    intro: 'IR regressivo, rentabilidade real, percentual do CDI e o que o FGC cobre.',
    teoria: 'IR regressivo da renda fixa: até 180 dias 22,5%; 181 a 360, 20%; 361 a 720, 17,5%; acima de 720, 15% (sobre o rendimento). LCI, LCA e poupança são isentas para pessoa física.',
    exercicios: [
      { tipo: 'calc', id: 'ir', titulo: 'IR regressivo', formula: 'IR = rendimento × alíquota (22,5% / 20% / 17,5% / 15%)', gerar: (r) => {
        const dias = escolha(r, [90, 150, 200, 300, 400, 600, 800, 1100]); const rend = escolha(r, [400, 800, 1000, 1500, 2400]);
        const a = dias <= 180 ? 22.5 : dias <= 360 ? 20 : dias <= 720 ? 17.5 : 15;
        return { enunciado: `CDB resgatado após ${dias} dias com rendimento bruto de ${reais(rend)}. Qual o IR devido?`, resposta: (rend * a) / 100, unidade: 'R$', passos: `Prazo de ${dias} dias → alíquota de ${br(a)}%; ${reais(rend)} × ${br(a)}% = **${reais((rend * a) / 100)}**.` };
      } },
      { tipo: 'calc', id: 'cdi', titulo: 'Percentual do CDI', formula: 'taxa = CDI × percentual', gerar: (r) => {
        const cdi = escolha(r, [10, 10.65, 12, 13.65, 14.9]); const p = escolha(r, [90, 100, 105, 110, 120]);
        return { enunciado: `Com CDI de ${br(cdi)}% ao ano, quanto rende um título que paga ${p}% do CDI (% a.a.)? (2 casas)`, resposta: arred((cdi * p) / 100), unidade: '% a.a.', passos: `${br(cdi)}% × ${p}% = **${br((cdi * p) / 100)}% a.a.** (antes do IR).` };
      } },
      { tipo: 'calc', id: 'real', titulo: 'Rentabilidade real', formula: '(1 + nominal) ÷ (1 + inflação) − 1', gerar: (r) => {
        const n = escolha(r, [8, 10, 11, 12, 14]); const pi = escolha(r, [3.5, 4, 4.5, 5, 6]); const real = ((1 + n / 100) / (1 + pi / 100) - 1) * 100;
        return { enunciado: `Investimento rendeu ${n}% no ano e a inflação foi ${br(pi)}%. Qual o ganho real (%)? (2 casas)`, resposta: arred(real), unidade: '%', tol: 0.02, passos: `${br(1 + n / 100)} ÷ ${br(1 + pi / 100, 3)} − 1 = **${br(real)}%**` };
      } },
      { tipo: 'classificar', id: 'classes', titulo: 'Renda fixa ou variável?', pergunta: 'O investimento é de:', categorias: ['Renda fixa', 'Renda variável'], itens: [
        ['CDB', 'Renda fixa'], ['LCI', 'Renda fixa'], ['LCA', 'Renda fixa'], ['Tesouro Selic', 'Renda fixa'], ['Tesouro IPCA+', 'Renda fixa'], ['Debênture', 'Renda fixa'], ['Poupança', 'Renda fixa'], ['CRI', 'Renda fixa'],
        ['Ações', 'Renda variável'], ['Fundos imobiliários (FII)', 'Renda variável'], ['ETF de índice', 'Renda variável'], ['BDR', 'Renda variável'],
      ] },
      { tipo: 'classificar', id: 'fgc', titulo: 'Cobertura do FGC', pergunta: 'O investimento tem cobertura do FGC?', categorias: ['Coberto pelo FGC', 'Sem FGC'], itens: [
        ['CDB', 'Coberto pelo FGC'], ['LCI', 'Coberto pelo FGC'], ['LCA', 'Coberto pelo FGC'], ['Poupança', 'Coberto pelo FGC'], ['Letra de câmbio (LC)', 'Coberto pelo FGC'], ['RDB', 'Coberto pelo FGC'],
        ['Tesouro Direto', 'Sem FGC', 'A garantia é do próprio Tesouro Nacional.'], ['Debêntures', 'Sem FGC'], ['Ações', 'Sem FGC'], ['Fundos de investimento', 'Sem FGC'], ['CRI e CRA', 'Sem FGC'],
      ] },
    ],
  },

  sfn: {
    intro: 'Quem é quem no Sistema Financeiro Nacional, tipos de garantia e as fases da lavagem de dinheiro.',
    teoria: 'Normativos: CMN, CNSP e CNPC. Supervisores: Banco Central, CVM, Susep e Previc. Operadores: bancos, cooperativas, corretoras, bolsa, seguradoras, fundos de pensão.',
    exercicios: [
      { tipo: 'classificar', id: 'entidades', titulo: 'Estrutura do SFN', pergunta: 'A entidade é:', categorias: ['Órgão normativo', 'Entidade supervisora', 'Operador'], itens: [
        ['Conselho Monetário Nacional (CMN)', 'Órgão normativo'], ['Conselho Nacional de Seguros Privados (CNSP)', 'Órgão normativo'], ['Conselho Nacional de Previdência Complementar (CNPC)', 'Órgão normativo'],
        ['Banco Central do Brasil', 'Entidade supervisora'], ['Comissão de Valores Mobiliários (CVM)', 'Entidade supervisora'], ['Susep', 'Entidade supervisora'], ['Previc', 'Entidade supervisora'],
        ['Banco múltiplo', 'Operador'], ['Cooperativa de crédito', 'Operador'], ['Corretora de valores', 'Operador'], ['B3 (bolsa)', 'Operador'], ['Seguradora', 'Operador'], ['Fundo de pensão (EFPC)', 'Operador'],
      ] },
      { tipo: 'classificar', id: 'garantias', titulo: 'Garantias', pergunta: 'A garantia é:', categorias: ['Fidejussória (pessoal)', 'Real'], itens: [
        ['Aval', 'Fidejussória (pessoal)'], ['Fiança', 'Fidejussória (pessoal)'],
        ['Hipoteca', 'Real'], ['Penhor', 'Real'], ['Alienação fiduciária', 'Real'], ['Caução de títulos', 'Real'],
      ] },
      { tipo: 'ordenar', id: 'lavagem', titulo: 'Fases da lavagem de dinheiro', passos: ['Colocação: inserir o dinheiro ilícito no sistema', 'Ocultação: dificultar o rastreamento com várias operações', 'Integração: reincorporar o recurso à economia formal'] },
    ],
  },
};

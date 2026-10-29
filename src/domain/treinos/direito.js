// Treinos de Direito: classificação de institutos, ordenação de ritos e cálculos (dosimetria, prazos processuais,
// verbas trabalhistas, tributos e benefícios). Prazos consideram apenas fins de semana como dias não úteis.
import { escolha, inteiro, arred, br, reais } from './motor.js';

const DIA = 86400000;
const ddmm = (t) => { const d = new Date(t); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const util = (t) => ![0, 6].includes(new Date(t).getUTCDay());
// Data de intimação em dia útil entre fevereiro e novembro de 2027 (fora da suspensão de 20/12 a 20/01).
const intimacao = (r) => { let t = Date.UTC(2027, inteiro(r, 1, 10), inteiro(r, 1, 28)); while (!util(t)) t += DIA; return t; };
const FRACAO = { '1/6': 1 / 6, '1/5': 1 / 5, '1/4': 1 / 4, '1/3': 1 / 3, '1/2': 1 / 2, '2/3': 2 / 3 };

export default {
  constitucional: {
    intro: 'Classifique direitos fundamentais, competências e remédios constitucionais e monte o processo legislativo.',
    teoria: 'Art. 5º: direitos individuais e coletivos. Arts. 6º a 11: sociais. Arts. 12 e 13: nacionalidade. Arts. 14 a 16: políticos. Competências: art. 21 (exclusiva), 22 (privativa), 23 (comum), 24 (concorrente) e 30 (municípios).',
    exercicios: [
      { tipo: 'classificar', id: 'direitos', titulo: 'Categorias de direitos fundamentais', pergunta: 'O direito pertence a qual categoria da CF/88?', categorias: ['Individual/coletivo (art. 5º)', 'Social (arts. 6º a 11)', 'Nacionalidade (arts. 12 e 13)', 'Político (arts. 14 a 16)'], itens: [
        ['Inviolabilidade do domicílio', 'Individual/coletivo (art. 5º)'], ['Liberdade de reunião pacífica', 'Individual/coletivo (art. 5º)'], ['Habeas data', 'Individual/coletivo (art. 5º)'], ['Proibição da pena de banimento', 'Individual/coletivo (art. 5º)'],
        ['Direito ao transporte', 'Social (arts. 6º a 11)'], ['Férias com um terço a mais', 'Social (arts. 6º a 11)'], ['Licença-gestante de 120 dias', 'Social (arts. 6º a 11)'], ['Liberdade de associação sindical', 'Social (arts. 6º a 11)', 'Art. 8º.'],
        ['Condição de brasileiro nato de quem nasce no território nacional', 'Nacionalidade (arts. 12 e 13)'], ['Cargo de Ministro do STF privativo de nato', 'Nacionalidade (arts. 12 e 13)'], ['Língua portuguesa como idioma oficial', 'Nacionalidade (arts. 12 e 13)', 'Art. 13.'],
        ['Voto facultativo aos 16 anos', 'Político (arts. 14 a 16)'], ['Idade mínima de 35 anos para Senador', 'Político (arts. 14 a 16)'], ['Vedação de cassação de direitos políticos', 'Político (arts. 14 a 16)'], ['Plebiscito e referendo', 'Político (arts. 14 a 16)'],
      ] },
      { tipo: 'classificar', id: 'competencias', titulo: 'Repartição de competências', pergunta: 'A matéria é de competência:', categorias: ['Privativa da União (art. 22)', 'Comum (art. 23)', 'Concorrente (art. 24)', 'Municipal (art. 30)'], itens: [
        ['Legislar sobre direito penal', 'Privativa da União (art. 22)'], ['Legislar sobre direito do trabalho', 'Privativa da União (art. 22)'], ['Legislar sobre trânsito e transporte', 'Privativa da União (art. 22)'], ['Legislar sobre direito processual', 'Privativa da União (art. 22)'], ['Legislar sobre desapropriação', 'Privativa da União (art. 22)'],
        ['Cuidar da saúde e da assistência pública', 'Comum (art. 23)'], ['Proteger o meio ambiente e combater a poluição', 'Comum (art. 23)'], ['Combater as causas da pobreza', 'Comum (art. 23)'], ['Proteger documentos e obras de valor histórico', 'Comum (art. 23)'],
        ['Legislar sobre direito tributário e financeiro', 'Concorrente (art. 24)'], ['Legislar sobre educação e ensino', 'Concorrente (art. 24)'], ['Legislar sobre direito urbanístico', 'Concorrente (art. 24)'], ['Legislar sobre proteção ao consumidor', 'Concorrente (art. 24)'],
        ['Legislar sobre assuntos de interesse local', 'Municipal (art. 30)'], ['Organizar o transporte coletivo local', 'Municipal (art. 30)'], ['Fixar horário de funcionamento do comércio local', 'Municipal (art. 30)', 'Súmula Vinculante 38.'],
      ] },
      { tipo: 'classificar', id: 'remedios', titulo: 'Qual remédio constitucional?', pergunta: 'O instrumento adequado é:', categorias: ['Habeas corpus', 'Mandado de segurança', 'Habeas data', 'Mandado de injunção', 'Ação popular'], itens: [
        ['Preso há meses sem flagrante nem ordem judicial', 'Habeas corpus'], ['Ameaça concreta de prisão ilegal', 'Habeas corpus', 'HC preventivo.'],
        ['Candidato aprovado é preterido na nomeação por ato ilegal comprovado por documentos', 'Mandado de segurança', 'Direito líquido e certo.'], ['Autoridade nega alvará embora todos os requisitos estejam documentados', 'Mandado de segurança'],
        ['Cidadão quer corrigir dado errado sobre si em cadastro público', 'Habeas data'], ['Pessoa quer conhecer informações a seu respeito em banco de dados governamental', 'Habeas data'],
        ['Direito constitucional não pode ser exercido por falta de lei regulamentadora', 'Mandado de injunção'], ['Servidor não consegue exercer direito por omissão do legislador', 'Mandado de injunção'],
        ['Eleitor quer anular contrato lesivo ao patrimônio público', 'Ação popular'], ['Cidadão quer anular ato lesivo ao meio ambiente', 'Ação popular'],
      ] },
      { tipo: 'ordenar', id: 'processo-legislativo', titulo: 'Processo legislativo ordinário', passos: ['Iniciativa (apresentação do projeto)', 'Discussão e votação na Casa iniciadora', 'Revisão pela outra Casa', 'Sanção ou veto do Presidente (15 dias úteis)', 'Promulgação', 'Publicação'], explicacao: 'Se houver veto, ele é apreciado em sessão conjunta e pode ser derrubado pela maioria absoluta.' },
    ],
  },

  administrativo: {
    intro: 'Poderes, elementos dos atos, anulação x revogação e intervenção na propriedade em casos concretos.',
    teoria: 'Elementos do ato: competência, finalidade, forma, motivo e objeto. Anulação: ilegalidade, ex tunc. Revogação: conveniência e oportunidade, ex nunc, só pela administração.',
    exercicios: [
      { tipo: 'classificar', id: 'poderes', titulo: 'Poderes administrativos', pergunta: 'A situação revela o poder:', categorias: ['Hierárquico', 'Disciplinar', 'Regulamentar', 'De polícia'], itens: [
        ['Chefe avoca processo de competência de subordinado', 'Hierárquico'], ['Ministro delega competência a secretário', 'Hierárquico'], ['Superior anula ato ilegal de subordinado', 'Hierárquico'],
        ['Suspensão de servidor após processo disciplinar', 'Disciplinar'], ['Multa a empresa contratada por atraso na obra', 'Disciplinar', 'Vínculo contratual especial.'], ['Advertência a estagiário do órgão', 'Disciplinar'],
        ['Decreto que detalha a execução de uma lei', 'Regulamentar'], ['Presidente extingue cargo vago por decreto', 'Regulamentar', 'Decreto autônomo (art. 84, VI).'],
        ['Apreensão de alimentos vencidos em supermercado', 'De polícia'], ['Multa de trânsito a motorista', 'De polícia'], ['Concessão de licença para construir', 'De polícia'], ['Interdição de bar sem alvará', 'De polícia'],
      ] },
      { tipo: 'classificar', id: 'elementos', titulo: 'Elementos do ato administrativo', pergunta: 'O vício ou aspecto descrito refere-se a qual elemento?', categorias: ['Competência', 'Finalidade', 'Forma', 'Motivo', 'Objeto'], itens: [
        ['Ato praticado por servidor sem atribuição legal', 'Competência'], ['Usurpação de função', 'Competência'],
        ['Remoção de servidor para puni-lo', 'Finalidade', 'Desvio de finalidade.'], ['Desapropriação para perseguir um desafeto', 'Finalidade'],
        ['Contrato verbal fora das hipóteses admitidas', 'Forma'], ['Penalidade aplicada sem processo com ampla defesa', 'Forma'],
        ['Exoneração justificada por fato que não ocorreu', 'Motivo', 'Teoria dos motivos determinantes.'], ['Pressuposto de fato e de direito do ato', 'Motivo'],
        ['Ato que determina algo proibido por lei', 'Objeto'], ['Conteúdo impossível do ato', 'Objeto'],
      ] },
      { tipo: 'classificar', id: 'extincao', titulo: 'Anular ou revogar?', pergunta: 'A medida adequada é:', categorias: ['Anulação', 'Revogação', 'Nenhuma (não cabe desfazer)'], itens: [
        ['Licitação com vício insanável no edital', 'Anulação'], ['Nomeação de candidato que não preenchia requisito legal', 'Anulação'], ['Ato praticado com desvio de finalidade', 'Anulação'],
        ['Autorização de uso de praça que deixou de ser conveniente', 'Revogação'], ['Licitação regular que perdeu o interesse por fato superveniente', 'Revogação', 'Lei 14.133, art. 71, II.'], ['Permissão precária que não atende mais ao interesse público', 'Revogação'],
        ['Aposentadoria compulsória legalmente concedida (ato vinculado)', 'Nenhuma (não cabe desfazer)', 'Atos vinculados não são revogáveis.'], ['Licença já exaurida, que esgotou seus efeitos', 'Nenhuma (não cabe desfazer)'], ['Ato que gerou direito adquirido sem vício', 'Nenhuma (não cabe desfazer)'],
      ] },
      { tipo: 'classificar', id: 'intervencao', titulo: 'Intervenção na propriedade', pergunta: 'A situação é de:', categorias: ['Servidão administrativa', 'Requisição', 'Ocupação temporária', 'Limitação administrativa', 'Tombamento', 'Desapropriação'], itens: [
        ['Passagem de linhas de transmissão de energia em fazenda', 'Servidão administrativa'], ['Placa com nome de rua afixada na parede de um imóvel', 'Servidão administrativa'],
        ['Uso de hotel particular para abrigar vítimas de enchente', 'Requisição'], ['Uso de caminhões privados durante calamidade', 'Requisição'],
        ['Terreno vizinho usado para guardar máquinas da obra pública', 'Ocupação temporária'], ['Escola particular usada como local de votação', 'Ocupação temporária'],
        ['Altura máxima dos prédios em uma zona da cidade', 'Limitação administrativa'], ['Recuo obrigatório de construções', 'Limitação administrativa'],
        ['Casarão colonial protegido pelo valor histórico', 'Tombamento'], ['Centro histórico preservado por decreto do IPHAN', 'Tombamento'],
        ['Imóvel transferido ao Estado para construir hospital, com indenização', 'Desapropriação'], ['Fazenda improdutiva destinada à reforma agrária', 'Desapropriação'],
      ] },
    ],
  },

  licitacoes: {
    intro: 'Lei 14.133/2021 na prática: modalidade certa, contratação direta e a ordem das fases.',
    teoria: 'Modalidades: pregão (bens e serviços comuns), concorrência (bens e serviços especiais e obras/serviços de engenharia), concurso (trabalho técnico, científico ou artístico), leilão (alienação) e diálogo competitivo (soluções inovadoras). Dispensa (art. 75): a licitação é possível, mas a lei permite não licitar. Inexigibilidade (art. 74): a competição é inviável.',
    exercicios: [
      { tipo: 'classificar', id: 'modalidades', titulo: 'Modalidade adequada', pergunta: 'Qual a modalidade de licitação?', categorias: ['Pregão', 'Concorrência', 'Concurso', 'Leilão', 'Diálogo competitivo'], itens: [
        ['Compra de papel A4 e material de escritório', 'Pregão'], ['Contratação de serviço comum de limpeza', 'Pregão'], ['Aquisição de computadores de especificação usual de mercado', 'Pregão'],
        ['Construção de um hospital', 'Concorrência'], ['Serviço especial de engenharia de alta complexidade', 'Concorrência'], ['Obra de pavimentação de rodovia', 'Concorrência', 'Obras não podem ser licitadas por pregão.'],
        ['Escolha do melhor projeto arquitetônico com prêmio ao vencedor', 'Concurso'], ['Seleção de trabalho artístico para monumento', 'Concurso'],
        ['Venda de veículos inservíveis da frota', 'Leilão'], ['Alienação de bens apreendidos', 'Leilão'], ['Venda de imóvel público desafetado', 'Leilão'],
        ['Solução tecnológica inovadora que a administração não consegue especificar sozinha', 'Diálogo competitivo'], ['Contratação que exige definir a solução junto com os licitantes pré-selecionados', 'Diálogo competitivo'],
      ] },
      { tipo: 'classificar', id: 'contratacao-direta', titulo: 'Dispensa ou inexigibilidade?', pergunta: 'A contratação se enquadra em:', categorias: ['Dispensa', 'Inexigibilidade', 'Exige licitação'], itens: [
        ['Fornecedor exclusivo de um equipamento, comprovado', 'Inexigibilidade'], ['Show de artista consagrado pela crítica, por empresário exclusivo', 'Inexigibilidade'], ['Serviço técnico de notória especialização e natureza intelectual', 'Inexigibilidade'], ['Credenciamento de clínicas para atender servidores', 'Inexigibilidade'], ['Imóvel cuja localização torna necessária sua escolha', 'Inexigibilidade'],
        ['Emergência ou calamidade pública, com prazo máximo de 1 ano', 'Dispensa'], ['Compra de pequeno valor dentro do limite legal', 'Dispensa'], ['Licitação deserta, mantidas as condições do edital, no prazo de 1 ano', 'Dispensa'], ['Contratação de instituição de pesquisa sem fins lucrativos, nos termos da lei', 'Dispensa'],
        ['Construção de escola de grande valor, sem urgência', 'Exige licitação'], ['Compra anual de combustível para a frota', 'Exige licitação'],
      ] },
      { tipo: 'ordenar', id: 'fases', titulo: 'Fases do processo licitatório (art. 17)', passos: ['Preparatória (estudo técnico, termo de referência, orçamento)', 'Divulgação do edital', 'Apresentação de propostas e lances', 'Julgamento', 'Habilitação', 'Recursal', 'Homologação'], explicacao: 'Regra da Lei 14.133: julgamento antes da habilitação. A inversão (habilitação antes) é excepcional e motivada.' },
    ],
  },

  'servidor-publico': {
    intro: 'Lei 8.112/1990: formas de provimento, penalidades e o rito do processo disciplinar.',
    teoria: 'Provimento (art. 8º): nomeação, promoção, readaptação, reversão, aproveitamento, reintegração e recondução. Penalidades (art. 127): advertência, suspensão (até 90 dias), demissão, cassação de aposentadoria ou disponibilidade, destituição de cargo em comissão ou função comissionada.',
    exercicios: [
      { tipo: 'classificar', id: 'provimento', titulo: 'Formas de provimento', pergunta: 'A situação descreve:', categorias: ['Nomeação', 'Readaptação', 'Reversão', 'Aproveitamento', 'Reintegração', 'Recondução'], itens: [
        ['Aprovado em concurso assume cargo efetivo pela primeira vez', 'Nomeação'], ['Ingresso em cargo em comissão de livre escolha', 'Nomeação'],
        ['Servidor com limitação física passa a cargo compatível', 'Readaptação'], ['Investidura em cargo de atribuições afins por limitação de saúde', 'Readaptação'],
        ['Aposentado por invalidez retorna porque cessaram os motivos', 'Reversão'], ['Retorno do aposentado voluntário, no interesse da administração', 'Reversão'],
        ['Servidor em disponibilidade retorna a cargo equivalente', 'Aproveitamento'],
        ['Demissão anulada por decisão judicial; servidor volta ao cargo', 'Reintegração'], ['Retorno com ressarcimento de todas as vantagens após invalidação da demissão', 'Reintegração'],
        ['Servidor inabilitado no estágio probatório de outro cargo volta ao anterior', 'Recondução'], ['Volta ao cargo de origem porque o anterior ocupante foi reintegrado', 'Recondução'],
      ] },
      { tipo: 'classificar', id: 'penalidades', titulo: 'Penalidade aplicável', pergunta: 'Pela Lei 8.112, a conduta é punida com:', categorias: ['Advertência', 'Suspensão', 'Demissão'], itens: [
        ['Retirar documento da repartição sem autorização', 'Advertência'], ['Recusar fé a documentos públicos', 'Advertência'], ['Opor resistência injustificada ao andamento de processo', 'Advertência'], ['Promover manifestação de apreço no recinto da repartição', 'Advertência'], ['Manter sob chefia imediata o cônjuge ou parente até o 2º grau', 'Advertência'],
        ['Reincidência em falta punida com advertência', 'Suspensão'], ['Recusar-se a se submeter a inspeção médica determinada', 'Suspensão', 'Até 15 dias (art. 130, §1º).'], ['Exercer atividade incompatível com o cargo ou o horário', 'Suspensão'], ['Atribuir a outro servidor atividades estranhas ao cargo, fora de emergências', 'Suspensão'],
        ['Abandono de cargo (mais de 30 dias consecutivos)', 'Demissão'], ['Inassiduidade habitual', 'Demissão'], ['Valer-se do cargo para obter proveito pessoal', 'Demissão'], ['Receber propina em razão das atribuições', 'Demissão'], ['Proceder de forma desidiosa', 'Demissão'], ['Aplicação irregular de dinheiro público', 'Demissão'],
      ] },
      { tipo: 'ordenar', id: 'pad', titulo: 'Rito do processo administrativo disciplinar', passos: ['Publicação do ato que constitui a comissão (instauração)', 'Instrução: depoimentos, diligências e perícias', 'Interrogatório do acusado', 'Indiciação, com a tipificação da infração', 'Citação para defesa escrita (10 dias)', 'Relatório conclusivo da comissão', 'Julgamento pela autoridade (20 dias)'], explicacao: 'O PAD tem prazo de 60 dias, prorrogável por igual período; o inquérito administrativo compreende instrução, defesa e relatório.' },
    ],
  },

  penal: {
    intro: 'Dosimetria em três fases, enquadramento de crimes e excludentes de ilicitude em casos concretos.',
    teoria: 'Dosimetria (art. 68): pena-base pelas circunstâncias do art. 59; depois agravantes e atenuantes; por fim causas de aumento e de diminuição (frações). Concussão = exigir; corrupção passiva = solicitar, receber ou aceitar promessa.',
    exercicios: [
      { tipo: 'calc', id: 'dosimetria', titulo: 'Terceira fase da dosimetria', formula: 'pena × (1 + aumento) × (1 − diminuição), em meses', gerar: (r) => {
        const base = escolha(r, [3, 4, 5, 6, 8, 9, 12]); const a = escolha(r, ['1/6', '1/4', '1/3', '1/2', '2/3']); const d = escolha(r, ['1/6', '1/4', '1/3', '1/2', '2/3']);
        const meses = base * 12 * (1 + FRACAO[a]) * (1 - FRACAO[d]);
        return { enunciado: `Pena intermediária de ${base} anos. Incide uma causa de aumento de ${a} e, depois, uma causa de diminuição de ${d}. Qual a pena definitiva, em meses?`, resposta: arred(meses, 2), unidade: 'meses', passos: `${base * 12} meses × (1 + ${a}) = ${br(base * 12 * (1 + FRACAO[a]))}; × (1 − ${d}) = **${br(meses)} meses** (≈ ${Math.floor(meses / 12)} anos e ${br(meses % 12)} meses).` };
      } },
      { tipo: 'calc', id: 'tentativa', titulo: 'Pena da tentativa', formula: 'pena do consumado × (1 − fração de 1/3 a 2/3)', gerar: (r) => {
        const base = escolha(r, [6, 9, 12, 15, 18, 24]); const f = escolha(r, ['1/3', '1/2', '2/3']);
        return { enunciado: `A pena do crime consumado seria de ${base} anos. Por ser tentado, o juiz reduz ${f}, considerando o iter criminis percorrido. Qual a pena, em anos?`, resposta: base * (1 - FRACAO[f]), unidade: 'anos', passos: `${base} × (1 − ${f}) = **${br(base * (1 - FRACAO[f]))} anos**. Quanto mais perto da consumação, menor a redução.` };
      } },
      { tipo: 'classificar', id: 'titulos', titulo: 'Bem jurídico atingido', pergunta: 'O crime está no título dos crimes contra:', categorias: ['A pessoa', 'O patrimônio', 'A fé pública', 'A administração pública'], itens: [
        ['Homicídio', 'A pessoa'], ['Lesão corporal', 'A pessoa'], ['Ameaça', 'A pessoa', 'Crime contra a liberdade individual.'], ['Injúria', 'A pessoa', 'Crimes contra a honra estão no título da pessoa.'],
        ['Furto', 'O patrimônio'], ['Roubo', 'O patrimônio'], ['Estelionato', 'O patrimônio'], ['Extorsão', 'O patrimônio'], ['Receptação', 'O patrimônio'],
        ['Moeda falsa', 'A fé pública'], ['Falsidade ideológica', 'A fé pública'], ['Uso de documento falso', 'A fé pública'],
        ['Peculato', 'A administração pública'], ['Concussão', 'A administração pública'], ['Prevaricação', 'A administração pública'], ['Desacato', 'A administração pública'],
      ] },
      { tipo: 'classificar', id: 'excludentes', titulo: 'Excludentes de ilicitude', pergunta: 'A conduta está amparada por:', categorias: ['Legítima defesa', 'Estado de necessidade', 'Estrito cumprimento do dever legal', 'Exercício regular de direito'], itens: [
        ['Reage moderadamente a um soco iminente', 'Legítima defesa'], ['Defende terceiro de agressão injusta em curso', 'Legítima defesa'], ['Policial atinge sequestrador que ameaça matar o refém', 'Legítima defesa', 'Art. 25, parágrafo único.'],
        ['Arromba casa alheia para fugir de incêndio', 'Estado de necessidade'], ['Mata cão bravo que ataca uma criança, sem dono por perto', 'Estado de necessidade', 'Ataque de animal não é agressão humana.'], ['Náufrago disputa a única boia disponível', 'Estado de necessidade'],
        ['Oficial de justiça cumpre mandado de penhora', 'Estrito cumprimento do dever legal'], ['Policial prende em flagrante usando a força necessária', 'Estrito cumprimento do dever legal'],
        ['Lutador fere o adversário respeitando as regras do esporte', 'Exercício regular de direito'], ['Médico realiza cirurgia consentida', 'Exercício regular de direito'],
      ] },
      { tipo: 'classificar', id: 'funcionais', titulo: 'Crimes contra a administração', pergunta: 'A conduta configura:', categorias: ['Peculato', 'Concussão', 'Corrupção passiva', 'Corrupção ativa', 'Prevaricação'], itens: [
        ['Servidor desvia notebooks do órgão que estavam sob sua guarda', 'Peculato'], ['Tesoureiro se apropria de valores que recebeu em razão do cargo', 'Peculato'],
        ['Fiscal exige dinheiro para não autuar a empresa', 'Concussão'], ['Médico do SUS exige pagamento para operar', 'Concussão'],
        ['Servidor solicita "um agrado" para agilizar processo', 'Corrupção passiva'], ['Agente aceita promessa de vantagem para emitir licença', 'Corrupção passiva'],
        ['Empresário oferece dinheiro a fiscal para evitar multa', 'Corrupção ativa'], ['Particular promete presente ao servidor para furar a fila', 'Corrupção ativa'],
        ['Servidor deixa de lavrar auto de infração contra um amigo', 'Prevaricação', 'Satisfação de interesse ou sentimento pessoal.'], ['Delegado retarda inquérito por antipatia ao investigado', 'Prevaricação'],
      ] },
    ],
  },

  'processo-penal': {
    intro: 'Ação penal cabível, espécies de flagrante, ordem do rito ordinário e contagem de prazos penais.',
    teoria: 'Prazos penais (CPP, art. 798): contínuos, sem interrupção nos fins de semana; não se conta o dia do começo; se a intimação for na sexta, o prazo começa na segunda (Súmula 310 do STF); prazo que termina em fim de semana prorroga para o dia útil seguinte.',
    exercicios: [
      { tipo: 'classificar', id: 'acao', titulo: 'Espécie de ação penal', pergunta: 'Em regra, o crime é de ação penal:', categorias: ['Pública incondicionada', 'Pública condicionada à representação', 'Privada'], itens: [
        ['Homicídio', 'Pública incondicionada'], ['Roubo', 'Pública incondicionada'], ['Furto', 'Pública incondicionada'], ['Estupro', 'Pública incondicionada', 'Desde a Lei 13.718/2018.'], ['Lesão corporal contra a mulher em violência doméstica', 'Pública incondicionada', 'Súmula 542 do STJ.'],
        ['Ameaça', 'Pública condicionada à representação'], ['Lesão corporal leve fora da violência doméstica', 'Pública condicionada à representação', 'Lei 9.099, art. 88.'], ['Estelionato contra pessoa maior e capaz', 'Pública condicionada à representação'], ['Lesão corporal culposa', 'Pública condicionada à representação'],
        ['Calúnia contra particular', 'Privada'], ['Injúria simples', 'Privada'], ['Difamação', 'Privada'], ['Dano simples', 'Privada', 'CP, art. 167.'],
      ] },
      { tipo: 'classificar', id: 'flagrante', titulo: 'Espécie de flagrante', pergunta: 'A situação é de flagrante:', categorias: ['Próprio', 'Impróprio', 'Presumido', 'Preparado (ilegal)'], itens: [
        ['Preso no momento em que arromba o carro', 'Próprio'], ['Detido logo após esfaquear a vítima, ainda no local', 'Próprio'],
        ['Perseguido pela polícia desde o assalto até ser alcançado', 'Impróprio'], ['Vítima e populares correm atrás do ladrão logo após o furto', 'Impróprio'],
        ['Encontrado horas depois com a carteira e a arma usadas no roubo', 'Presumido'], ['Abordado logo depois com objetos que fazem presumir a autoria', 'Presumido'],
        ['Policial disfarçado induz o suspeito a vender droga e o prende em seguida, sem crime anterior', 'Preparado (ilegal)', 'Súmula 145 do STF: crime impossível.'], ['Agente provoca o crime e já cerca o local para impedir a consumação', 'Preparado (ilegal)'],
      ] },
      { tipo: 'ordenar', id: 'rito', titulo: 'Rito ordinário', passos: ['Oferecimento da denúncia ou queixa', 'Recebimento da denúncia', 'Citação do acusado', 'Resposta à acusação (10 dias)', 'Análise de absolvição sumária', 'Audiência de instrução e julgamento (interrogatório por último)', 'Alegações finais', 'Sentença'] },
      { tipo: 'calc', id: 'prazo-penal', titulo: 'Contagem de prazo penal', formula: 'dias corridos; começa no 1º dia útil após a intimação; fim de semana no fim prorroga', gerar: (r) => {
        const t0 = intimacao(r); const n = escolha(r, [2, 3, 5, 8, 10, 15]);
        let ini = t0 + DIA; while (!util(ini)) ini += DIA;
        let fim = ini + (n - 1) * DIA; while (!util(fim)) fim += DIA;
        return { enunciado: `Intimação em ${ddmm(t0)} (${SEMANA[new Date(t0).getUTCDay()]}) para um prazo penal de ${n} dias. Sem feriados no período, qual o último dia do prazo? Responda no formato dd/mm.`, resposta: ddmm(fim), passos: `Início em ${ddmm(ini)} (${SEMANA[new Date(ini).getUTCDay()]}); ${n} dias corridos terminam em **${ddmm(fim)}** (${SEMANA[new Date(fim).getUTCDay()]}), já considerada a prorrogação se cair no fim de semana.` };
      } },
    ],
  },

  civil: {
    intro: 'Capacidade, defeitos do negócio jurídico, bens e prazos prescricionais em situações do dia a dia.',
    teoria: 'Após a Lei 13.146/2015, só os menores de 16 anos são absolutamente incapazes. Defeitos que anulam: erro, dolo, coação, estado de perigo, lesão e fraude contra credores (4 anos). Simulação gera nulidade.',
    exercicios: [
      { tipo: 'classificar', id: 'capacidade', titulo: 'Capacidade civil', pergunta: 'A pessoa é:', categorias: ['Absolutamente incapaz', 'Relativamente incapaz', 'Plenamente capaz'], itens: [
        ['Criança de 12 anos', 'Absolutamente incapaz'], ['Adolescente de 15 anos', 'Absolutamente incapaz'],
        ['Jovem de 17 anos não emancipado', 'Relativamente incapaz'], ['Ébrio habitual', 'Relativamente incapaz'], ['Viciado em tóxico', 'Relativamente incapaz'], ['Pródigo', 'Relativamente incapaz'], ['Pessoa em coma que não pode exprimir sua vontade', 'Relativamente incapaz', 'Causa transitória ou permanente (art. 4º, III).'],
        ['Adulto com deficiência intelectual', 'Plenamente capaz', 'A deficiência não afeta a plena capacidade (Lei 13.146/2015).'], ['Jovem de 17 anos casado', 'Plenamente capaz', 'O casamento emancipa.'], ['Maior de 18 anos', 'Plenamente capaz'], ['Jovem de 16 anos emancipado pelos pais', 'Plenamente capaz'],
      ] },
      { tipo: 'classificar', id: 'defeitos', titulo: 'Defeitos do negócio jurídico', pergunta: 'O vício é:', categorias: ['Erro', 'Dolo', 'Coação', 'Estado de perigo', 'Lesão', 'Fraude contra credores'], itens: [
        ['Compra um anel de latão achando, sozinho, que era ouro', 'Erro'], ['Contrata serviço confundindo, por conta própria, a pessoa do prestador', 'Erro'],
        ['Vendedor mente sobre a quilometragem do carro para fechar negócio', 'Dolo'], ['Corretor esconde, de propósito, a infiltração do imóvel', 'Dolo', 'Silêncio intencional (dolo omissivo).'],
        ['Assina contrato sob ameaça de ter a família agredida', 'Coação'], ['Doa bem após ameaça grave de mal iminente', 'Coação'],
        ['Paga preço abusivo para socorro urgente de um filho, sabendo o hospital da situação', 'Estado de perigo'],
        ['Por inexperiência, vende terreno por um décimo do valor de mercado', 'Lesão'], ['Por necessidade premente, aceita prestação manifestamente desproporcional', 'Lesão'],
        ['Devedor insolvente doa todos os bens ao irmão para escapar dos credores', 'Fraude contra credores'],
      ] },
      { tipo: 'classificar', id: 'prazos', titulo: 'Prazos prescricionais', pergunta: 'A pretensão prescreve em:', categorias: ['1 ano', '3 anos', '5 anos', '10 anos'], itens: [
        ['Segurado contra o segurador', '1 ano'], ['Hospedeiros pela cobrança de hospedagem e alimentos', '1 ano'],
        ['Reparação civil', '3 anos'], ['Cobrança de aluguéis de prédios', '3 anos'], ['Ressarcimento de enriquecimento sem causa', '3 anos'],
        ['Cobrança de dívida líquida em instrumento particular', '5 anos'], ['Honorários de profissionais liberais', '5 anos'],
        ['Pretensão sem prazo específico em lei', '10 anos', 'Prazo geral do art. 205.'],
      ] },
      { tipo: 'classificar', id: 'bens', titulo: 'Bens públicos e benfeitorias', pergunta: 'Classifique:', categorias: ['Bem de uso comum', 'Bem de uso especial', 'Bem dominical', 'Benfeitoria necessária', 'Benfeitoria voluptuária'], itens: [
        ['Praça pública', 'Bem de uso comum'], ['Rua e estrada', 'Bem de uso comum'], ['Prédio de uma escola pública', 'Bem de uso especial'], ['Hospital municipal', 'Bem de uso especial'],
        ['Terras devolutas', 'Bem dominical'], ['Imóvel público desafetado e sem uso', 'Bem dominical'],
        ['Troca do telhado que ameaçava desabar', 'Benfeitoria necessária'], ['Reforço da fundação com rachaduras', 'Benfeitoria necessária'], ['Piscina em casa de veraneio', 'Benfeitoria voluptuária'], ['Fonte decorativa no jardim', 'Benfeitoria voluptuária'],
      ] },
    ],
  },

  'processo-civil': {
    intro: 'Prazos em dias úteis, recurso cabível, competência absoluta x relativa e a ordem do procedimento comum.',
    teoria: 'CPC: prazos em dias úteis (art. 219), exclui o dia do começo e inclui o do vencimento (art. 224), começo no 1º dia útil seguinte à intimação. Recursos em 15 dias (embargos de declaração: 5).',
    exercicios: [
      { tipo: 'calc', id: 'prazo-civil', titulo: 'Prazo em dias úteis', formula: 'conte só dias úteis a partir do dia útil seguinte à intimação', gerar: (r) => {
        const t0 = intimacao(r); const n = escolha(r, [5, 10, 15]);
        let t = t0; let k = 0; while (k < n) { t += DIA; if (util(t)) k++; }
        return { enunciado: `Intimação em ${ddmm(t0)} (${SEMANA[new Date(t0).getUTCDay()]}) para prazo processual civil de ${n} dias. Sem feriados, qual o último dia? Responda no formato dd/mm.`, resposta: ddmm(t), passos: `Excluindo o dia da intimação e contando só segunda a sexta, o ${n}º dia útil é **${ddmm(t)}** (${SEMANA[new Date(t).getUTCDay()]}).` };
      } },
      { tipo: 'classificar', id: 'recursos', titulo: 'Recurso cabível', pergunta: 'Contra a decisão cabe:', categorias: ['Apelação', 'Agravo de instrumento', 'Agravo interno', 'Embargos de declaração', 'Recurso especial', 'Recurso extraordinário'], itens: [
        ['Sentença que julga improcedente o pedido', 'Apelação'], ['Sentença que extingue o processo sem resolução de mérito', 'Apelação'],
        ['Decisão interlocutória que concede tutela provisória', 'Agravo de instrumento'], ['Interlocutória que rejeita alegação de convenção de arbitragem', 'Agravo de instrumento'],
        ['Decisão monocrática do relator no tribunal', 'Agravo interno'],
        ['Sentença omissa sobre um dos pedidos', 'Embargos de declaração'], ['Acórdão contraditório em seus fundamentos', 'Embargos de declaração'],
        ['Acórdão de TJ que contraria lei federal', 'Recurso especial'], ['Acórdão de TRF que dá a lei federal interpretação divergente de outro tribunal', 'Recurso especial'],
        ['Acórdão que contraria dispositivo da Constituição', 'Recurso extraordinário'],
      ] },
      { tipo: 'classificar', id: 'competencia', titulo: 'Competência absoluta ou relativa?', pergunta: 'O critério gera competência:', categorias: ['Absoluta', 'Relativa'], itens: [
        ['Em razão da matéria (ex.: vara de família)', 'Absoluta'], ['Em razão da pessoa (ex.: União como parte)', 'Absoluta'], ['Funcional (ex.: competência recursal do tribunal)', 'Absoluta'], ['Foro da situação do imóvel em ação possessória imobiliária', 'Absoluta', 'Art. 47, §2º.'],
        ['Foro do domicílio do réu', 'Relativa'], ['Em razão do valor da causa', 'Relativa'], ['Foro de eleição contratual', 'Relativa'], ['Foro do domicílio do autor em ação de alimentos', 'Relativa'],
      ] },
      { tipo: 'ordenar', id: 'procedimento', titulo: 'Procedimento comum', passos: ['Petição inicial', 'Citação do réu', 'Audiência de conciliação ou mediação', 'Contestação (15 dias)', 'Réplica do autor', 'Saneamento e organização do processo', 'Audiência de instrução e julgamento', 'Sentença'] },
    ],
  },

  tributario: {
    intro: 'Quem cobra cada imposto, espécies tributárias, anterioridade e as causas que suspendem, extinguem ou excluem o crédito.',
    teoria: 'Suspensão (MODERE LITUPA): moratória, depósito, reclamações e recursos, liminar, tutela antecipada e parcelamento. Exclusão: isenção e anistia. Extinção: pagamento, compensação, transação, remissão, prescrição, decadência, entre outras.',
    exercicios: [
      { tipo: 'classificar', id: 'entes', titulo: 'Competência dos impostos', pergunta: 'O imposto é de competência:', categorias: ['União', 'Estados e DF', 'Municípios e DF'], itens: [
        ['Imposto de Renda', 'União'], ['IPI', 'União'], ['IOF', 'União'], ['Imposto de Importação', 'União'], ['ITR', 'União'], ['Imposto Seletivo (EC 132/2023)', 'União'],
        ['ICMS', 'Estados e DF'], ['IPVA', 'Estados e DF'], ['ITCMD (herança e doação)', 'Estados e DF'],
        ['ISS', 'Municípios e DF'], ['IPTU', 'Municípios e DF'], ['ITBI', 'Municípios e DF'],
      ] },
      { tipo: 'classificar', id: 'especies', titulo: 'Espécies tributárias', pergunta: 'A cobrança descrita é:', categorias: ['Imposto', 'Taxa', 'Contribuição de melhoria', 'Empréstimo compulsório', 'Contribuição especial'], itens: [
        ['Cobrança sobre a propriedade de veículo', 'Imposto'], ['Cobrança sobre a renda auferida', 'Imposto'],
        ['Cobrança pela emissão de passaporte', 'Taxa'], ['Cobrança pela fiscalização sanitária de estabelecimento', 'Taxa', 'Poder de polícia.'], ['Cobrança pela coleta de lixo domiciliar', 'Taxa', 'Súmula Vinculante 19.'],
        ['Cobrança aos donos de imóveis valorizados por uma nova avenida', 'Contribuição de melhoria'],
        ['Cobrança federal restituível para atender calamidade pública', 'Empréstimo compulsório'],
        ['Contribuição do empregador sobre a folha de salários', 'Contribuição especial'], ['Contribuição para custeio da iluminação pública', 'Contribuição especial', 'Art. 149-A da CF.'],
      ] },
      { tipo: 'classificar', id: 'anterioridade', titulo: 'Anterioridade', pergunta: 'A majoração do tributo deve respeitar:', categorias: ['As duas anterioridades', 'Só a noventena', 'Só a anual', 'Nenhuma'], itens: [
        ['ICMS (regra geral)', 'As duas anterioridades'], ['IPTU (alíquota)', 'As duas anterioridades'], ['ITCMD', 'As duas anterioridades'],
        ['IPI', 'Só a noventena'], ['Contribuição social da seguridade', 'Só a noventena'],
        ['Imposto de Renda', 'Só a anual'], ['Base de cálculo do IPVA', 'Só a anual'], ['Base de cálculo do IPTU', 'Só a anual'],
        ['Imposto de Importação', 'Nenhuma'], ['IOF', 'Nenhuma'], ['Imposto extraordinário de guerra', 'Nenhuma'],
      ] },
      { tipo: 'classificar', id: 'credito', titulo: 'Crédito tributário', pergunta: 'O evento causa:', categorias: ['Suspensão da exigibilidade', 'Extinção do crédito', 'Exclusão do crédito'], itens: [
        ['Parcelamento', 'Suspensão da exigibilidade'], ['Depósito do montante integral', 'Suspensão da exigibilidade'], ['Recurso administrativo', 'Suspensão da exigibilidade'], ['Liminar em mandado de segurança', 'Suspensão da exigibilidade'], ['Moratória', 'Suspensão da exigibilidade'],
        ['Pagamento', 'Extinção do crédito'], ['Prescrição', 'Extinção do crédito'], ['Compensação', 'Extinção do crédito'], ['Remissão', 'Extinção do crédito'], ['Dação em pagamento de imóvel', 'Extinção do crédito'],
        ['Isenção', 'Exclusão do crédito'], ['Anistia', 'Exclusão do crédito'],
      ] },
      { tipo: 'calc', id: 'por-dentro', titulo: 'ICMS "por dentro"', formula: 'preço com imposto = valor sem imposto ÷ (1 − alíquota)', gerar: (r) => {
        const aliq = escolha(r, [7, 12, 17, 18, 20]); const total = escolha(r, [500, 1000, 2000, 2500, 5000]); const liquido = total * (1 - aliq / 100);
        return { enunciado: `Mercadoria vale ${reais(liquido)} sem o ICMS. Com alíquota de ${aliq}% cobrada "por dentro", qual o valor do ICMS?`, resposta: total * aliq / 100, unidade: 'R$', passos: `Base = ${reais(liquido)} ÷ (1 − ${br(aliq / 100)}) = ${reais(total)}; ICMS = ${reais(total)} × ${aliq}% = **${reais(total * aliq / 100)}**.` };
      } },
    ],
  },

  previdenciario: {
    intro: 'Quem é segurado de quê, quais benefícios exigem carência e o cálculo da aposentadoria e da pensão após a EC 103/2019.',
    teoria: 'Aposentadoria (regra geral): 60% da média + 2% por ano acima de 20 anos de contribuição (homem) ou 15 (mulher). Pensão por morte: 50% + 10% por dependente, até 100%.',
    exercicios: [
      { tipo: 'classificar', id: 'segurados', titulo: 'Tipo de segurado', pergunta: 'Para o RGPS, a pessoa é segurada:', categorias: ['Empregado', 'Empregado doméstico', 'Trabalhador avulso', 'Contribuinte individual', 'Segurado especial', 'Facultativo'], itens: [
        ['Vendedor com carteira assinada em uma loja', 'Empregado'], ['Comissionado sem vínculo efetivo em prefeitura', 'Empregado'],
        ['Cuidadora que trabalha 5 dias por semana na casa de uma família', 'Empregado doméstico'],
        ['Estivador escalado pelo OGMO', 'Trabalhador avulso'],
        ['Microempreendedor individual (MEI)', 'Contribuinte individual'], ['Eletricista autônomo', 'Contribuinte individual'], ['Sócio-administrador que recebe pró-labore', 'Contribuinte individual'],
        ['Pescador artesanal em regime de economia familiar', 'Segurado especial'], ['Pequeno agricultor familiar sem empregados permanentes', 'Segurado especial'],
        ['Estudante de 18 anos sem renda que decide contribuir', 'Facultativo'], ['Dona de casa sem renda própria', 'Facultativo'],
      ] },
      { tipo: 'classificar', id: 'carencia', titulo: 'Carência', pergunta: 'O benefício:', categorias: ['Exige carência', 'Independe de carência'], itens: [
        ['Aposentadoria programada', 'Exige carência', '180 contribuições.'], ['Auxílio por incapacidade temporária por doença comum', 'Exige carência', '12 contribuições.'], ['Auxílio-reclusão', 'Exige carência', '24 contribuições.'], ['Aposentadoria especial', 'Exige carência'],
        ['Pensão por morte', 'Independe de carência'], ['Auxílio-acidente', 'Independe de carência'], ['Salário-família', 'Independe de carência'], ['Auxílio por incapacidade decorrente de acidente', 'Independe de carência'], ['Salário-maternidade da empregada', 'Independe de carência'],
      ] },
      { tipo: 'classificar', id: 'ramos', titulo: 'Ramos da seguridade', pergunta: 'A prestação pertence à:', categorias: ['Saúde', 'Previdência social', 'Assistência social'], itens: [
        ['Vacinação gratuita na UBS', 'Saúde'], ['Cirurgia pelo SUS', 'Saúde'], ['Vigilância sanitária', 'Saúde'],
        ['Aposentadoria do RGPS', 'Previdência social'], ['Salário-maternidade', 'Previdência social'], ['Pensão por morte', 'Previdência social'],
        ['Benefício de Prestação Continuada (BPC)', 'Assistência social', 'Operacionalizado pelo INSS, mas assistencial.'], ['Atendimento no CRAS', 'Assistência social'], ['Habilitação de pessoa com deficiência carente', 'Assistência social'],
      ] },
      { tipo: 'calc', id: 'aposentadoria', titulo: 'Valor da aposentadoria (EC 103)', formula: 'média × [60% + 2% × (anos − mínimo)]', gerar: (r) => {
        const mulher = r() < 0.5; const minimo = mulher ? 15 : 20; const anos = inteiro(r, minimo, minimo + 20); const media = escolha(r, [2000, 2500, 3000, 3500, 4000, 5000]);
        const pct = Math.min(100, 60 + 2 * (anos - minimo));
        return { enunciado: `${mulher ? 'Segurada' : 'Segurado'} com ${anos} anos de contribuição e média salarial de ${reais(media)}. Pela regra geral da EC 103/2019, qual o valor da aposentadoria?`, resposta: media * pct / 100, unidade: 'R$', passos: `Coeficiente = 60% + 2% × (${anos} − ${minimo}) = ${pct}%; ${reais(media)} × ${pct}% = **${reais(media * pct / 100)}**.` };
      } },
      { tipo: 'calc', id: 'pensao', titulo: 'Valor da pensão por morte', formula: 'base × min(100%, 50% + 10% × dependentes)', gerar: (r) => {
        const deps = inteiro(r, 1, 6); const base = escolha(r, [2000, 3000, 4000, 4500, 6000]); const pct = Math.min(100, 50 + 10 * deps);
        return { enunciado: `O segurado falecido recebia aposentadoria de ${reais(base)} e deixou ${deps} dependente(s). Pela regra geral, qual o valor total da pensão?`, resposta: base * pct / 100, unidade: 'R$', passos: `Cota familiar 50% + ${deps} × 10% = ${pct}%; ${reais(base)} × ${pct}% = **${reais(base * pct / 100)}** (nunca inferior ao salário mínimo quando for a única renda).` };
      } },
    ],
  },

  'calculos-trabalhistas': {
    intro: 'Os cálculos da CLT que caem em prova e no dia a dia: férias, 13º, horas extras, adicional noturno e aviso prévio.',
    teoria: 'Mensalista de 44 h semanais: divisor 220. Hora extra: adicional mínimo de 50%. Noturno urbano: adicional de 20%. Férias: salário + 1/3. 13º proporcional: 1/12 por mês (fração de 15 dias conta). Aviso prévio: 30 dias + 3 por ano completo, até 90.',
    exercicios: [
      { tipo: 'calc', id: 'ferias', titulo: 'Férias com 1/3', formula: 'salário × 4/3', gerar: (r) => {
        const s = escolha(r, [1500, 1800, 2400, 3000, 3600, 4500, 6000]);
        return { enunciado: `Qual o valor bruto de 30 dias de férias, com o terço constitucional, para salário de ${reais(s)}?`, resposta: (s * 4) / 3, unidade: 'R$', passos: `${reais(s)} + ${reais(s / 3)} = **${reais((s * 4) / 3)}**` };
      } },
      { tipo: 'calc', id: 'decimo', titulo: '13º proporcional', formula: 'salário × meses ÷ 12', gerar: (r) => {
        const s = escolha(r, [1800, 2400, 3000, 3600, 4800]); const m = inteiro(r, 2, 11);
        return { enunciado: `Empregado trabalhou ${m} meses no ano (todos com mais de 15 dias) e recebe ${reais(s)}. Qual o 13º proporcional?`, resposta: (s * m) / 12, unidade: 'R$', passos: `${reais(s)} × ${m}/12 = **${reais((s * m) / 12)}**` };
      } },
      { tipo: 'calc', id: 'extras', titulo: 'Horas extras', formula: 'salário ÷ 220 × 1,5 × horas', gerar: (r) => {
        const s = escolha(r, [1760, 2200, 2640, 3300, 4400]); const h = inteiro(r, 4, 30); const ad = escolha(r, [50, 50, 100]);
        return { enunciado: `Salário de ${reais(s)} (44 h semanais). O empregado fez ${h} horas extras com adicional de ${ad}%. Quanto recebe por elas?`, resposta: (s / 220) * (1 + ad / 100) * h, unidade: 'R$', passos: `Hora normal ${reais(s / 220)}; extra ${reais((s / 220) * (1 + ad / 100))}; × ${h} = **${reais((s / 220) * (1 + ad / 100) * h)}**` };
      } },
      { tipo: 'calc', id: 'noturno', titulo: 'Adicional noturno', formula: 'salário ÷ 220 × 20% × horas noturnas', gerar: (r) => {
        const s = escolha(r, [1760, 2200, 2640, 3300]); const h = escolha(r, [20, 35, 40, 56, 70]);
        return { enunciado: `Salário de ${reais(s)}. No mês, o empregado urbano trabalhou ${h} horas noturnas (já convertidas em horas reduzidas). Qual o valor do adicional noturno?`, resposta: (s / 220) * 0.2 * h, unidade: 'R$', passos: `${reais(s / 220)} × 20% = ${reais((s / 220) * 0.2)} por hora; × ${h} = **${reais((s / 220) * 0.2 * h)}**` };
      } },
      { tipo: 'calc', id: 'aviso', titulo: 'Aviso prévio proporcional', formula: 'dias = 30 + 3 × anos completos (máx. 90)', gerar: (r) => {
        const anos = inteiro(r, 0, 25);
        return { enunciado: `Empregado dispensado sem justa causa após ${anos} ano(s) completo(s) de serviço. Quantos dias de aviso prévio?`, resposta: Math.min(90, 30 + 3 * anos), unidade: 'dias', passos: `30 + 3 × ${anos} = ${30 + 3 * anos}${30 + 3 * anos > 90 ? ' → limitado a **90**' : ` → **${30 + 3 * anos} dias**`}.` };
      } },
      { tipo: 'calc', id: 'fgts', titulo: 'Multa do FGTS', formula: 'saldo × 40% (sem justa causa) ou 20% (acordo)', gerar: (r) => {
        const saldo = escolha(r, [3000, 5400, 8000, 12500, 20000]); const acordo = r() < 0.4;
        return { enunciado: `Saldo do FGTS de ${reais(saldo)}. Qual a indenização devida pelo empregador na ${acordo ? 'extinção por acordo (art. 484-A)' : 'dispensa sem justa causa'}?`, resposta: saldo * (acordo ? 0.2 : 0.4), unidade: 'R$', passos: `${reais(saldo)} × ${acordo ? 20 : 40}% = **${reais(saldo * (acordo ? 0.2 : 0.4))}**` };
      } },
      { tipo: 'classificar', id: 'faltas-graves', titulo: 'Justa causa ou rescisão indireta?', pergunta: 'A conduta autoriza:', categorias: ['Justa causa (art. 482)', 'Rescisão indireta (art. 483)'], itens: [
        ['Empregado falta 40 dias sem justificativa nem contato', 'Justa causa (art. 482)', 'Abandono de emprego.'], ['Empregado furta mercadoria da loja', 'Justa causa (art. 482)', 'Ato de improbidade.'], ['Empregado se recusa a cumprir ordem direta e legítima do chefe', 'Justa causa (art. 482)', 'Insubordinação.'], ['Empregado trabalha embriagado de forma habitual', 'Justa causa (art. 482)'], ['Desídia reiterada no desempenho das funções', 'Justa causa (art. 482)'],
        ['Empregador atrasa salários por meses seguidos', 'Rescisão indireta (art. 483)'], ['Chefe trata o empregado com rigor excessivo e humilhações', 'Rescisão indireta (art. 483)'], ['Empresa não deposita o FGTS', 'Rescisão indireta (art. 483)'], ['Empregador exige serviços alheios ao contrato', 'Rescisão indireta (art. 483)'], ['Empregador agride fisicamente o empregado', 'Rescisão indireta (art. 483)'],
      ] },
      { tipo: 'classificar', id: 'suspensao', titulo: 'Suspensão ou interrupção?', pergunta: 'O afastamento é:', categorias: ['Interrupção (paga salário)', 'Suspensão (não paga salário)'], itens: [
        ['Férias', 'Interrupção (paga salário)'], ['Primeiros 15 dias de afastamento por doença', 'Interrupção (paga salário)'], ['Até 3 dias consecutivos por casamento', 'Interrupção (paga salário)'], ['Licença-paternidade', 'Interrupção (paga salário)'], ['Doação voluntária de sangue (1 dia a cada 12 meses)', 'Interrupção (paga salário)'],
        ['Afastamento por doença a partir do 16º dia', 'Suspensão (não paga salário)', 'Passa a receber benefício do INSS.'], ['Suspensão disciplinar', 'Suspensão (não paga salário)'], ['Participação em greve, em regra', 'Suspensão (não paga salário)'], ['Licença não remunerada a pedido do empregado', 'Suspensão (não paga salário)'],
      ] },
    ],
  },
};

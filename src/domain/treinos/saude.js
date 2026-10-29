// Treinos de saúde, segurança do trabalho e educação. Valores fictícios para exercício teórico: na prática clínica
// valem o protocolo institucional, a prescrição e a dupla checagem.
import { escolha, inteiro, arred, br, reais } from './motor.js';

export default {
  'calculos-clinicos': {
    intro: 'Conversão de unidades, dose por peso, diluição, insulina e IMC — complementa o laboratório de gotejamento.',
    teoria: '1 g = 1.000 mg; 1 mg = 1.000 mcg. Dose (mL) = dose prescrita × volume ÷ quantidade disponível. Insulina U-100: 100 UI por mL. IMC = peso ÷ altura².',
    exercicios: [
      { tipo: 'calc', id: 'conversao', titulo: 'Conversão de unidades', formula: '1 g = 1.000 mg; 1 mg = 1.000 mcg', gerar: (r) => {
        const casos = [['g', 'mg', 1000], ['mg', 'mcg', 1000], ['mg', 'g', 0.001], ['mcg', 'mg', 0.001]];
        const [de, para, k] = escolha(r, casos); const v = escolha(r, de === 'mcg' ? [250, 500, 1500, 2500] : de === 'mg' && para === 'g' ? [250, 500, 750, 1500] : [0.25, 0.5, 1.5, 2, 5]);
        return { enunciado: `Converta ${br(v, 3)} ${de} para ${para}.`, resposta: arred(v * k, 4), unidade: para, passos: `${br(v, 3)} × ${br(k, 3)} = **${br(v * k, 4)} ${para}**` };
      } },
      { tipo: 'calc', id: 'peso', titulo: 'Dose por peso', formula: 'dose = mg/kg × peso', gerar: (r) => {
        const mgkg = escolha(r, [5, 10, 15, 20, 25]); const kg = inteiro(r, 8, 40);
        return { enunciado: `Prescrição de ${mgkg} mg/kg para uma criança de ${kg} kg. Qual a dose em mg?`, resposta: mgkg * kg, unidade: 'mg', passos: `${mgkg} × ${kg} = **${mgkg * kg} mg**` };
      } },
      { tipo: 'calc', id: 'diluicao', titulo: 'Diluição de frasco-ampola', formula: 'mL = dose × volume diluído ÷ quantidade do frasco', gerar: (r) => {
        const [q, un] = escolha(r, [[5000000, 'UI'], [1000, 'mg'], [500, 'mg'], [2000000, 'UI']]); const vol = escolha(r, [5, 8, 10]); const dose = q * escolha(r, [0.2, 0.25, 0.4, 0.5, 0.6]);
        return { enunciado: `Frasco com ${br(q)} ${un} diluído em ${vol} mL. Prescrição: ${br(dose)} ${un}. Quantos mL aspirar?`, resposta: arred((dose * vol) / q, 2), unidade: 'mL', tol: 0.05, passos: `${br(dose)} × ${vol} ÷ ${br(q)} = **${br((dose * vol) / q)} mL**` };
      } },
      { tipo: 'calc', id: 'insulina', titulo: 'Insulina U-100', formula: 'mL = UI prescritas ÷ 100', gerar: (r) => {
        const ui = escolha(r, [6, 8, 10, 12, 15, 20, 24, 30]);
        return { enunciado: `Prescrição de ${ui} UI de insulina regular (U-100). Usando seringa de 1 mL, quantos mL aspirar?`, resposta: ui / 100, unidade: 'mL', tol: 0.005, passos: `${ui} ÷ 100 = **${br(ui / 100)} mL** (na seringa de insulina graduada em UI, aspire ${ui} UI).` };
      } },
      { tipo: 'calc', id: 'imc', titulo: 'Índice de massa corporal', formula: 'IMC = peso ÷ altura²', gerar: (r) => {
        const kg = inteiro(r, 50, 110); const m = escolha(r, [1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85]); const imc = kg / (m * m);
        return { enunciado: `Adulto com ${kg} kg e ${br(m)} m. Qual o IMC? (2 casas)`, resposta: arred(imc), unidade: 'kg/m²', passos: `${kg} ÷ ${br(m)}² = **${br(imc)}** → ${imc < 18.5 ? 'baixo peso' : imc < 25 ? 'eutrofia' : imc < 30 ? 'sobrepeso' : 'obesidade'} (classificação da OMS).` };
      } },
      { tipo: 'ordenar', id: 'rcp', titulo: 'Suporte básico de vida (adulto)', passos: ['Verificar a segurança do local', 'Checar a responsividade da vítima', 'Chamar ajuda e pedir um DEA', 'Verificar respiração e pulso (até 10 segundos)', 'Iniciar compressões torácicas (30 compressões : 2 ventilações)', 'Usar o DEA assim que chegar'], explicacao: 'Compressões de 100 a 120 por minuto, com profundidade de 5 a 6 cm, permitindo o retorno do tórax.' },
      { tipo: 'classificar', id: 'vias', titulo: 'Vias de administração', pergunta: 'A via é:', categorias: ['Enteral', 'Parenteral', 'Tópica'], itens: [
        ['Oral', 'Enteral'], ['Sublingual', 'Enteral'], ['Por sonda nasogástrica', 'Enteral'], ['Retal', 'Enteral'],
        ['Intravenosa', 'Parenteral'], ['Intramuscular', 'Parenteral'], ['Subcutânea', 'Parenteral'], ['Intradérmica', 'Parenteral'],
        ['Pomada na pele', 'Tópica'], ['Colírio', 'Tópica'], ['Creme vaginal', 'Tópica'],
      ] },
    ],
  },

  sus: {
    intro: 'Princípios do SUS, níveis de atenção e os indicadores de saúde mais cobrados.',
    teoria: 'Doutrinários: universalidade, integralidade e equidade. Organizativos: descentralização, regionalização, hierarquização e participação da comunidade (Lei 8.142/1990: conferências e conselhos).',
    exercicios: [
      { tipo: 'classificar', id: 'principios', titulo: 'Princípios do SUS', pergunta: 'A definição corresponde ao princípio:', categorias: ['Universalidade', 'Integralidade', 'Equidade', 'Descentralização', 'Regionalização e hierarquização', 'Participação da comunidade'], itens: [
        ['Acesso de todos aos serviços, sem exigência de contribuição', 'Universalidade'], ['Saúde como direito de todos e dever do Estado', 'Universalidade'],
        ['Ações de promoção, prevenção, tratamento e reabilitação articuladas', 'Integralidade'], ['Ver a pessoa como um todo, em todos os níveis de complexidade', 'Integralidade'],
        ['Tratar desigualmente os desiguais, priorizando quem mais precisa', 'Equidade'],
        ['Direção única em cada esfera de governo, com ênfase na municipalização', 'Descentralização'],
        ['Rede organizada por níveis de complexidade e por território', 'Regionalização e hierarquização'],
        ['Conselhos e conferências de saúde com usuários', 'Participação da comunidade'], ['Controle social previsto na Lei 8.142/1990', 'Participação da comunidade'],
      ] },
      { tipo: 'classificar', id: 'niveis', titulo: 'Níveis de atenção', pergunta: 'O serviço pertence à atenção:', categorias: ['Primária', 'Secundária', 'Terciária'], itens: [
        ['Unidade Básica de Saúde e Saúde da Família', 'Primária'], ['Vacinação de rotina', 'Primária'], ['Pré-natal de baixo risco', 'Primária'], ['Visita do agente comunitário de saúde', 'Primária'],
        ['Ambulatório de especialidades (cardiologia, ortopedia)', 'Secundária'], ['Unidade de Pronto Atendimento (UPA)', 'Secundária'], ['Exames de média complexidade', 'Secundária'],
        ['UTI de hospital de referência', 'Terciária'], ['Transplante de órgãos', 'Terciária'], ['Cirurgia cardíaca de alta complexidade', 'Terciária'],
      ] },
      { tipo: 'calc', id: 'mortalidade', titulo: 'Mortalidade infantil', formula: 'óbitos de menores de 1 ano ÷ nascidos vivos × 1.000', gerar: (r) => {
        const nv = escolha(r, [4000, 5000, 8000, 10000, 12500]); const ob = inteiro(r, 40, 180);
        return { enunciado: `Município com ${br(nv)} nascidos vivos e ${ob} óbitos de menores de 1 ano no ano. Qual o coeficiente de mortalidade infantil (por mil)? (2 casas)`, resposta: arred((ob / nv) * 1000), unidade: '‰', passos: `${ob} ÷ ${br(nv)} × 1.000 = **${br((ob / nv) * 1000)} por mil nascidos vivos**` };
      } },
      { tipo: 'calc', id: 'incidencia', titulo: 'Incidência', formula: 'casos novos ÷ população × 100.000', gerar: (r) => {
        const pop = escolha(r, [50000, 120000, 200000, 400000]); const casos = inteiro(r, 20, 400);
        return { enunciado: `${casos} casos novos de dengue em uma população de ${br(pop)} habitantes. Qual a incidência por 100 mil habitantes? (2 casas)`, resposta: arred((casos / pop) * 100000), passos: `${casos} ÷ ${br(pop)} × 100.000 = **${br((casos / pop) * 100000)}**` };
      } },
      { tipo: 'calc', id: 'letalidade', titulo: 'Letalidade', formula: 'óbitos pela doença ÷ casos da doença × 100', gerar: (r) => {
        const casos = escolha(r, [200, 250, 400, 500, 800]); const ob = inteiro(r, 2, 40);
        return { enunciado: `Entre ${casos} casos confirmados de uma doença, houve ${ob} óbitos. Qual a letalidade (%)?`, resposta: (ob / casos) * 100, unidade: '%', passos: `${ob} ÷ ${casos} × 100 = **${br((ob / casos) * 100)}%**. Letalidade mede a gravidade da doença entre os doentes; mortalidade usa a população toda.` };
      } },
    ],
  },

  'riscos-nr': {
    intro: 'Riscos ambientais e suas cores, insalubridade x periculosidade, classes de incêndio e os cálculos de adicionais e de frequência de acidentes.',
    teoria: 'Mapa de riscos: verde físico, vermelho químico, marrom biológico, amarelo ergonômico, azul acidente. Insalubridade: 10, 20 ou 40% do salário mínimo. Periculosidade: 30% do salário-base.',
    exercicios: [
      { tipo: 'classificar', id: 'riscos', titulo: 'Grupos de risco', pergunta: 'O agente é um risco:', categorias: ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'De acidente'], itens: [
        ['Ruído de máquinas', 'Físico'], ['Calor de fornos', 'Físico'], ['Radiação ionizante', 'Físico'], ['Vibração de ferramentas', 'Físico'],
        ['Poeira de sílica', 'Químico'], ['Vapores de solventes', 'Químico'], ['Fumos metálicos de solda', 'Químico'],
        ['Vírus e bactérias em hospital', 'Biológico'], ['Fungos em arquivos úmidos', 'Biológico'],
        ['Postura inadequada por longos períodos', 'Ergonômico'], ['Movimentos repetitivos', 'Ergonômico'], ['Levantamento manual de peso excessivo', 'Ergonômico'],
        ['Máquina sem proteção', 'De acidente'], ['Fiação elétrica exposta', 'De acidente'], ['Piso escorregadio e arranjo físico inadequado', 'De acidente'],
      ] },
      { tipo: 'classificar', id: 'adicionais', titulo: 'Insalubridade ou periculosidade?', pergunta: 'A exposição gera, em regra, adicional de:', categorias: ['Insalubridade', 'Periculosidade'], itens: [
        ['Ruído acima do limite de tolerância', 'Insalubridade'], ['Agentes biológicos em hospital de isolamento', 'Insalubridade'], ['Calor excessivo', 'Insalubridade'], ['Poeiras minerais', 'Insalubridade'],
        ['Abastecimento com inflamáveis', 'Periculosidade'], ['Manuseio de explosivos', 'Periculosidade'], ['Trabalho com energia elétrica', 'Periculosidade'], ['Segurança patrimonial exposta a roubos', 'Periculosidade'], ['Trabalho em motocicleta', 'Periculosidade'],
      ] },
      { tipo: 'classificar', id: 'incendio', titulo: 'Classes de incêndio', pergunta: 'O fogo é de classe:', categorias: ['A', 'B', 'C', 'D', 'K'], itens: [
        ['Papel e madeira', 'A'], ['Tecidos e estofados', 'A'],
        ['Gasolina', 'B'], ['Gás de cozinha (GLP) vazando', 'B'],
        ['Painel elétrico energizado', 'C'], ['Computador ligado em curto', 'C'],
        ['Magnésio em pó', 'D'], ['Sódio metálico', 'D'],
        ['Óleo de fritura em cozinha industrial', 'K'],
      ] },
      { tipo: 'calc', id: 'insalubridade', titulo: 'Adicional de insalubridade', formula: 'salário mínimo × 10%, 20% ou 40%', gerar: (r) => {
        const sm = escolha(r, [1412, 1518, 1600]); const [g, p] = escolha(r, [['mínimo', 10], ['médio', 20], ['máximo', 40]]);
        return { enunciado: `Considere salário mínimo de ${reais(sm)}. Qual o adicional de insalubridade em grau ${g}?`, resposta: (sm * p) / 100, unidade: 'R$', passos: `${reais(sm)} × ${p}% = **${reais((sm * p) / 100)}**` };
      } },
      { tipo: 'calc', id: 'periculosidade', titulo: 'Adicional de periculosidade', formula: 'salário-base × 30%', gerar: (r) => {
        const s = escolha(r, [1800, 2400, 3000, 3600, 4200]);
        return { enunciado: `Eletricista com salário-base de ${reais(s)}. Qual o adicional de periculosidade?`, resposta: s * 0.3, unidade: 'R$', passos: `${reais(s)} × 30% = **${reais(s * 0.3)}**` };
      } },
      { tipo: 'calc', id: 'frequencia', titulo: 'Taxa de frequência de acidentes', formula: 'acidentes × 1.000.000 ÷ horas-homem', gerar: (r) => {
        const hh = escolha(r, [200000, 400000, 500000, 800000, 1000000]); const ac = inteiro(r, 1, 12);
        return { enunciado: `${ac} acidente(s) com lesão em ${br(hh)} horas-homem de exposição. Qual a taxa de frequência? (2 casas)`, resposta: arred((ac * 1000000) / hh), passos: `${ac} × 1.000.000 ÷ ${br(hh)} = **${br((ac * 1000000) / hh)}**` };
      } },
    ],
  },

  didatica: {
    intro: 'Taxonomia de Bloom, funções da avaliação, tendências pedagógicas e teóricos da aprendizagem.',
    teoria: 'Bloom revisada: lembrar, entender, aplicar, analisar, avaliar e criar. Avaliação diagnóstica (antes), formativa (durante, para ajustar) e somativa (ao final, para classificar).',
    exercicios: [
      { tipo: 'classificar', id: 'bloom', titulo: 'Taxonomia de Bloom', pergunta: 'O verbo do objetivo corresponde ao nível:', categorias: ['Lembrar', 'Entender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'], itens: [
        ['Listar', 'Lembrar'], ['Identificar', 'Lembrar'], ['Definir', 'Lembrar'],
        ['Explicar', 'Entender'], ['Resumir', 'Entender'], ['Exemplificar', 'Entender'],
        ['Resolver', 'Aplicar'], ['Calcular', 'Aplicar'], ['Executar', 'Aplicar'],
        ['Comparar', 'Analisar'], ['Diferenciar', 'Analisar'], ['Organizar', 'Analisar'],
        ['Julgar', 'Avaliar'], ['Justificar', 'Avaliar'], ['Criticar', 'Avaliar'],
        ['Elaborar', 'Criar'], ['Planejar', 'Criar'], ['Produzir', 'Criar'],
      ] },
      { tipo: 'classificar', id: 'avaliacao', titulo: 'Funções da avaliação', pergunta: 'A avaliação é:', categorias: ['Diagnóstica', 'Formativa', 'Somativa'], itens: [
        ['Sondagem no início do ano para saber o que a turma já domina', 'Diagnóstica'], ['Identifica pré-requisitos antes de um novo conteúdo', 'Diagnóstica'],
        ['Feedback contínuo durante o processo para ajustar o ensino', 'Formativa'], ['Atividades corrigidas e devolvidas com comentários ao longo da unidade', 'Formativa'],
        ['Prova final para atribuir nota e decidir a aprovação', 'Somativa'], ['Balanço do que foi aprendido ao fim do bimestre', 'Somativa'],
      ] },
      { tipo: 'classificar', id: 'tendencias', titulo: 'Tendências pedagógicas', pergunta: 'A descrição corresponde à pedagogia:', categorias: ['Tradicional', 'Escola Nova', 'Tecnicista', 'Libertadora', 'Crítico-social dos conteúdos'], itens: [
        ['Professor transmite conteúdos prontos; aluno é receptor passivo', 'Tradicional'], ['Ênfase na memorização e na disciplina rígida', 'Tradicional'],
        ['Aluno no centro, aprender fazendo, interesses da criança', 'Escola Nova'],
        ['Instrução programada, eficiência e objetivos operacionais', 'Tecnicista'],
        ['Educação problematizadora, diálogo e temas geradores (Paulo Freire)', 'Libertadora'], ['Crítica à educação bancária', 'Libertadora'],
        ['Domínio dos conteúdos como instrumento de transformação social (Libâneo, Saviani)', 'Crítico-social dos conteúdos'],
      ] },
      { tipo: 'classificar', id: 'teoricos', titulo: 'Teóricos da aprendizagem', pergunta: 'O conceito é associado a:', categorias: ['Piaget', 'Vygotsky', 'Wallon', 'Paulo Freire', 'Ausubel'], itens: [
        ['Estágios: sensório-motor, pré-operatório, operatório concreto e formal', 'Piaget'], ['Assimilação, acomodação e equilibração', 'Piaget'],
        ['Zona de desenvolvimento proximal', 'Vygotsky'], ['Mediação simbólica e interação social', 'Vygotsky'],
        ['Afetividade e emoção no desenvolvimento da pessoa completa', 'Wallon'],
        ['Educação bancária x educação problematizadora', 'Paulo Freire'], ['Círculos de cultura e palavras geradoras', 'Paulo Freire'],
        ['Aprendizagem significativa e conhecimentos prévios (subsunçores)', 'Ausubel'],
      ] },
    ],
  },
};

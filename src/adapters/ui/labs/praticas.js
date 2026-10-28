// Práticas guiadas locais para finanças, investimentos, RH e direito do trabalho.
import { esc, toast } from '../dom.js';

const CENARIOS = {
  financas: {
    titulo: 'Planejamento financeiro',
    ajuda: 'Monte um orçamento mensal fictício, calcule o saldo e simule uma reserva. Valores não são aconselhamento financeiro.',
    campos: [['renda', 'Renda líquida mensal (R$)', 4200], ['fixas', 'Despesas fixas (R$)', 1850], ['variaveis', 'Despesas variáveis (R$)', 1250], ['meses', 'Meses de reserva desejados', 4]],
    calcular: (v) => {
      const saldo = v.renda - v.fixas - v.variaveis;
      const gastos = v.fixas + v.variaveis;
      return { resumo: saldo >= 0 ? `Sobra estimada: R$ ${fmt(saldo)} por mês.` : `Déficit estimado: R$ ${fmt(-saldo)} por mês.`, detalhe: `Meta de reserva (${v.meses} meses de despesas): R$ ${fmt(gastos * v.meses)}. O cálculo não considera outras rendas, dívidas ou sazonalidade.` };
    },
    missoes: [
      ['orcamento', 'Mapeie receitas e despesas', 'Registre renda e os dois grupos de despesas para visualizar o saldo.', (v) => v.renda > 0 && v.fixas >= 0 && v.variaveis >= 0],
      ['reserva', 'Defina uma meta de reserva', 'Calcule uma reserva para pelo menos três meses de despesas.', (v) => v.meses >= 3 && v.renda >= v.fixas + v.variaveis],
    ],
  },
  investimentos: {
    titulo: 'Carteira e juros compostos',
    ajuda: 'Compare alocações hipotéticas por prazo e risco. Rentabilidades são informativas e não previsões.',
    campos: [['aporte', 'Aporte inicial (R$)', 10000], ['taxa', 'Taxa anual hipotética (%)', 8], ['anos', 'Prazo (anos)', 5], ['risco', 'Perfil de risco (1–5)', 2]],
    calcular: (v) => {
      const futuro = v.aporte * (1 + v.taxa / 100) ** v.anos;
      const opcoes = v.risco <= 2 ? 'priorize liquidez e volatilidade compatível; compare custos e risco de crédito' : v.risco === 3 ? 'diversifique entre classes e ajuste o prazo ao objetivo' : 'aceite maior oscilação apenas se prazo e capacidade de perda forem compatíveis';
      return { resumo: `Valor hipotético após ${v.anos} anos: R$ ${fmt(futuro)} (sem aportes adicionais, impostos ou custos).`, detalhe: `Risco informado: ${v.risco}/5; lembrete educacional: ${opcoes}. Retorno passado ou hipotético não garante resultado.` };
    },
    missoes: [
      ['juros', 'Calcule juros compostos', 'Simule um capital com taxa e prazo positivos.', (v) => v.aporte > 0 && v.taxa >= 0 && v.anos > 0],
      ['perfil', 'Relacione risco e prazo', 'Escolha um nível de risco e avalie sua compatibilidade com o objetivo.', (v) => v.risco >= 1 && v.risco <= 5 && v.anos > 0],
    ],
  },
  rh: {
    titulo: 'Planejamento de pessoas',
    ajuda: 'Estruture uma vaga e um plano inicial de integração sem inserir dados pessoais reais.',
    campos: [['vaga', 'Nome da vaga', 'Analista de atendimento'], ['competencias', 'Competências essenciais (separadas por vírgula)', 'comunicação, organização, análise'], ['dias', 'Dias planejados para onboarding', 30], ['etapas', 'Etapas de integração', 3]],
    calcular: (v) => ({ resumo: `Plano para “${v.vaga}”: ${v.competencias.split(',').map((x) => x.trim()).filter(Boolean).length} competências essenciais e ${v.etapas} etapas em ${v.dias} dias.`, detalhe: 'Use critérios relacionados às atividades da vaga, comunicação acessível e avaliação consistente. Evite critérios discriminatórios e proteja dados de candidatos.' }),
    missoes: [
      ['vaga', 'Descreva a vaga com critérios', 'Defina um cargo e liste competências essenciais observáveis.', (v) => v.vaga.trim().length >= 4 && v.competencias.split(',').filter((x) => x.trim()).length >= 2],
      ['integracao', 'Planeje a integração', 'Estruture ao menos três etapas distribuídas por um período de 14 dias ou mais.', (v) => v.dias >= 14 && v.etapas >= 3],
    ],
  },
  direito: {
    titulo: 'Relações de trabalho — checklist educacional',
    ajuda: 'Organize pontos de conferência de uma situação hipotética. Não substitui orientação jurídica nem consulta à legislação vigente.',
    campos: [['salario', 'Remuneração mensal hipotética (R$)', 3000], ['meses', 'Meses completos no período', 12], ['dias', 'Dias de aviso considerados', 30], ['situacao', 'Modalidade de desligamento', 'Sem justa causa']],
    calcular: (v) => {
      const decimo = v.salario * Math.min(12, v.meses) / 12;
      const aviso = v.salario * v.dias / 30;
      return { resumo: `Estimativa simples: 13º proporcional de R$ ${fmt(decimo)} e referência mensal de aviso de R$ ${fmt(aviso)}.`, detalhe: `Cenário: ${v.situacao}. O cálculo não inclui férias, médias variáveis, descontos, convenções coletivas ou exceções legais; confirme regras e datas no caso real.` };
    },
    missoes: [
      ['proporcional', 'Calcule uma parcela proporcional', 'Informe remuneração positiva e meses entre 1 e 12.', (v) => v.salario > 0 && v.meses >= 1 && v.meses <= 12],
      ['checklist', 'Revise o contexto do vínculo', 'Escolha a modalidade e confira remuneração, período e aviso.', (v) => v.salario > 0 && v.dias >= 0 && v.situacao.trim().length > 2],
    ],
  },
};
const fmt = (n) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CAMPOS_NUM = new Set(['renda', 'fixas', 'variaveis', 'meses', 'aporte', 'taxa', 'anos', 'risco', 'dias', 'etapas', 'salario']);

export default async function praticas(el, ctx, kit) {
  const { id } = kit;
  const spec = CENARIOS[id];
  if (!spec) { el.innerHTML = '<div class="vazio">Prática não encontrada.</div>'; return; }
  const salvo = kit.estado.carregar() ?? {};
  const st = { ...Object.fromEntries(spec.campos.map(([k, , v]) => [k, salvo[k] ?? v])), concluidas: salvo.concluidas ?? [] };
  const missoes = kit.missoes(spec.missoes.map(([mid, titulo, descricao, check]) => ({ id: mid, titulo, descricao, xp: 15, checar: (s) => check(s) })));
  kit.aoReiniciar(() => { kit.estado.limpar(); location.reload(); });

  const desenhar = () => {
    const resultado = spec.calcular(st);
    kit.estado.salvar({ ...st });
    el.innerHTML = `<div class="split"><section class="card pilha"><div><h2 class="mt0">${esc(spec.titulo)}</h2><p class="muted mb0">${esc(spec.ajuda)}</p></div>
      <form class="grade-2" id="formPratica">${spec.campos.map(([key, label]) => `<label class="campo">${esc(label)}<input name="${esc(key)}" type="${CAMPOS_NUM.has(key) ? 'number' : 'text'}" ${CAMPOS_NUM.has(key) ? 'min="0" step="any"' : ''} value="${esc(st[key])}" required></label>`).join('')}</form>
      <div class="painel"><strong>${esc(resultado.resumo)}</strong><p class="mini sutil mt1 mb0">${esc(resultado.detalhe)}</p></div>
      <div class="linha"><button class="btn primario" form="formPratica" type="submit">Atualizar simulação</button><a class="btn" href="#/questoes?area=${esc(id)}">Questões relacionadas</a></div></section>
      <aside class="card"><div id="missoes"></div><p class="mini sutil mt2">Estado guardado localmente neste navegador. Não use informações pessoais ou dados reais de terceiros.</p></aside></div>`;
    const form = el.querySelector('#formPratica');
    form.addEventListener('input', () => {
      for (const [key] of spec.campos) {
        const input = form.elements.namedItem(key);
        st[key] = CAMPOS_NUM.has(key) ? Number(input.value) : input.value;
      }
      const resultadoAtual = spec.calcular(st);
      form.nextElementSibling.innerHTML = `<strong>${esc(resultadoAtual.resumo)}</strong><p class="mini sutil mt1 mb0">${esc(resultadoAtual.detalhe)}</p>`;
      kit.estado.salvar({ ...st });
      missoes.verificar(st);
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); toast('Simulação atualizada.', { tipo: 'ok', ms: 1600 }); });
  };
  desenhar();
}

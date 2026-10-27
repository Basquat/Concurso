import { PLANO, razao, dre, balanco } from './ledger.js';

const CAIXA = new Set(['1.1.1', '1.1.2']);

function atividadeConta(codigo) {
  const c = PLANO.find((item) => item.codigo === codigo);
  if (!c) return 'operacional';
  if (c.grupo === 'pl' || codigo === '2.1.3') return 'financiamento';
  if (c.grupo === 'ativo' && codigo.startsWith('1.2.')) return 'investimento';
  return 'operacional';
}

// Fluxo de caixa didático classificado pelo grupo da conta de contrapartida.
// Não substitui a classificação e as divulgações exigidas pelo CPC 03/NBC TSP.
export function dfcSimplificada(lancamentos) {
  const atividades = { operacional: 0, investimento: 0, financiamento: 0 };
  const fluxos = Object.fromEntries(Object.keys(atividades).map((k) => [k, { entradas: 0, saidas: 0 }]));
  for (const l of lancamentos) {
    const caixa = l.partidas.filter((p) => CAIXA.has(p.conta));
    const variacao = caixa.reduce((s, p) => s + (p.tipo === 'D' ? p.valor : -p.valor), 0);
    if (!variacao) continue;
    const contrapartidas = l.partidas.filter((p) => !CAIXA.has(p.conta));
    const pesos = { operacional: 0, investimento: 0, financiamento: 0 };
    for (const p of contrapartidas) pesos[atividadeConta(p.conta)] += p.valor;
    const categoria = Object.keys(pesos).sort((a, b) => pesos[b] - pesos[a])[0];
    atividades[categoria] += variacao;
    if (variacao > 0) fluxos[categoria].entradas += variacao;
    else    fluxos[categoria].saidas += -variacao;
  }
  return { atividades, fluxos, variacaoLiquida: Object.values(atividades).reduce((s, v) => s + v, 0), observacao: 'Classificação educativa estimada pelas contas de contrapartida; avalie a natureza de cada fluxo e as exceções normativas.' };
}

export function mutacoesPL(lancamentos) {
  const r = razao(lancamentos);
  const contas = PLANO.filter((c) => c.grupo === 'pl').map((c) => ({
    ...c,
    debitos: r[c.codigo]?.totalD ?? 0,
    creditos: r[c.codigo]?.totalC ?? 0,
    saldo: r[c.codigo]?.saldo ?? 0,
  })).filter((c) => c.debitos || c.creditos || c.saldo);
  const resultado = dre(lancamentos).resultado;
  const totalContas = contas.reduce((s, c) => s + c.saldo, 0);
  return { contas, resultado, totalContas, totalPL: totalContas + resultado };
}

export function indicadoresContabeis(lancamentos) {
  const r = razao(lancamentos);
  const b = balanco(lancamentos);
  const saldoAtivo = (c) => Math.max(0, r[c.codigo]?.saldo ?? 0);
  const ativoCirculante = PLANO.filter((c) => c.grupo === 'ativo' && c.codigo.startsWith('1.1.')).reduce((s, c) => s + saldoAtivo(c), 0);
  const disponibilidades = saldoAtivo(PLANO.find((c) => c.codigo === '1.1.1')) + saldoAtivo(PLANO.find((c) => c.codigo === '1.1.2'));
  const clientes = saldoAtivo(PLANO.find((c) => c.codigo === '1.1.3'));
  const estoque = saldoAtivo(PLANO.find((c) => c.codigo === '1.1.4'));
  const passivoCirculante = b.passivo.filter((c) => c.codigo.startsWith('2.1.')).reduce((s, c) => s + c.valor, 0);
  const passivoTotal = b.totalPassivo;
  const ativoTotal = b.totalAtivo;
  const razaoOuNulo = (n, d) => d > 0 ? n / d : null;
  return {
    ativoCirculante,
    disponibilidades,
    clientes,
    estoque,
    passivoCirculante,
    capitalCirculanteLiquido: ativoCirculante - passivoCirculante,
    liquidezCorrente: razaoOuNulo(ativoCirculante, passivoCirculante),
    liquidezSeca: razaoOuNulo(ativoCirculante - estoque, passivoCirculante),
    liquidezImediata: razaoOuNulo(disponibilidades, passivoCirculante),
    endividamento: razaoOuNulo(passivoTotal, ativoTotal),
    margemLiquida: razaoOuNulo(dre(lancamentos).resultado, dre(lancamentos).totalReceitas),
    observacao: 'Índices dependem de saldos completos, classificação adequada e contexto setorial; não são diagnóstico isolado de solvência.'
  };
}

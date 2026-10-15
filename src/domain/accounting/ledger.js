// Escrituração por partidas dobradas (empresa comercial fictícia). Valores em centavos (inteiros)
// para evitar erro de arredondamento. Plano simplificado — o setor público usa o PCASP (MCASP/STN).

export const PLANO = [
  ['1.1.1', 'Caixa', 'ativo'], ['1.1.2', 'Bancos Conta Movimento', 'ativo'], ['1.1.3', 'Clientes (Duplicatas a Receber)', 'ativo'],
  ['1.1.4', 'Estoque de Mercadorias', 'ativo'], ['1.2.1', 'Móveis e Utensílios', 'ativo'], ['1.2.2', 'Veículos', 'ativo'],
  ['2.1.1', 'Fornecedores', 'passivo'], ['2.1.2', 'Salários a Pagar', 'passivo'], ['2.1.3', 'Empréstimos Bancários', 'passivo'],
  ['2.1.4', 'Impostos a Recolher', 'passivo'],
  ['2.3.1', 'Capital Social', 'pl'], ['2.3.2', 'Lucros ou Prejuízos Acumulados', 'pl'],
  ['3.1.1', 'Receita de Vendas', 'receita'], ['3.1.2', 'Receita de Serviços', 'receita'],
  ['4.1.1', 'Custo das Mercadorias Vendidas (CMV)', 'despesa'], ['4.2.1', 'Despesa com Salários', 'despesa'],
  ['4.2.2', 'Despesa com Aluguel', 'despesa'], ['4.2.3', 'Despesa com Energia', 'despesa'], ['4.2.4', 'Despesas Financeiras (Juros)', 'despesa'],
].map(([codigo, nome, grupo]) => ({ codigo, nome, grupo, natureza: ['ativo', 'despesa'].includes(grupo) ? 'D' : 'C' }));

const conta = (cod) => PLANO.find((c) => c.codigo === cod);

export function centavos(txt) {
  const s = String(txt).trim().replace(/^R\$\s*/, '');
  const n = /,/.test(s) ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export const reais = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// lancamento: { historico, partidas: [{ conta: '1.1.1', tipo: 'D'|'C', valor: centavos }] }
export function validarLancamento(l) {
  const erros = [];
  if (!l.historico?.trim()) erros.push('Informe o histórico (descrição do fato contábil).');
  const ps = l.partidas ?? [];
  if (!ps.some((p) => p.tipo === 'D')) erros.push('Todo lançamento precisa de ao menos um DÉBITO.');
  if (!ps.some((p) => p.tipo === 'C')) erros.push('Todo lançamento precisa de ao menos um CRÉDITO.');
  for (const p of ps) {
    if (!conta(p.conta)) erros.push(`Conta ${p.conta || '(vazia)'} não existe no plano de contas.`);
    if (!Number.isInteger(p.valor) || p.valor <= 0) erros.push(`Valor inválido na conta ${p.conta}: use valores positivos.`);
  }
  const d = ps.filter((p) => p.tipo === 'D').reduce((s, p) => s + (p.valor || 0), 0);
  const c = ps.filter((p) => p.tipo === 'C').reduce((s, p) => s + (p.valor || 0), 0);
  if (d !== c) erros.push(`Partidas dobradas: débitos (${reais(d)}) ≠ créditos (${reais(c)}). A diferença é ${reais(Math.abs(d - c))}.`);
  const dup = ps.filter((p) => ps.some((q) => q !== p && q.conta === p.conta && q.tipo !== p.tipo));
  if (dup.length) erros.push(`A conta ${conta(dup[0].conta)?.nome} foi debitada e creditada no mesmo lançamento.`);
  return erros;
}

export function razao(lancamentos) {
  const r = {};
  lancamentos.forEach((l, i) => {
    for (const p of l.partidas) {
      const x = (r[p.conta] ??= { debitos: [], creditos: [] });
      (p.tipo === 'D' ? x.debitos : x.creditos).push({ n: i + 1, valor: p.valor, historico: l.historico });
    }
  });
  for (const [cod, x] of Object.entries(r)) {
    const d = x.debitos.reduce((s, m) => s + m.valor, 0);
    const c = x.creditos.reduce((s, m) => s + m.valor, 0);
    x.totalD = d;
    x.totalC = c;
    x.saldo = conta(cod).natureza === 'D' ? d - c : c - d; // saldo na natureza da conta
  }
  return r;
}

export const saldo = (lancamentos, cod) => razao(lancamentos)[cod]?.saldo ?? 0;

export function balancete(lancamentos) {
  const r = razao(lancamentos);
  const linhas = PLANO.filter((c) => r[c.codigo]).map((c) => {
    const s = r[c.codigo].totalD - r[c.codigo].totalC;
    return { ...c, devedor: s > 0 ? s : 0, credor: s < 0 ? -s : 0 };
  });
  const totalD = linhas.reduce((s, l) => s + l.devedor, 0);
  const totalC = linhas.reduce((s, l) => s + l.credor, 0);
  return { linhas, totalD, totalC, fechado: totalD === totalC };
}

export function dre(lancamentos) {
  const r = razao(lancamentos);
  const pega = (g) => PLANO.filter((c) => c.grupo === g && r[c.codigo]).map((c) => ({ ...c, valor: r[c.codigo].saldo }));
  const receitas = pega('receita');
  const despesas = pega('despesa');
  const tr = receitas.reduce((s, x) => s + x.valor, 0);
  const td = despesas.reduce((s, x) => s + x.valor, 0);
  return { receitas, despesas, totalReceitas: tr, totalDespesas: td, resultado: tr - td };
}

// Balanço antes do encerramento: o resultado do período aparece somado ao PL.
export function balanco(lancamentos) {
  const r = razao(lancamentos);
  const pega = (g) => PLANO.filter((c) => c.grupo === g && r[c.codigo] && r[c.codigo].saldo !== 0).map((c) => ({ ...c, valor: r[c.codigo].saldo }));
  const ativo = pega('ativo');
  const passivo = pega('passivo');
  const pl = pega('pl');
  const resultado = dre(lancamentos).resultado;
  const tA = ativo.reduce((s, x) => s + x.valor, 0);
  const tP = passivo.reduce((s, x) => s + x.valor, 0);
  const tPL = pl.reduce((s, x) => s + x.valor, 0) + resultado;
  return { ativo, passivo, pl, resultado, totalAtivo: tA, totalPassivo: tP, totalPL: tPL, fechado: tA === tP + tPL };
}

// Cenário guiado: cada operação tem o saldo acumulado esperado após ela.
export const OPERACOES = [
  { id: 'op1', texto: 'Constituição da empresa: sócios integralizam R$ 50.000,00 de capital em dinheiro.', saldos: { '1.1.1': 5000000, '2.3.1': 5000000 }, dica: 'Entra dinheiro (Caixa ↑ = débito) e nasce a obrigação com os sócios (Capital Social ↑ = crédito).' },
  { id: 'op2', texto: 'Depósito de R$ 30.000,00 do caixa na conta bancária.', saldos: { '1.1.1': 2000000, '1.1.2': 3000000 }, dica: 'Permuta entre ativos: debita Bancos, credita Caixa.' },
  { id: 'op3', texto: 'Compra de mercadorias a prazo por R$ 12.000,00.', saldos: { '1.1.4': 1200000, '2.1.1': 1200000 }, dica: 'Estoque ↑ (débito) e dívida com Fornecedores ↑ (crédito).' },
  { id: 'op4', texto: 'Compra de móveis por R$ 5.000,00, pagos por transferência bancária.', saldos: { '1.2.1': 500000, '1.1.2': 2500000 }, dica: 'Móveis ↑ (débito), Bancos ↓ (crédito).' },
  { id: 'op5', texto: 'Venda à vista de mercadorias por R$ 9.000,00; o custo dessas mercadorias era R$ 6.000,00.', saldos: { '1.1.1': 2900000, '3.1.1': 900000, '4.1.1': 600000, '1.1.4': 600000 }, dica: 'Dois lançamentos: (1) D Caixa / C Receita de Vendas 9.000; (2) D CMV / C Estoque 6.000.' },
  { id: 'op6', texto: 'Pagamento do aluguel do mês, R$ 1.500,00, em dinheiro.', saldos: { '4.2.2': 150000, '1.1.1': 2750000 }, dica: 'Despesa ↑ (débito), Caixa ↓ (crédito). Regime de competência: a despesa é do mês.' },
  { id: 'op7', texto: 'Pagamento parcial de R$ 4.000,00 aos fornecedores, por transferência.', saldos: { '2.1.1': 800000, '1.1.2': 2100000 }, dica: 'Passivo ↓ (débito em Fornecedores), Bancos ↓ (crédito).' },
];

// Situação final esperada após todas as operações — usada na missão de fechamento.
export const SALDOS_FINAIS = { '1.1.1': 2750000, '1.1.2': 2100000, '1.1.4': 600000, '1.2.1': 500000, '2.1.1': 800000, '2.3.1': 5000000, '3.1.1': 900000, '4.1.1': 600000, '4.2.2': 150000 };

export function fechamentoCorreto(lancamentos) {
  const r = razao(lancamentos);
  const contas = Object.keys(r).filter((c) => r[c].saldo !== 0);
  return balancete(lancamentos).fechado && balanco(lancamentos).fechado &&
    contas.length === Object.keys(SALDOS_FINAIS).length && contas.every((c) => r[c].saldo === SALDOS_FINAIS[c]);
}

export function operacaoConcluida(lancamentos, op) {
  const r = razao(lancamentos);
  return Object.entries(op.saldos).every(([cod, v]) => (r[cod]?.saldo ?? 0) === v);
}

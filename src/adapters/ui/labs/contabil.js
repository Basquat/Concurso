import { PLANO, OPERACOES, centavos, reais, validarLancamento, razao, balancete, dre, balanco, operacaoConcluida, fechamentoCorreto } from '../../../domain/accounting/ledger.js';
import { analisarCustos } from '../../../domain/accounting/costs.js';
import { ESTAGIOS_DESPESA, ESTAGIOS_RECEITA, estagioDespesaValido, estagioReceitaValido, classificarRestosPagar, classificarCreditoAdicional } from '../../../domain/accounting/public.js';
import { dfcSimplificada, mutacoesPL, indicadoresContabeis } from '../../../domain/accounting/statements.js';
import { calcularMaterialidade, classificarOpiniao } from '../../../domain/accounting/audit.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const MISSOES = [
  ...OPERACOES.map((op, i) => ({ id: op.id, titulo: `Fato ${i + 1}`, descricao: op.texto, dica: op.dica, xp: 20, check: (estado) => operacaoConcluida(estado.lancs, op) })),
  { id: 'fechamento', titulo: 'Fechamento', xp: 50, descricao: 'Com todos os fatos registrados, o balancete deve fechar (débitos = créditos) e o balanço deve fechar (Ativo = Passivo + PL), sem lançamentos indevidos.', check: (estado) => fechamentoCorreto(estado.lancs) },
  { id: 'custos-equilibrio', titulo: 'Análise de custos', xp: 30, descricao: 'Calcule margem de contribuição positiva e ponto de equilíbrio para os dados informados.', dica: 'Margem unitária = preço − gastos variáveis; unidades de equilíbrio = gastos fixos ÷ margem.', check: (estado) => estado.contexto.analiseCustos?.viavel && estado.contexto.analiseCustos.unidadesEquilibrio > 0 },
  { id: 'despesa-publica', titulo: 'Execução da despesa', xp: 30, descricao: 'Registre empenho, liquidação e pagamento na ordem correta.', dica: 'A sequência é empenho → liquidação → pagamento.', check: (estado) => estagioDespesaValido(estado.contexto.estagiosDespesa) && estado.contexto.estagiosDespesa.length === ESTAGIOS_DESPESA.length },
  { id: 'receita-publica', titulo: 'Execução da receita', xp: 30, descricao: 'Percorra previsão, lançamento, arrecadação e recolhimento, observando que nem toda receita exige lançamento.', dica: 'A sequência didática usual é previsão → lançamento (quando aplicável) → arrecadação → recolhimento.', check: (estado) => estagioReceitaValido(estado.contexto.estagiosReceita) && estado.contexto.estagiosReceita.length === ESTAGIOS_RECEITA.length },
  { id: 'credito-adicional', titulo: 'Créditos adicionais', xp: 20, descricao: 'Classifique corretamente crédito suplementar, especial e extraordinário.', check: (estado) => estado.contexto.creditosAdicionais?.suplementar && estado.contexto.creditosAdicionais?.especial && estado.contexto.creditosAdicionais?.extraordinario },
  { id: 'auditoria-materialidade', titulo: 'Planejamento de auditoria', xp: 30, descricao: 'Calcule materialidade e materialidade para execução com base nos dados informados.', check: (estado) => Number.isSafeInteger(estado.contexto.materialidade?.materialidadeExecucao) && estado.contexto.materialidade.materialidadeExecucao > 0 },
  { id: 'restos-pagar', titulo: 'Restos a pagar', xp: 20, descricao: 'Classifique uma despesa liquidada e ainda não paga como restos a pagar processados.', check: (estado) => estado.contexto.restos?.empenhada && estado.contexto.restos.liquidada && !estado.contexto.restos.paga && classificarRestosPagar(estado.contexto.restos) === 'processado' },
];
const nomeConta = (c) => PLANO.find((p) => p.codigo === c)?.nome ?? c;

export default async function contabil(el, { servico, labs }) {
  let lancs = labs.carregar('contabil') ?? [];
  let contexto = { estagiosDespesa: [], estagiosReceita: [], creditosAdicionais: {}, restos: { empenhada: false, liquidada: false, paga: false }, ...(labs.carregar('contabil:contexto') ?? {}) };
  contexto.restos = { empenhada: false, liquidada: false, paga: false, ...contexto.restos };
  if (!estagioDespesaValido(contexto.estagiosDespesa)) contexto.estagiosDespesa = [];
  if (!estagioReceitaValido(contexto.estagiosReceita)) contexto.estagiosReceita = [];
  contexto.creditosAdicionais ??= {};
  let partidas = [{ tipo: 'D', conta: '', valor: '' }, { tipo: 'C', conta: '', valor: '' }];
  let aba = 'diario';

  el.innerHTML = cabecalhoLab('contabil') + `<div class="split"><div class="pilha">
      <form class="card pilha" id="form">
        <div class="linha entre"><strong>Novo lançamento</strong><span class="pequeno muted">Comercial Exemplo Ltda (fictícia)</span></div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"><label class="campo">Data do fato<input name="data" type="date" value="${new Date().toISOString().slice(0, 10)}" required></label>
        <label class="campo">Histórico<input name="hist" placeholder="Ex.: Integralização do capital em dinheiro" required></label></div>
        <p class="mini sutil">Analise o documento de suporte, escolha contas compatíveis com o fato e confira igualdade das partidas antes de lançar.</p>
        <div id="partidas" class="pilha"></div>
        <div class="linha entre"><button type="button" class="btn peq" id="mais">+ partida</button><span id="totais" class="pequeno"></span></div>
        <div id="erros"></div>
        <div><button class="btn primario">Lançar no diário</button></div>
      </form>
      <div class="abas">${[['diario', 'Livro Diário'], ['razao', 'Razão'], ['balancete', 'Balancete'], ['dre', 'DRE'], ['balanco', 'Balanço Patrimonial'], ['dfc', 'DFC'], ['analise', 'Análise'], ['custos', 'Custos e equilíbrio'], ['publico', 'Setor público'], ['auditoria', 'Auditoria']].map(([k, n]) => `<button data-aba="${k}" class="${k === aba ? 'ativa' : ''}">${n}</button>`).join('')}</div>
      <div class="card" id="rel" style="border-top-left-radius:0"></div>
    </div><aside class="card" id="missoes"></aside></div>`;

  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'contabil', missoes: MISSOES, servico });
  const form = el.querySelector('#form');

  const opcoesConta = (sel) => `<option value="">Conta…</option>${['ativo', 'passivo', 'pl', 'receita', 'despesa'].map((g) => `<optgroup label="${{ ativo: 'Ativo', passivo: 'Passivo', pl: 'Patrimônio Líquido', receita: 'Receitas', despesa: 'Despesas' }[g]}">${PLANO.filter((c) => c.grupo === g).map((c) => `<option value="${c.codigo}" ${c.codigo === sel ? 'selected' : ''}>${c.codigo} ${esc(c.nome)}</option>`).join('')}</optgroup>`).join('')}`;

  function desenharPartidas() {
    el.querySelector('#partidas').innerHTML = partidas.map((p, i) => `<div class="linha" data-i="${i}">
      <select data-k="tipo" aria-label="Débito ou crédito"><option value="D" ${p.tipo === 'D' ? 'selected' : ''}>Débito</option><option value="C" ${p.tipo === 'C' ? 'selected' : ''}>Crédito</option></select>
      <select data-k="conta" aria-label="Conta" style="flex:1;min-width:180px">${opcoesConta(p.conta)}</select>
      <input data-k="valor" aria-label="Valor" placeholder="0,00" value="${esc(p.valor)}" style="width:120px" inputmode="decimal">
      ${partidas.length > 2 ? `<button type="button" class="btn peq perigo" data-rm="${i}" aria-label="Remover partida">✕</button>` : ''}</div>`).join('');
    totais();
  }
  function totais() {
    const soma = (t) => partidas.filter((p) => p.tipo === t).reduce((s, p) => s + (centavos(p.valor) || 0), 0);
    const d = soma('D');
    const c = soma('C');
    el.querySelector('#totais').innerHTML = `Débitos ${reais(d)} · Créditos ${reais(c)} ${d === c && d > 0 ? '<span class="ok">✔ fechado</span>' : '<span class="erro">≠</span>'}`;
  }
  el.querySelector('#partidas').addEventListener('input', (e) => {
    const i = Number(e.target.closest('[data-i]')?.dataset.i);
    if (Number.isNaN(i)) return;
    partidas[i][e.target.dataset.k] = e.target.value;
    totais();
  });
  el.querySelector('#partidas').addEventListener('click', (e) => { const rm = e.target.dataset.rm; if (rm !== undefined) { partidas.splice(Number(rm), 1); desenharPartidas(); } });
  el.querySelector('#mais').onclick = () => { partidas.push({ tipo: 'D', conta: '', valor: '' }); desenharPartidas(); };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const l = { data: form.data.value, historico: form.hist.value, partidas: partidas.map((p) => ({ tipo: p.tipo, conta: p.conta, valor: centavos(p.valor) })) };
    const erros = validarLancamento(l);
    el.querySelector('#erros').innerHTML = erros.length ? `<div class="callout err"><strong>Lançamento recusado:</strong><ul style="margin:6px 0 0">${erros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    if (erros.length) return;
    lancs = [...lancs, l];
    form.hist.value = '';
    partidas = [{ tipo: 'D', conta: '', valor: '' }, { tipo: 'C', conta: '', valor: '' }];
    desenharPartidas();
    mudou();
  });

  function estornar(i) {
    const o = lancs[i];
    lancs = [...lancs, { data: new Date().toISOString().slice(0, 10), historico: `Estorno do lançamento nº ${i + 1}`, partidas: o.partidas.map((p) => ({ ...p, tipo: p.tipo === 'D' ? 'C' : 'D' })) }];
    mudou();
  }

  function relatorio() {
    const rel = el.querySelector('#rel');
    const linhaValor = (nome, v, forte) => `<tr><td>${forte ? `<strong>${esc(nome)}</strong>` : esc(nome)}</td><td class="num">${forte ? `<strong>${reais(v)}</strong>` : reais(v)}</td></tr>`;
    if (!lancs.length && !['diario', 'custos', 'publico', 'auditoria'].includes(aba)) { rel.innerHTML = '<p class="muted">Sem lançamentos ainda. A DRE, DFC e os índices precisam de fatos contabilizados. Registre lançamentos no Diário para ver relatórios.</p>'; return; }
    if (aba === 'diario') {
      rel.innerHTML = lancs.length ? `<table class="tabela"><thead><tr><th>Nº</th><th>Histórico / partidas</th><th class="num">Débito</th><th class="num">Crédito</th><th></th></tr></thead><tbody>${lancs.map((l, i) => `
        <tr><td>${i + 1}</td><td colspan="3"><strong>${esc(l.historico)}</strong><div class="mini sutil">${esc(l.data || 'Sem data')}</div></td><td><button class="btn peq" data-est="${i}" title="Lança o inverso, como na prática contábil">Estornar</button></td></tr>
        ${l.partidas.map((p) => `<tr><td></td><td style="padding-left:${p.tipo === 'C' ? 28 : 10}px">${p.tipo === 'C' ? 'a ' : ''}${esc(nomeConta(p.conta))}</td><td class="num">${p.tipo === 'D' ? reais(p.valor) : ''}</td><td class="num">${p.tipo === 'C' ? reais(p.valor) : ''}</td><td></td></tr>`).join('')}</tbody></table><p class="mini sutil">${lancs.length} lançamento(s) · partidas dobradas em valores inteiros de centavos.</p>`
        : '<p class="muted">O Livro Diário registra os fatos em ordem cronológica. Faça o primeiro lançamento acima.</p>';
      rel.querySelectorAll('[data-est]').forEach((b) => b.addEventListener('click', () => estornar(Number(b.dataset.est))));
    } else if (aba === 'razao') {
      const r = razao(lancs);
      rel.innerHTML = `<p class="pequeno muted">O Razão evidencia o histórico cronológico por conta, os movimentos de cada lado e o saldo progressivo. O saldo invertido pode indicar natureza atípica ou erro a investigar.</p><div class="grid">${Object.entries(r).map(([c, x]) => `<div class="card" style="padding:10px"><div style="text-align:center;font-weight:600;border-bottom:2px solid var(--text);padding-bottom:4px">${esc(c)} · ${esc(nomeConta(c))}</div>
        <div class="pequeno mono" style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><div><strong>Movimento</strong></div><div><strong>Saldo corrido</strong></div>${x.movimentos.map((m) => `<div style="border-top:1px solid var(--border);padding-top:4px"><span>${m.tipo === 'D' ? 'Débito' : 'Crédito'} ${reais(m.valor)}</span><div class="mini sutil">#${m.n}${m.data ? ` · ${esc(m.data)}` : ''} · ${esc(m.historico)}</div></div><div style="border-top:1px solid var(--border);padding-top:4px">${reais(Math.abs(m.saldoAcumulado))} ${m.saldoAcumulado === 0 ? 'zerado' : ((m.saldoAcumulado > 0) === (PLANO.find((p) => p.codigo === c).natureza === 'D') ? 'devedor' : 'credor')}</div>`).join('')}</div>
        <div class="pequeno" style="border-top:1px solid var(--border);margin-top:8px;padding-top:6px">Débitos ${reais(x.totalD)} · Créditos ${reais(x.totalC)} · Saldo final <strong>${reais(Math.abs(x.saldo))} ${x.saldo >= 0 ? (PLANO.find((p) => p.codigo === c).natureza === 'D' ? 'devedor' : 'credor') : 'invertido'}</strong></div></div>`).join('')}</div>`;
    } else if (aba === 'balancete') {
      const b = balancete(lancs);
      rel.innerHTML = `<p class="pequeno muted">O balancete combina movimento do período e saldo final de cada conta. A igualdade aritmética é necessária, mas não prova classificação, ocorrência ou completude dos fatos.</p><table class="tabela"><thead><tr><th rowspan="2">Conta</th><th colspan="2" class="num">Movimentos</th><th colspan="2" class="num">Saldos finais</th></tr><tr><th class="num">Débito</th><th class="num">Crédito</th><th class="num">Devedor</th><th class="num">Credor</th></tr></thead><tbody>${b.linhas.map((l) => `<tr><td>${l.codigo} ${esc(l.nome)}</td><td class="num">${l.movimentoD ? reais(l.movimentoD) : ''}</td><td class="num">${l.movimentoC ? reais(l.movimentoC) : ''}</td><td class="num">${l.devedor ? reais(l.devedor) : ''}</td><td class="num">${l.credor ? reais(l.credor) : ''}</td></tr>`).join('')}
        <tr><td><strong>Totais do período</strong></td><td class="num"><strong>${reais(b.movimentoD)}</strong></td><td class="num"><strong>${reais(b.movimentoC)}</strong></td><td class="num"><strong>${reais(b.totalD)}</strong></td><td class="num"><strong>${reais(b.totalC)}</strong></td></tr></tbody></table>
        <p class="${b.fechado ? 'ok' : 'erro'}" style="margin-top:8px">${b.fechado ? '✔ Débitos e créditos conferem nos movimentos e nos saldos finais.' : '✖ Diferença encontrada: revise os movimentos e a natureza dos saldos.'}</p><p class="mini sutil">As quatro colunas fecham de forma independente; omissões e erros compensatórios ainda podem passar despercebidos.</p>`;
    } else if (aba === 'dre') {
      const d = dre(lancs);
      rel.innerHTML = `<h3 style="margin-top:0">Demonstração do Resultado — visão gerencial simplificada</h3><table class="tabela"><tbody>${d.receitas.map((x) => linhaValor(x.nome, x.valor)).join('')}${linhaValor('(=) Receita do modelo', d.totalReceitas, true)}
        ${d.custos.map((x) => linhaValor(`(−) ${x.nome}`, x.valor)).join('')}${linhaValor('(=) Resultado bruto simplificado', d.lucroBruto, true)}
        ${d.despesasOperacionais.map((x) => linhaValor(`(−) ${x.nome}`, x.valor)).join('')}${linhaValor('(−) Despesas operacionais modeladas', d.totalDespesasOperacionais)}
        ${linhaValor(d.resultado >= 0 ? '(=) Lucro do período' : '(=) Prejuízo do período', Math.abs(d.resultado), true)}</tbody></table>
        <p class="pequeno muted">Modelo didático: classifica contas 4.1.* como custos e as demais despesas como operacionais. Não contempla deduções, tributos sobre vendas, IR/CSLL, outras receitas/despesas nem notas exigidas numa DRE normativa.</p>`;
    } else if (aba === 'dfc') {
      const d = dfcSimplificada(lancs);
      rel.innerHTML = `<h3 style="margin-top:0">DFC — fluxos estimados do período</h3><p class="pequeno muted">A classificação abaixo é uma heurística por contrapartida contábil para fins de estudo, não uma DFC normativa. Cada operação deve ser avaliada por sua natureza e pelas regras aplicáveis.</p><table class="tabela"><thead><tr><th>Atividade</th><th class="num">Entradas</th><th class="num">Saídas</th><th class="num">Fluxo líquido</th></tr></thead><tbody>${[['operacional', 'Operacional'], ['investimento', 'Investimento'], ['financiamento', 'Financiamento']].map(([k, nome]) => `<tr><td>${nome}</td><td class="num">${reais(d.fluxos[k].entradas)}</td><td class="num">${reais(d.fluxos[k].saidas)}</td><td class="num">${reais(d.atividades[k])}</td></tr>`).join('')}${linhaValor('Variação líquida estimada de caixa', d.variacaoLiquida, true)}</tbody></table><p class="mini sutil">${esc(d.observacao)} Caixa e bancos considerados: ${esc(nomeConta('1.1.1'))} e ${esc(nomeConta('1.1.2'))}. Fluxos sem caixa ficam fora desta estimativa.</p>`;
    } else if (aba === 'analise') {
      const i = indicadoresContabeis(lancs);
      const pl = mutacoesPL(lancs);
      const percentual = (v) => v == null ? '— (denominador zero)' : `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
      const indice = (v) => v == null ? '— (denominador zero)' : v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      rel.innerHTML = `<h3 style="margin-top:0">Análise dos saldos</h3><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        ${[['Liquidez corrente', indice(i.liquidezCorrente), 'Ativo circulante ÷ passivo circulante'], ['Liquidez seca', indice(i.liquidezSeca), '(Ativo circulante − estoque) ÷ passivo circulante'], ['Liquidez imediata', indice(i.liquidezImediata), 'Disponibilidades ÷ passivo circulante'], ['Capital circulante líquido', reais(i.capitalCirculanteLiquido), 'Ativo circulante − passivo circulante'], ['Endividamento', percentual(i.endividamento), 'Passivo total ÷ ativo total'], ['Margem líquida simplificada', percentual(i.margemLiquida), 'Resultado da DRE ÷ receitas do modelo']].map(([nome, valor, formula]) => `<div class="card"><strong>${esc(nome)}</strong><div class="titulo">${esc(valor)}</div><p class="mini sutil">${esc(formula)}</p></div>`).join('')}</div>
        <h3>Movimentos do patrimônio líquido</h3>${pl.contas.length ? `<table class="tabela"><thead><tr><th>Conta</th><th class="num">Débitos</th><th class="num">Créditos</th><th class="num">Saldo credor</th></tr></thead><tbody>${pl.contas.map((c) => `<tr><td>${c.codigo} ${esc(c.nome)}</td><td class="num">${reais(c.debitos)}</td><td class="num">${reais(c.creditos)}</td><td class="num">${reais(c.saldo)}</td></tr>`).join('')}<tr><td><strong>Resultado do período (não encerrado)</strong></td><td></td><td></td><td class="num"><strong>${reais(pl.resultado)}</strong></td></tr><tr><td><strong>PL total estimado</strong></td><td></td><td></td><td class="num"><strong>${reais(pl.totalPL)}</strong></td></tr></tbody></table>` : '<p class="muted">Sem movimentações de patrimônio líquido ainda.</p>'}
        <p class="mini sutil">${esc(i.observacao)}</p>`;
    } else if (aba === 'custos') {
      const atual = contexto.analiseCustos ? { ...contexto.analiseCustos, ...analisarCustos(contexto.analiseCustos) } : null;
      rel.innerHTML = `<form class="pilha" id="formCustos"><h3 style="margin:0">Análise custo-volume-lucro</h3><p class="pequeno muted">Informe valores unitários e gastos fixos do período em reais.</p>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
          ${[['preco', 'Preço de venda unitário'], ['custosVariaveis', 'Custo variável unitário'], ['despesasVariaveis', 'Despesa variável unitária'], ['custosFixos', 'Custos fixos do período'], ['despesasFixas', 'Despesas fixas do período']].map(([id, label]) => `<label class="campo">${label}<input name="${id}" inputmode="decimal" placeholder="0,00" value="${atual ? esc((atual[id] / 100).toFixed(2).replace('.', ',')) : ''}" required></label>`).join('')}
        </div><button class="btn primario">Calcular margem e equilíbrio</button><div id="resultadoCustos" aria-live="polite">${atual ? resultadoCustos(atual) : '<p class="muted">Preencha os valores para ver o resultado.</p>'}</div></form>`;
      const ligarVolume = () => rel.querySelector('[data-unidades]')?.addEventListener('input', (e) => {
        const n = Number(e.target.value);
        contexto.analiseCustos.unidadesAnalise = e.target.value !== '' && Number.isSafeInteger(n) && n >= 0 ? n : null;
        salvarContexto();
        rel.querySelector('#cenarioCustos').innerHTML = resultadoCenario(contexto.analiseCustos);
        rel.querySelector('#metaCustos').innerHTML = resultadoMeta(contexto.analiseCustos);
      });
      const ligarMeta = () => rel.querySelector('[data-lucro-alvo]')?.addEventListener('input', (e) => {
        const valor = e.target.value === '' ? 0 : centavos(e.target.value);
        contexto.analiseCustos.lucroAlvo = Number.isSafeInteger(valor) && valor >= 0 ? valor : null;
        salvarContexto();
        rel.querySelector('#metaCustos').innerHTML = resultadoMeta(contexto.analiseCustos);
      });
      ligarVolume(); ligarMeta();
      el.querySelector('#formCustos').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const dados = Object.fromEntries(['preco', 'custosVariaveis', 'despesasVariaveis', 'custosFixos', 'despesasFixas'].map((k) => [k, centavos(f.get(k))]));
        if (Object.values(dados).some((v) => !Number.isSafeInteger(v) || v < 0) || dados.preco <= 0) {
          el.querySelector('#resultadoCustos').innerHTML = '<p class="erro">Use valores em reais válidos, com preço unitário maior que zero.</p>';
          return;
        }
        try {
          const resultado = analisarCustos(dados);
          contexto.analiseCustos = { ...dados, ...resultado, unidadesAnalise: contexto.analiseCustos?.unidadesAnalise ?? null, lucroAlvo: contexto.analiseCustos?.lucroAlvo ?? null };
          salvarContexto();
          el.querySelector('#resultadoCustos').innerHTML = resultadoCustos(contexto.analiseCustos);
          ligarVolume(); ligarMeta();
          verificarMissoes();
        } catch {
          el.querySelector('#resultadoCustos').innerHTML = '<p class="erro">Não foi possível calcular com esses valores. Confira se os valores são válidos.</p>';
        }
      });
    } else if (aba === 'auditoria') {
      const atual = contexto.materialidade;
      rel.innerHTML = `<h3 style="margin-top:0">Materialidade no planejamento</h3><p class="pequeno muted">Exercício ilustrativo. A escolha da base e dos percentuais depende de julgamento profissional, usuários e circunstâncias; não há percentual universal.</p><form class="pilha" id="formAuditoria"><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><label class="campo">Base de referência (R$)<input name="base" inputmode="decimal" value="${atual ? esc((atual.valorReferencia / 100).toFixed(2).replace('.', ',')) : ''}" placeholder="ex.: 1.000.000,00" required></label><label class="campo">Percentual de materialidade<input name="percentual" type="number" min="0.01" max="100" step="0.01" value="${atual?.percentual ?? ''}" placeholder="ex.: 5" required></label><label class="campo">Materialidade para execução (% da materialidade)<input name="execucao" type="number" min="0.01" max="100" step="0.01" value="${atual?.percentualExecucao ?? '75'}" required></label></div><button class="btn primario">Calcular limites ilustrativos</button><div id="resultadoMaterialidade" aria-live="polite">${atual ? `<p>Materialidade: <strong>${reais(atual.materialidade)}</strong> · para execução: <strong>${reais(atual.materialidadeExecucao)}</strong></p>` : '<p class="muted">Informe uma referência e percentuais para obter valores didáticos.</p>'}</div></form><hr><h3>Opinião de auditoria — árvore de decisão</h3><p class="pequeno muted">Diferencie distorção conhecida de impossibilidade de obter evidência, e avalie relevância e generalização.</p><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><label class="campo">Situação<select data-opiniao-causa><option value="nenhuma">Sem distorção relevante/limitação relevante</option><option value="distorcao">Distorção identificada</option><option value="limitacao">Limitação de evidência</option></select></label><label class="campo">É relevante?<select data-opiniao-material><option value="nao">Não</option><option value="sim">Sim</option></select></label><label class="campo">É generalizada?<select data-opiniao-generalizada><option value="nao">Não</option><option value="sim">Sim</option></select></label></div><p id="resultadoOpiniao" class="callout" aria-live="polite"></p><p class="mini sutil">Não modificada não elimina parágrafo de ênfase ou outras seções exigidas. A conclusão real exige julgamento e aplicação das normas de auditoria vigentes.</p>`;
      const atualizarOpiniao = () => {
        const causa = rel.querySelector('[data-opiniao-causa]').value;
        const material = rel.querySelector('[data-opiniao-material]').value === 'sim';
        const generalizada = rel.querySelector('[data-opiniao-generalizada]').value === 'sim';
        const codigo = classificarOpiniao({ causa, material, generalizada });
        const rotulos = { 'nao-modificada': 'Opinião não modificada', 'com-ressalva': 'Opinião com ressalva', adversa: 'Opinião adversa', abstencao: 'Abstenção de opinião' };
        const explicacoes = { 'nao-modificada': 'Sem distorção relevante identificada ou limitação relevante de evidência.', 'com-ressalva': causa === 'distorcao' ? 'Distorção relevante, mas não generalizada.' : 'Possíveis efeitos da limitação são relevantes, mas não generalizados.', adversa: 'Distorção identificada relevante e generalizada.', abstencao: 'Não foi possível obter evidência; possíveis efeitos relevantes e generalizados.' };
        rel.querySelector('#resultadoOpiniao').innerHTML = `<strong>${rotulos[codigo]}</strong><br>${explicacoes[codigo]}`;
      };
      rel.querySelectorAll('[data-opiniao-causa], [data-opiniao-material], [data-opiniao-generalizada]').forEach((s) => s.addEventListener('change', atualizarOpiniao));
      atualizarOpiniao();
      el.querySelector('#formAuditoria').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const valorReferencia = centavos(f.get('base'));
        const percentual = Number(f.get('percentual'));
        const percentualExecucao = Number(f.get('execucao'));
        try {
          const r = calcularMaterialidade({ valorReferencia, percentual, percentualExecucao });
          contexto.materialidade = r;
          salvarContexto();
          rel.querySelector('#resultadoMaterialidade').innerHTML = `<p>Materialidade: <strong>${reais(r.materialidade)}</strong> · Materialidade para execução: <strong>${reais(r.materialidadeExecucao)}</strong></p><p class="mini sutil">Valor de referência ${reais(r.valorReferencia)} × ${r.percentual}% = materialidade; ${r.percentualExecucao}% desse limite = materialidade para execução.</p>`;
          verificarMissoes();
        } catch (erro) {
          rel.querySelector('#resultadoMaterialidade').innerHTML = `<p class="erro">${esc(erro.message)}</p>`;
        }
      });
    } else if (aba === 'publico') {
      const estados = contexto.restos ??= { empenhada: false, liquidada: false, paga: false };
      const restos = classificarRestosPagar(estados);
      rel.innerHTML = `<h3 style="margin-top:0">Execução da despesa orçamentária</h3><p class="pequeno muted">Avance pelos estágios na ordem prevista; o estado fica salvo neste navegador.</p>
        <ol>${ESTAGIOS_DESPESA.map((item, i) => `<li class="mb1">${esc(item.nome)} — ${esc(item.detalhe)} ${contexto.estagiosDespesa.includes(item.id) ? '<span class="ok">✔ concluído</span>' : ''} ${!contexto.estagiosDespesa.includes(item.id) && contexto.estagiosDespesa.length === i ? `<button type="button" class="btn peq" data-estagio="${esc(item.id)}">Registrar ${esc(item.nome.toLowerCase())}</button>` : ''}</li>`).join('')}</ol>
        <button type="button" class="btn peq" data-limpar-publico>Reiniciar exercício público</button><hr>
        <h3>Execução da receita orçamentária</h3><p class="pequeno muted">Sequência didática usual; o estágio de lançamento depende da natureza da receita.</p><ol>${ESTAGIOS_RECEITA.map((item, i) => `<li class="mb1">${esc(item.nome)} — ${esc(item.detalhe)} ${contexto.estagiosReceita.includes(item.id) ? '<span class="ok">✔ concluído</span>' : ''} ${!contexto.estagiosReceita.includes(item.id) && contexto.estagiosReceita.length === i ? `<button type="button" class="btn peq" data-estagio-receita="${esc(item.id)}">Registrar ${esc(item.nome.toLowerCase())}</button>` : ''}</li>`).join('')}</ol><hr>
        <h3>Créditos adicionais</h3><p class="pequeno muted">Associe cada caso à classificação e confira a justificativa.</p><div class="pilha">${[['suplementar', 'Reforçar dotação existente'], ['especial', 'Criar dotação para despesa sem previsão específica'], ['extraordinario', 'Atender despesa urgente e imprevisível']].map(([tipo, descricao]) => `<label class="campo">${descricao}<select data-credito="${tipo}"><option value="">Selecione…</option>${[['suplementar', 'Suplementar'], ['especial', 'Especial'], ['extraordinario', 'Extraordinário']].map(([v, n]) => `<option value="${v}" ${contexto.creditosAdicionais[tipo] === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label><p class="mini sutil">${contexto.creditosAdicionais[tipo] ? esc(classificarCreditoAdicional(contexto.creditosAdicionais[tipo])) : ''}</p>`).join('')}</div><hr>
        <h3>Classificação de restos a pagar</h3><div class="pilha">${[['empenhada', 'Despesa empenhada'], ['liquidada', 'Despesa liquidada'], ['paga', 'Despesa paga']].map(([k, label]) => `<label><input type="checkbox" data-resto="${k}" ${estados[k] ? 'checked' : ''}> ${label}</label>`).join('')}</div>
        <p id="resultadoRestos" aria-live="polite">${restos ? `<strong>${restos === 'processado' ? 'Restos a pagar processados' : 'Restos a pagar não processados'}</strong><p class="mini sutil">${restos === 'processado' ? 'O credor já cumpriu a obrigação e a despesa foi liquidada; falta pagar.' : 'A despesa foi empenhada, mas ainda não liquidada até o encerramento.'}</p>` : 'Situação sem restos a pagar (não empenhada ou já paga).'}</p>
        <p class="mini sutil">Empenho, liquidação e pagamento pertencem à execução orçamentária; acompanhe em trilha própria, sem confundir com a variação patrimonial.</p>`;
      rel.querySelectorAll('[data-estagio]').forEach((b) => b.addEventListener('click', () => {
        const proximo = ESTAGIOS_DESPESA[contexto.estagiosDespesa.length]?.id;
        if (b.dataset.estagio !== proximo || !estagioDespesaValido([...contexto.estagiosDespesa, proximo])) return;
        contexto.estagiosDespesa.push(proximo);
        salvarContexto(); relatorio(); verificarMissoes();
      }));
      rel.querySelectorAll('[data-estagio-receita]').forEach((b) => b.addEventListener('click', () => {
        const proximo = ESTAGIOS_RECEITA[contexto.estagiosReceita.length]?.id;
        if (b.dataset.estagioReceita !== proximo || !estagioReceitaValido([...contexto.estagiosReceita, proximo])) return;
        contexto.estagiosReceita.push(proximo);
        salvarContexto(); relatorio(); verificarMissoes();
      }));
      rel.querySelectorAll('[data-credito]').forEach((s) => s.addEventListener('change', () => {
        contexto.creditosAdicionais[s.dataset.credito] = s.value;
        salvarContexto(); relatorio(); verificarMissoes();
      }));
      rel.querySelectorAll('[data-resto]').forEach((c) => c.addEventListener('change', () => {
        contexto.restos[c.dataset.resto] = c.checked;
        salvarContexto();
        const classe = classificarRestosPagar(contexto.restos);
        rel.querySelector('#resultadoRestos').innerHTML = classe ? `<strong>${classe === 'processado' ? 'Restos a pagar processados' : 'Restos a pagar não processados'}</strong><p class="mini sutil">${classe === 'processado' ? 'O credor já cumpriu a obrigação e a despesa foi liquidada; falta pagar.' : 'A despesa foi empenhada, mas ainda não liquidada até o encerramento.'}</p>` : 'Situação sem restos a pagar (não empenhada ou já paga).';
        verificarMissoes();
      }));
      rel.querySelector('[data-limpar-publico]').onclick = () => { contexto.estagiosDespesa = []; contexto.estagiosReceita = []; contexto.creditosAdicionais = {}; contexto.restos = { empenhada: false, liquidada: false, paga: false }; salvarContexto(); relatorio(); verificarMissoes(); };
    } else {
      const b = balanco(lancs);
      const linhaConta = (x) => `<tr><td>${x.codigo} ${esc(x.nome)}</td><td class="num">${reais(x.valor)}</td></tr>`;
      const col = (titulo, itens, extra = '') => `<div><h4>${titulo}</h4><table class="tabela"><tbody>${itens.map(linhaConta).join('')}${extra}</tbody></table></div>`;
      const subtotal = (nome, valor) => `<tr><td><strong>${nome}</strong></td><td class="num"><strong>${reais(valor)}</strong></td></tr>`;
      rel.innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        <div>${col('Ativo circulante', b.ativoCirculante, subtotal('Subtotal do circulante', b.totalAtivoCirculante))}${col('Ativo não circulante (simplificado)', b.ativoNaoCirculante, subtotal('Subtotal do não circulante', b.totalAtivoNaoCirculante))}${col('Ativo', [], subtotal('Total do Ativo', b.totalAtivo))}</div>
        <div>${col('Passivo circulante', b.passivoCirculante, subtotal('Subtotal do circulante', b.totalPassivoCirculante))}${col('Passivo não circulante (simplificado)', b.passivoNaoCirculante, subtotal('Subtotal do não circulante', b.totalPassivoNaoCirculante))}${col('Passivo', [], subtotal('Total do Passivo', b.totalPassivo))}
        ${col('Patrimônio Líquido', b.pl, `<tr><td>Resultado do período</td><td class="num">${reais(b.resultado)}</td></tr>${subtotal('Total do PL estimado', b.totalPL)}`)}</div></div>
        <p class="${b.fechado ? 'ok' : 'erro'}">${b.fechado ? '✔' : '✖'} Ativo ${reais(b.totalAtivo)} ${b.fechado ? '=' : '≠'} Passivo + PL ${reais(b.totalPassivo + b.totalPL)}</p><p class="mini sutil">Balanço simplificado, sem classificação por prazo e sem notas explicativas. O resultado do período não foi encerrado nas contas de PL.</p>`;
    }
  }

  function resultadoCustos(a) {
    if (!a.viavel) return '<p class="erro">A margem de contribuição não é positiva; não há ponto de equilíbrio finito nas premissas informadas.</p>';
    return `<table class="tabela"><tbody><tr><td>Margem de contribuição unitária</td><td class="num"><strong>${reais(a.margemUnit)}</strong></td></tr><tr><td>Índice da margem de contribuição</td><td class="num">${(a.indiceMargem * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</td></tr><tr><td>Ponto de equilíbrio contábil</td><td class="num"><strong>${a.unidadesEquilibrio.toLocaleString('pt-BR')} unidades</strong></td></tr><tr><td>Receita mínima estimada no equilíbrio</td><td class="num">${reais(a.receitaEquilibrio)}</td><td class="mini">Unidades inteiras arredondadas para cima.</td></tr></tbody></table><p class="mini sutil">Hipóteses: preço, gastos variáveis unitários e mix constantes; capacidade e demanda suficientes; valores fixos válidos no intervalo relevante. Resultado gerencial, não substitui custeio de estoques por absorção.</p><h4>Meta de lucro e alavancagem</h4><label class="campo">Lucro operacional-alvo (R$)<input data-lucro-alvo inputmode="decimal" placeholder="0,00" value="${a.lucroAlvo == null ? '' : esc((a.lucroAlvo / 100).toFixed(2).replace('.', ','))}"></label><div id="metaCustos">${resultadoMeta(a)}</div><h4>Cenário de volume</h4><label class="campo">Unidades previstas<input data-unidades type="number" min="0" step="1" value="${a.unidadesAnalise ?? ''}" placeholder="ex.: 4.500"></label><div id="cenarioCustos">${resultadoCenario(a)}</div>`;
  }

  function resultadoMeta(a) {
    a = { ...a, ...analisarCustos(a) };
    if (a.lucroAlvo == null) return '<p class="erro">Informe uma meta válida em reais.</p>';
    if (!a.viavel) return '<p class="muted">Com margem unitária nula ou negativa, a meta não é atingível neste modelo.</p>';
    const unidades = a.unidadesParaLucro(a.lucroAlvo);
    return `<p>Para alcançar lucro operacional de <strong>${reais(a.lucroAlvo)}</strong>, o volume mínimo estimado é <strong>${unidades.toLocaleString('pt-BR')} unidade(s)</strong>.</p>${a.unidadesAnalise != null && a.unidadesAnalise > 0 ? `<p>Grau de alavancagem operacional no cenário informado: <strong>${a.grauAlavancagemOperacional(a.unidadesAnalise)?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) ?? 'não definido (resultado zero ou negativo)'}</strong>.</p>` : ''}`;
  }

  function resultadoCenario(a) {
    if (!Number.isSafeInteger(a.unidadesAnalise) || a.unidadesAnalise < 0) return '<p class="muted">Informe unidades inteiras para estimar lucro operacional e margem de segurança.</p>';
    a = { ...a, ...analisarCustos(a) };
    const lucro = a.lucroEm(a.unidadesAnalise);
    const seguranca = a.margemSeguranca(a.unidadesAnalise);
    return `<p>${lucro >= 0 ? 'Resultado operacional estimado' : 'Prejuízo operacional estimado'}: <strong>${reais(Math.abs(lucro))}</strong></p><p>Margem de segurança: <strong>${seguranca == null ? 'não calculável sem margem positiva' : `${seguranca.toLocaleString('pt-BR')} unidade(s)`}</strong></p><p>Receita de vendas estimada: <strong>${reais(a.unidadesAnalise * a.preco)}</strong> · gastos variáveis estimados: <strong>${reais(a.unidadesAnalise * a.gastosVariaveis)}</strong> · gastos fixos: <strong>${reais(a.gastosFixos)}</strong>.</p>`;
  }

  function salvarContexto() { labs.salvar('contabil:contexto', contexto); }
  function verificarMissoes() { painel.verificar((m) => m.check({ lancs, contexto })); }
  function mudou() {
    labs.salvar('contabil', lancs);
    salvarContexto();
    relatorio();
    verificarMissoes();
  }

  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => {
    aba = b.dataset.aba;
    el.querySelectorAll('[data-aba]').forEach((x) => x.classList.toggle('ativa', x === b));
    relatorio();
  }));
  confirmarReinicio(el, () => { labs.limpar('contabil'); labs.limpar('contabil:contexto'); lancs = []; contexto = { estagiosDespesa: [], estagiosReceita: [], creditosAdicionais: {}, materialidade: null, restos: { empenhada: false, liquidada: false, paga: false } }; mudou(); });

  desenharPartidas();
  mudou();
}

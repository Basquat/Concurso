import { PLANO, OPERACOES, centavos, reais, validarLancamento, razao, balancete, dre, balanco, operacaoConcluida, fechamentoCorreto } from '../../../domain/accounting/ledger.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const MISSOES = [
  ...OPERACOES.map((op, i) => ({ id: op.id, titulo: `Fato ${i + 1}`, descricao: op.texto, dica: op.dica, xp: 20, check: (ls) => operacaoConcluida(ls, op) })),
  { id: 'fechamento', titulo: 'Fechamento', xp: 50, descricao: 'Com todos os fatos registrados, o balancete deve fechar (débitos = créditos) e o balanço deve fechar (Ativo = Passivo + PL), sem lançamentos indevidos.', check: fechamentoCorreto },
];
const nomeConta = (c) => PLANO.find((p) => p.codigo === c)?.nome ?? c;

export default async function contabil(el, { servico, labs }) {
  let lancs = labs.carregar('contabil') ?? [];
  let partidas = [{ tipo: 'D', conta: '', valor: '' }, { tipo: 'C', conta: '', valor: '' }];
  let aba = 'diario';

  el.innerHTML = cabecalhoLab('contabil') + `<div class="split"><div class="pilha">
      <form class="card pilha" id="form">
        <div class="linha entre"><strong>Novo lançamento</strong><span class="pequeno muted">Comercial Exemplo Ltda (fictícia)</span></div>
        <label class="campo">Histórico<input name="hist" placeholder="Ex.: Integralização do capital em dinheiro" required></label>
        <div id="partidas" class="pilha"></div>
        <div class="linha entre"><button type="button" class="btn peq" id="mais">+ partida</button><span id="totais" class="pequeno"></span></div>
        <div id="erros"></div>
        <div><button class="btn primario">Lançar no diário</button></div>
      </form>
      <div class="abas">${[['diario', 'Livro Diário'], ['razao', 'Razão'], ['balancete', 'Balancete'], ['dre', 'DRE'], ['balanco', 'Balanço Patrimonial']].map(([k, n]) => `<button data-aba="${k}" class="${k === aba ? 'ativa' : ''}">${n}</button>`).join('')}</div>
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
    const l = { historico: form.hist.value, partidas: partidas.map((p) => ({ tipo: p.tipo, conta: p.conta, valor: centavos(p.valor) })) };
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
    lancs = [...lancs, { historico: `Estorno do lançamento nº ${i + 1}`, partidas: o.partidas.map((p) => ({ ...p, tipo: p.tipo === 'D' ? 'C' : 'D' })) }];
    mudou();
  }

  function relatorio() {
    const rel = el.querySelector('#rel');
    const linhaValor = (nome, v, forte) => `<tr><td>${forte ? `<strong>${esc(nome)}</strong>` : esc(nome)}</td><td class="num">${forte ? `<strong>${reais(v)}</strong>` : reais(v)}</td></tr>`;
    if (!lancs.length && aba !== 'diario') { rel.innerHTML = '<p class="muted">Sem lançamentos ainda.</p>'; return; }
    if (aba === 'diario') {
      rel.innerHTML = lancs.length ? `<table class="tabela"><thead><tr><th>Nº</th><th>Histórico / partidas</th><th class="num">Débito</th><th class="num">Crédito</th><th></th></tr></thead><tbody>${lancs.map((l, i) => `
        <tr><td>${i + 1}</td><td colspan="3"><strong>${esc(l.historico)}</strong></td><td><button class="btn peq" data-est="${i}" title="Lança o inverso, como na prática contábil">Estornar</button></td></tr>
        ${l.partidas.map((p) => `<tr><td></td><td style="padding-left:${p.tipo === 'C' ? 28 : 10}px">${p.tipo === 'C' ? 'a ' : ''}${esc(nomeConta(p.conta))}</td><td class="num">${p.tipo === 'D' ? reais(p.valor) : ''}</td><td class="num">${p.tipo === 'C' ? reais(p.valor) : ''}</td><td></td></tr>`).join('')}`).join('')}</tbody></table>`
        : '<p class="muted">O Livro Diário registra os fatos em ordem cronológica. Faça o primeiro lançamento acima.</p>';
      rel.querySelectorAll('[data-est]').forEach((b) => b.addEventListener('click', () => estornar(Number(b.dataset.est))));
    } else if (aba === 'razao') {
      const r = razao(lancs);
      rel.innerHTML = `<div class="grid">${Object.entries(r).map(([c, x]) => `<div class="card" style="padding:10px"><div style="text-align:center;font-weight:600;border-bottom:2px solid var(--text);padding-bottom:4px">${esc(nomeConta(c))}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr" class="pequeno mono"><div style="border-right:2px solid var(--text);padding:4px">${x.debitos.map((m) => `<div>(${m.n}) ${reais(m.valor)}</div>`).join('')}</div><div style="padding:4px">${x.creditos.map((m) => `<div>(${m.n}) ${reais(m.valor)}</div>`).join('')}</div></div>
        <div class="pequeno" style="border-top:1px solid var(--border);margin-top:4px;padding-top:4px">Saldo ${x.saldo >= 0 ? (PLANO.find((p) => p.codigo === c).natureza === 'D' ? 'devedor' : 'credor') : 'invertido'}: <strong>${reais(Math.abs(x.saldo))}</strong></div></div>`).join('')}</div>`;
    } else if (aba === 'balancete') {
      const b = balancete(lancs);
      rel.innerHTML = `<table class="tabela"><thead><tr><th>Conta</th><th class="num">Saldo devedor</th><th class="num">Saldo credor</th></tr></thead><tbody>${b.linhas.map((l) => `<tr><td>${l.codigo} ${esc(l.nome)}</td><td class="num">${l.devedor ? reais(l.devedor) : ''}</td><td class="num">${l.credor ? reais(l.credor) : ''}</td></tr>`).join('')}
        <tr><td><strong>Totais</strong></td><td class="num"><strong>${reais(b.totalD)}</strong></td><td class="num"><strong>${reais(b.totalC)}</strong></td></tr></tbody></table>
        <p class="${b.fechado ? 'ok' : 'erro'}" style="margin-top:8px">${b.fechado ? '✔ Balancete fechado: total de saldos devedores = total de saldos credores.' : '✖ Balancete não fecha.'}</p>`;
    } else if (aba === 'dre') {
      const d = dre(lancs);
      rel.innerHTML = `<table class="tabela"><tbody>${d.receitas.map((x) => linhaValor(x.nome, x.valor)).join('')}${linhaValor('(=) Total de receitas', d.totalReceitas, true)}
        ${d.despesas.map((x) => linhaValor(`(−) ${x.nome}`, x.valor)).join('')}${linhaValor('(−) Total de custos e despesas', d.totalDespesas, true)}
        ${linhaValor(d.resultado >= 0 ? '(=) Lucro do período' : '(=) Prejuízo do período', Math.abs(d.resultado), true)}</tbody></table>
        <p class="pequeno muted">DRE simplificada: sem tributos sobre vendas nem imposto de renda.</p>`;
    } else {
      const b = balanco(lancs);
      const col = (titulo, itens, extra = '') => `<div><h4>${titulo}</h4><table class="tabela"><tbody>${itens.map((x) => linhaValor(x.nome, x.valor)).join('')}${extra}</tbody></table></div>`;
      rel.innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        ${col('Ativo', b.ativo, linhaValor('Total do Ativo', b.totalAtivo, true))}
        <div>${col('Passivo', b.passivo, linhaValor('Total do Passivo', b.totalPassivo, true))}
        ${col('Patrimônio Líquido', b.pl, linhaValor('Resultado do período', b.resultado) + linhaValor('Total do PL', b.totalPL, true))}</div></div>
        <p class="${b.fechado ? 'ok' : 'erro'}">${b.fechado ? '✔' : '✖'} Ativo ${reais(b.totalAtivo)} ${b.fechado ? '=' : '≠'} Passivo + PL ${reais(b.totalPassivo + b.totalPL)}</p>`;
    }
  }

  function mudou() {
    labs.salvar('contabil', lancs);
    relatorio();
    painel.verificar((m) => m.check(lancs));
  }

  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => {
    aba = b.dataset.aba;
    el.querySelectorAll('[data-aba]').forEach((x) => x.classList.toggle('ativa', x === b));
    relatorio();
  }));
  confirmarReinicio(el, () => { labs.limpar('contabil'); lancs = []; mudou(); });

  desenharPartidas();
  mudou();
}

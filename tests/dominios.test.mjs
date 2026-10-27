import assert from 'node:assert/strict';
import * as L from '../src/domain/accounting/ledger.js';
import * as Custos from '../src/domain/accounting/costs.js';
import * as Publica from '../src/domain/accounting/public.js';
import * as Auditoria from '../src/domain/accounting/audit.js';
import * as Demonstracoes from '../src/domain/accounting/statements.js';
import * as N from '../src/domain/network/ipv4.js';
import * as A from '../src/domain/cloud/architecture.js';
import * as G from '../src/domain/gamification.js';
import * as Q from '../src/domain/quiz.js';

// ---------- contabilidade ----------
const lanc = (historico, ...ps) => ({ historico, partidas: ps.map(([tipo, conta, v]) => ({ tipo, conta, valor: L.centavos(v) })) });
assert.equal(L.centavos('1.234,56'), 123456);
assert.ok(Number.isNaN(L.centavos('12,345')));
assert.ok(L.validarLancamento(null).length > 0);
assert.ok(L.validarLancamento({ historico: 'data impossível', data: '2026-02-30', partidas: [] }).some((e) => e.includes('Data inválida')));
assert.ok(L.validarLancamento({ historico: 'x', partidas: [{ tipo: 'X', conta: '1.1.1', valor: 100 }] }).some((e) => e.includes('Tipo inválido')));
assert.ok(L.validarLancamento(lanc('x', ['D', '1.1.1', '10'], ['C', '2.3.1', '9'])).some((e) => e.includes('Partidas dobradas')));
assert.ok(L.validarLancamento(lanc('x', ['D', '1.1.1', '10'])).some((e) => e.includes('CRÉDITO')));
const ls = [
  lanc('Integralização', ['D', '1.1.1', '50000'], ['C', '2.3.1', '50000']),
  lanc('Depósito', ['D', '1.1.2', '30000'], ['C', '1.1.1', '30000']),
  lanc('Compra a prazo', ['D', '1.1.4', '12000'], ['C', '2.1.1', '12000']),
  lanc('Móveis', ['D', '1.2.1', '5000'], ['C', '1.1.2', '5000']),
  lanc('Venda', ['D', '1.1.1', '9000'], ['C', '3.1.1', '9000'], ['D', '4.1.1', '6000'], ['C', '1.1.4', '6000']),
  lanc('Aluguel', ['D', '4.2.2', '1500'], ['C', '1.1.1', '1500']),
  lanc('Fornecedores', ['D', '2.1.1', '4000'], ['C', '1.1.2', '4000']),
];
ls.forEach((l) => assert.deepEqual(L.validarLancamento(l), []));
L.OPERACOES.forEach((op, i) => assert.ok(L.operacaoConcluida(ls.slice(0, i + 1), op), op.id));
assert.equal(L.dre(ls).resultado, 150000);
assert.ok(L.balancete(ls).fechado);
assert.equal(L.balanco(ls).totalAtivo, 5950000);
assert.ok(L.fechamentoCorreto(ls));
const custo = Custos.analisarCustos({ preco: 15000, custosVariaveis: 6000, despesasVariaveis: 3000, custosFixos: 900000, despesasFixas: 300000 });
assert.deepEqual([custo.margemUnit, custo.indiceMargem, custo.unidadesEquilibrio, custo.receitaEquilibrio], [6000, 0.4, 200, 3000000]);
assert.equal(Custos.analisarCustos({ preco: 1000, custosVariaveis: 1000 }).unidadesEquilibrio, null);
assert.throws(() => Custos.analisarCustos({ preco: -1 }), RangeError);
assert.equal(custo.unidadesParaLucro(600000), 300);
assert.equal(custo.lucroEm(300), 600000);
assert.equal(custo.margemSeguranca(250), 50);
assert.equal(custo.grauAlavancagemOperacional(300), 3);
assert.throws(() => custo.unidadesParaLucro(-1), RangeError);
assert.ok(Publica.estagioDespesaValido(['empenho', 'liquidacao', 'pagamento']));
assert.ok(!Publica.estagioDespesaValido(['liquidacao', 'empenho']));
assert.equal(Publica.classificarRestosPagar({ empenhada: true, liquidada: true }), 'processado');
assert.equal(Publica.classificarRestosPagar({ empenhada: true }), 'nao-processado');
assert.equal(Publica.classificarRestosPagar({ empenhada: true, liquidada: true, paga: true }), null);
assert.ok(Publica.estagioReceitaValido(['previsao', 'lancamento', 'arrecadacao', 'recolhimento']));
assert.ok(!Publica.estagioReceitaValido(['previsao', 'arrecadacao']));
assert.match(Publica.classificarCreditoAdicional('especial'), /sem dotação/);
assert.equal(Publica.classificarCreditoAdicional('invalido'), null);
const mat = Auditoria.calcularMaterialidade({ valorReferencia: 10000000, percentual: 5 });
assert.deepEqual([mat.materialidade, mat.materialidadeExecucao], [500000, 375000]);
assert.throws(() => Auditoria.calcularMaterialidade({ valorReferencia: 100, percentual: 0 }), RangeError);
assert.equal(Auditoria.classificarOpiniao({ causa: 'distorcao', material: true, generalizada: true }), 'adversa');
assert.equal(Auditoria.classificarOpiniao({ causa: 'limitacao', material: true, generalizada: true }), 'abstencao');
assert.equal(Auditoria.classificarOpiniao({ causa: 'nenhuma', material: true }), 'nao-modificada');
const dfc = Demonstracoes.dfcSimplificada(ls);
assert.equal(dfc.variacaoLiquida, 4850000);
assert.equal(dfc.fluxos.operacional.saidas, 550000);
assert.equal(Demonstracoes.mutacoesPL(ls).totalPL, 5150000);
assert.equal(Demonstracoes.indicadoresContabeis(ls).capitalCirculanteLiquido, 4650000);

// ---------- redes ----------
const i = N.infoCidr('192.168.10.77', 26);
assert.deepEqual([i.rede, i.broadcast, i.mascara, i.primeiro, i.ultimo, i.hosts], ['192.168.10.64', '192.168.10.127', '255.255.255.192', '192.168.10.65', '192.168.10.126', 62]);
assert.equal(N.prefixoDeMascara('255.255.240.0'), 20);
assert.ok(N.dentro('10.0.1.0/24', '10.0.0.0/16') && !N.dentro('10.1.0.0/24', '10.0.0.0/16'));
const ex = N.gerarExercicio(() => 0.5);
assert.ok(Object.values(N.conferirExercicio(ex, { ...ex.resposta, hosts: ex.resposta.hosts })).every(Boolean));
const st = { topo: N.topologiaInicial() };
const m = (id) => N.MISSOES_REDE.find((x) => x.id === id).check(st);
assert.ok(!m('gateway') && !m('mascara') && !m('dns'));
assert.match(N.ping(st.topo, 'PC-Adm', '192.168.2.10').motivo, /RESPOSTA não volta/);
st.topo.hosts[1].gateway = '192.168.1.1';
st.topo.hosts[2].prefixo = 24;
st.topo.hosts[0].dns = '192.168.2.53';
assert.ok(m('gateway') && m('mascara') && m('dns'));

// ---------- nuvem ----------
const arq = A.novaArquitetura();
const no = (t, props = {}) => Object.assign(A.adicionarNo(arq, t).props, props) && arq.nos.at(-1);
const vpc = no('vpc');
no('igw', { vpc: vpc.id });
const pa = no('subnet', { vpc: vpc.id, az: 'a', publica: true, cidr: '10.0.1.0/24' });
const pb = no('subnet', { vpc: vpc.id, az: 'b', publica: true, cidr: '10.0.2.0/24' });
const va = A.validar(arq);
assert.ok(A.MISSOES_AWS[0].check(arq, va), JSON.stringify(va));
const xa = no('subnet', { vpc: vpc.id, az: 'a', publica: false, cidr: '10.0.11.0/24' });
const xb = no('subnet', { vpc: vpc.id, az: 'b', publica: false, cidr: '10.0.12.0/24' });
no('nat', { subnet: pa.id });
const sgAlb = no('sg', { vpc: vpc.id, regras: '443 0.0.0.0/0\n80 0.0.0.0/0' });
const sgApp = no('sg', { vpc: vpc.id, regras: `80 ${sgAlb.id}` });
const sgDb = no('sg', { vpc: vpc.id, regras: '5432 0.0.0.0/0' });
const r53 = no('route53');
const alb = no('alb', { subnets: [pa.id, pb.id], sg: sgAlb.id });
const asg = no('asg', { subnets: [xa.id, xb.id], sg: sgApp.id, min: 2, desejado: 2, max: 4 });
const rds = no('rds', { subnets: [xa.id, xb.id], sg: sgDb.id, multiAZ: true });
const cw = no('cloudwatch');
A.conectar(arq, r53.id, alb.id); A.conectar(arq, alb.id, asg.id); A.conectar(arq, asg.id, rds.id); A.conectar(arq, cw.id, asg.id);
let v = A.validar(arq);
assert.ok(v.some((x) => x.nivel === 'erro' && /exposta à internet/.test(x.msg)));
sgDb.props.regras = `5432 ${sgApp.id}`;
v = A.validar(arq);
assert.deepEqual(v.filter((x) => x.nivel === 'erro'), []);
assert.ok(A.MISSOES_AWS[1].check(arq, v) && A.MISSOES_AWS[2].check(arq, v) && A.MISSOES_AWS[3].check(arq, v));
assert.ok(A.estimarCusto(arq).total < 120, String(A.estimarCusto(arq).total));
assert.ok(A.MISSOES_AWS[5].check(arq, v));
rds.props.multiAZ = false;
assert.ok(!A.simularFalhaAz(arq, 'a').ok && A.simularFalhaAz(arq, 'b').ok);
sgApp.props.regras = '22 0.0.0.0/0';
assert.ok(A.validar(arq).some((x) => /não aceita tráfego do ALB/.test(x.msg)));
assert.match(A.gerarCloudFormation(arq), /AWS::ElasticLoadBalancingV2::LoadBalancer/);

// ---------- gamificação e questões ----------
let p = G.progressoVazio();
p = G.registrarResposta(p, { id: 'q1', area: 'ti', correta: true }, new Date('2026-10-14T12:00:00Z'));
p = G.registrarResposta(p, { id: 'q2', area: 'ti', correta: false }, new Date('2026-10-15T12:00:00Z'));
assert.equal(p.xp, 12);
assert.equal(G.sequencia(p.dias, new Date('2026-10-15T15:00:00Z')), 2);
p = G.registrarMissao(p, 'linux/x', 40);
assert.equal(G.registrarMissao(p, 'linux/x', 40).xp, p.xp);
assert.equal(G.nivel(150).titulo, 'Aprendiz');
const qs = [{ id: 'a', disciplina: 'X', correta: 1 }, { id: 'b', disciplina: 'Y', correta: 0 }];
assert.deepEqual(Q.apurar(qs, { a: 1, b: 2 }).porDisciplina, { X: { total: 1, acertos: 1 }, Y: { total: 1, acertos: 0 } });
assert.equal(Q.filtrar(qs, { somenteErros: true, respostas: { b: { ultima: false } } }).length, 1);
console.log('dominios ok');

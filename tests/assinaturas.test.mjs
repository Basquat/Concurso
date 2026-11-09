// Autorização, assinaturas e conteúdo premium: servidor real (server/app.js) + SQLite em memória + Stripe falso.
import assert from 'node:assert/strict';
import app from '../server/app.js';
import { bancoSqlite } from '../server/sqlite.js';
import { hex } from '../server/base.js';
import { premiumAtivo, direitos, TOLERANCIA_PAGAMENTO } from '../server/acesso.js';
import { verificarAssinatura, cancelarDaConta, form } from '../server/assinaturas.js';
import { carregarBanco, AMOSTRA_POR_DISCIPLINA } from '../server/conteudo.js';

const DIA = 86_400_000;
const agora = Date.now();

// ---- política de acesso ----
assert.equal(premiumAtivo(null), false);
assert.equal(premiumAtivo({ status: 'active', periodo_fim: agora + DIA }), true);
assert.equal(premiumAtivo({ status: 'active', periodo_fim: agora - 10 * DIA }), false, 'ativa mas vencida há muito: webhook perdido não dá acesso eterno');
assert.equal(premiumAtivo({ status: 'past_due', periodo_fim: agora - DIA }), true, 'cobrança falhou: tolerância');
assert.equal(premiumAtivo({ status: 'past_due', periodo_fim: agora - TOLERANCIA_PAGAMENTO - DIA }), false);
for (const s of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', 'nenhuma']) assert.equal(premiumAtivo({ status: s, periodo_fim: agora + DIA }), false, s);
assert.ok(direitos('admin', null).includes('conteudo:premium'));
assert.ok(!direitos('aluno', null).includes('conteudo:premium'));
assert.ok(direitos('aluno', { status: 'active', periodo_fim: agora + DIA }).includes('conteudo:premium'));
assert.ok(!direitos('aluno', { status: 'active', periodo_fim: agora + DIA }).includes('admin:usuarios'), 'assinatura não vira papel');
assert.equal(form({ a: [{ b: 1 }], c: { d: 'x' }, e: null }).toString(), 'a%5B0%5D%5Bb%5D=1&c%5Bd%5D=x');

// ---- assinatura do webhook ----
const SEGREDO = 'whsec_teste';
const assinar = async (corpo, t = Math.floor(Date.now() / 1000), segredo = SEGREDO) => {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${t}.${corpo}`)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${t},v1=${sig}`;
};
assert.ok(await verificarAssinatura('{"a":1}', await assinar('{"a":1}'), SEGREDO));
assert.ok(!await verificarAssinatura('{"a":2}', await assinar('{"a":1}'), SEGREDO), 'corpo alterado');
assert.ok(!await verificarAssinatura('{"a":1}', await assinar('{"a":1}', undefined, 'whsec_outro'), SEGREDO), 'segredo errado');
assert.ok(!await verificarAssinatura('{"a":1}', await assinar('{"a":1}', Math.floor(Date.now() / 1000) - 3600), SEGREDO), 'repetição antiga');
assert.ok(await verificarAssinatura('{"a":1}', `t=1,v1=00,${(await assinar('{"a":1}')).split(',')[1]}`.replace('t=1,', `t=${Math.floor(Date.now() / 1000)},`), SEGREDO), 'vários v1 (rotação de segredo)');
assert.ok(!await verificarAssinatura('{}', '', SEGREDO));

// ---- Stripe falso ----
const chamadas = [];
const estado = { sub: null };
const stripeFalso = async (url, init) => {
  const u = new URL(url);
  const corpo = new URLSearchParams(init.body ?? '');
  chamadas.push({ metodo: init.method, caminho: u.pathname, corpo, consulta: u.searchParams });
  assert.equal(init.headers.authorization, 'Bearer sk_test_x');
  const json = (d) => new Response(JSON.stringify(d), { status: 200 });
  if (u.pathname === '/v1/customers') return json({ id: 'cus_1' });
  if (u.pathname === '/v1/checkout/sessions') return json({ url: 'https://checkout.stripe.test/s1' });
  if (u.pathname === '/v1/billing_portal/sessions') return json({ url: 'https://billing.stripe.test/p1' });
  if (u.pathname === '/v1/subscriptions') return json({ data: estado.sub ? [estado.sub] : [] });
  if (u.pathname.startsWith('/v1/subscriptions/') && init.method === 'DELETE') { estado.sub = { ...estado.sub, status: 'canceled' }; return json(estado.sub); }
  if (u.pathname.startsWith('/v1/prices/')) return json({ unit_amount: u.pathname.endsWith('price_a') ? 13500 : 1490, currency: 'brl', recurring: { interval: u.pathname.endsWith('price_a') ? 'year' : 'month' } });
  return new Response('{}', { status: 404 });
};
const sub = (status, extra = {}) => ({ id: 'sub_1', status, created: 1, cancel_at_period_end: false, items: { data: [{ current_period_end: Math.floor((agora + 20 * DIA) / 1000), price: { id: 'price_m' } }] }, ...extra });

const bancoFalso = { todas: Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, disciplina: i < 25 ? 'A' : 'B' })) };
bancoFalso.amostra = bancoFalso.todas.filter((q, i) => (q.disciplina === 'A' ? i < AMOSTRA_POR_DISCIPLINA : true));
const env = {
  DB: bancoSqlite(), fetch: stripeFalso, banco: async () => bancoFalso, APP_URL: 'https://app.test',
  STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SEGREDO, STRIPE_PRICE_MENSAL: 'price_m', STRIPE_PRICE_ANUAL: 'price_a',
};

async function novaConta(id, nome) {
  await env.DB.prepare("INSERT INTO contas (id, nome, nome_lc, cor, criada_em, auth_sal, auth_hash, rec_sal, rec_hash, kdf, dek_senha, rec) VALUES (?, ?, ?, '#000000', ?, 's', 'h', 's', 'h', '{}', '{}', '{}')").bind(id, nome, nome.toLowerCase(), agora).run();
  await env.DB.prepare('INSERT INTO tokens (hash, conta, expira) VALUES (?, ?, ?)').bind(await hex(`tok-${id}`), id, agora + DIA).run();
  return `tok-${id}`;
}
const api = async (metodo, caminho, { token, corpo, cab = {} } = {}) => {
  const r = await app.fetch(new Request(`https://app.test${caminho}`, { method: metodo, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...cab }, body: corpo == null ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo) }), env);
  return { status: r.status, d: await r.json() };
};
const webhook = async (ev) => { const corpo = JSON.stringify(ev); return api('POST', '/stripe/webhook', { corpo, cab: { 'stripe-signature': await assinar(corpo) } }); };

const ana = await novaConta('conta-ana-0001', 'Ana');
const bia = await novaConta('conta-bia-0002', 'Bia');

// visitante e aluno sem assinatura: amostra; token inválido não derruba (vale como visitante)
let r = await api('GET', '/questoes');
assert.deepEqual([r.status, r.d.premium, r.d.total, r.d.questoes.length], [200, false, 30, AMOSTRA_POR_DISCIPLINA + 5]);
assert.equal((await api('GET', '/questoes', { token: 'lixo' })).d.premium, false);
r = await api('GET', '/eu', { token: ana });
assert.deepEqual([r.d.papel, r.d.assinatura, r.d.direitos.includes('conteudo:premium')], ['aluno', null, false]);
assert.equal((await api('GET', '/eu')).status, 401);

// planos vêm do Stripe (preço não fica no código)
r = await api('GET', '/planos');
assert.deepEqual(r.d.planos.map((p) => [p.id, p.valor, p.intervalo]), [['mensal', 1490, 'month'], ['anual', 13500, 'year']]);

// checkout: cria cliente uma vez e a sessão no modo assinatura
assert.equal((await api('POST', '/assinatura/checkout', { token: ana, corpo: { plano: 'vitalicio' } })).status, 400);
r = await api('POST', '/assinatura/checkout', { token: ana, corpo: { plano: 'mensal' } });
assert.equal(r.d.url, 'https://checkout.stripe.test/s1');
const sessao = chamadas.find((c) => c.caminho === '/v1/checkout/sessions').corpo;
assert.deepEqual([sessao.get('mode'), sessao.get('customer'), sessao.get('line_items[0][price]'), sessao.get('client_reference_id')], ['subscription', 'cus_1', 'price_m', 'conta-ana-0001']);
assert.equal(sessao.get('success_url'), 'https://app.test/#/conta?assinatura=retorno');
await api('POST', '/assinatura/checkout', { token: ana, corpo: { plano: 'anual' } });
assert.equal(chamadas.filter((c) => c.caminho === '/v1/customers').length, 1, 'reaproveita o cliente');

// voltar do Checkout com ?paid=true ou similar não ativa nada: só o webhook/reconciliação
assert.equal((await api('GET', '/eu', { token: ana })).d.direitos.includes('conteudo:premium'), false);

// webhook falso é recusado
assert.equal((await api('POST', '/stripe/webhook', { corpo: '{"id":"evt_x","type":"invoice.paid"}', cab: { 'stripe-signature': 't=1,v1=00' } })).status, 400);

// webhook verdadeiro → reconcilia com o Stripe → premium
estado.sub = sub('active');
r = await webhook({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { customer: 'cus_1', client_reference_id: 'conta-ana-0001' } } });
assert.equal(r.status, 200);
r = await api('GET', '/eu', { token: ana });
assert.deepEqual([r.d.assinatura.status, r.d.assinatura.plano, r.d.assinatura.premium], ['active', 'mensal', true]);
assert.equal((await api('GET', '/questoes', { token: ana })).d.questoes.length, 30);
assert.equal((await api('GET', '/questoes', { token: bia })).d.questoes.length, AMOSTRA_POR_DISCIPLINA + 5, 'assinatura é da Ana, não da Bia');
assert.equal((await api('POST', '/assinatura/checkout', { token: ana, corpo: { plano: 'anual' } })).status, 409, 'não assina duas vezes');

// evento repetido não reprocessa
const antes = chamadas.length;
assert.equal((await webhook({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { customer: 'cus_1' } } })).d.duplicado, true);
assert.equal(chamadas.length, antes);
// tipo irrelevante é ignorado
assert.equal((await webhook({ id: 'evt_9', type: 'charge.refunded', data: { object: { customer: 'cus_1' } } })).d.ignorado, true);

// cancelamento no fim do período: continua premium até lá
estado.sub = sub('active', { cancel_at_period_end: true });
await webhook({ id: 'evt_2', type: 'customer.subscription.updated', data: { object: { customer: 'cus_1' } } });
r = await api('GET', '/eu', { token: ana });
assert.deepEqual([r.d.assinatura.cancelaNoFim, r.d.assinatura.premium], [true, true]);

// evento antigo chegando depois (fora de ordem) não ressuscita estado velho: vale o estado atual no Stripe
estado.sub = sub('canceled');
await webhook({ id: 'evt_3', type: 'customer.subscription.deleted', data: { object: { customer: 'cus_1' } } });
await webhook({ id: 'evt_0', type: 'customer.subscription.created', data: { object: { customer: 'cus_1' } } });
r = await api('GET', '/eu', { token: ana });
assert.deepEqual([r.d.assinatura.status, r.d.assinatura.premium], ['canceled', false]);

// reconciliação manual e portal
estado.sub = sub('past_due', { items: { data: [{ current_period_end: Math.floor((agora - DIA) / 1000), price: { id: 'price_a' } }] } });
r = await api('POST', '/assinatura/sincronizar', { token: ana });
assert.deepEqual([r.d.assinatura.status, r.d.assinatura.plano, r.d.assinatura.premium], ['past_due', 'anual', true]);
assert.equal((await api('POST', '/assinatura/portal', { token: ana })).d.url, 'https://billing.stripe.test/p1');
assert.equal((await api('POST', '/assinatura/portal', { token: bia })).status, 404);

// excluir a conta encerra a cobrança
await cancelarDaConta(env, 'conta-ana-0001');
assert.ok(chamadas.some((c) => c.metodo === 'DELETE' && c.caminho === '/v1/subscriptions/sub_1'));

// RBAC: admin só por papel no banco; ninguém muda o próprio papel
assert.equal((await api('GET', '/admin/usuarios', { token: bia })).status, 403);
await env.DB.prepare("UPDATE contas SET papel = 'admin' WHERE id = ?").bind('conta-bia-0002').run();
r = await api('GET', '/admin/usuarios?busca=an', { token: bia });
assert.deepEqual(r.d.usuarios.map((u) => [u.nome, u.assinatura?.status]), [['Ana', 'past_due']]); // cancelarDaConta só encerra no Stripe; a linha some junto com a conta
assert.equal((await api('POST', '/admin/papel', { token: bia, corpo: { id: 'conta-bia-0002', papel: 'aluno' } })).status, 400);
assert.equal((await api('POST', '/admin/papel', { token: bia, corpo: { id: 'conta-ana-0001', papel: 'dono' } })).status, 400);
assert.equal((await api('POST', '/admin/papel', { token: bia, corpo: { id: 'conta-ana-0001', papel: 'admin' } })).status, 200);
assert.equal((await api('GET', '/eu', { token: ana })).d.papel, 'admin');
assert.equal((await api('GET', '/questoes', { token: bia })).d.premium, true, 'admin vê tudo sem assinar');

// sem Stripe configurado: planos vazios, checkout explica
const semStripe = { DB: bancoSqlite() };
assert.deepEqual(await (await app.fetch(new Request('https://x.test/planos'), semStripe)).json(), { configurado: false, planos: [] });

// banco real: amostra limitada por disciplina e nada do rascunho publicado
const real = await carregarBanco();
const porDisc = {};
for (const q of real.amostra) porDisc[q.disciplina] = (porDisc[q.disciplina] ?? 0) + 1;
assert.ok(Object.values(porDisc).every((n) => n <= AMOSTRA_POR_DISCIPLINA));
assert.ok(real.todas.length > real.amostra.length);
assert.ok(!real.todas.some((q) => q.id.startsWith('tr-')), 'questões geradas sem revisão não são publicadas');
console.log('assinaturas: ok');

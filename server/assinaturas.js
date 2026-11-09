// Assinaturas via Stripe (sem SDK: REST + HMAC do Web Crypto). Fonte da verdade = Stripe; a tabela `assinaturas`
// é um espelho reconciliado: todo webhook relevante busca o estado ATUAL no Stripe, então eventos repetidos ou fora
// de ordem não corrompem nada. A página de sucesso do Checkout nunca ativa nada por si só.
import { Erro, sql, quem } from './base.js';
import { perfil, premiumAtivo, assinaturaPublica } from './acesso.js';

const API = 'https://api.stripe.com/v1/';
export const VERSAO_STRIPE = '2025-03-31.basil';
const TOLERANCIA_ASSINATURA_S = 300;
const enc = new TextEncoder();

// Corpo application/x-www-form-urlencoded com a notação do Stripe: a[b][0][c]=v.
export function form(obj, pre = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const chave = pre ? `${pre}[${k}]` : k;
    if (v != null && typeof v === 'object') form(v, chave, out);
    else if (v != null) out.append(chave, String(v));
  }
  return out;
}

const configurado = (env) => !!env.STRIPE_SECRET_KEY;
async function stripe(env, metodo, caminho, params) {
  if (!configurado(env)) throw new Erro(503, 'Pagamentos ainda não configurados neste servidor.');
  const corpo = params ? form(params).toString() : '';
  const r = await (env.fetch ?? fetch)(API + caminho + (metodo === 'GET' && corpo ? `?${corpo}` : ''), {
    method: metodo,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'stripe-version': VERSAO_STRIPE, ...(metodo === 'GET' ? {} : { 'content-type': 'application/x-www-form-urlencoded' }) },
    body: metodo === 'GET' ? undefined : corpo,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('stripe', metodo, caminho, r.status, d.error?.type, d.error?.code); // sem dados pessoais nos logs
    throw new Erro(502, 'Não foi possível falar com o Stripe agora. Tente de novo em instantes.');
  }
  return d;
}

const PLANOS = { mensal: 'STRIPE_PRICE_MENSAL', anual: 'STRIPE_PRICE_ANUAL' };
let cachePlanos = { em: 0, planos: null };

// Prioridade ao escolher entre várias assinaturas do mesmo cliente.
const PESO = { active: 6, trialing: 6, past_due: 5, unpaid: 4, incomplete: 3, paused: 2 };

// Estado atual da assinatura de um cliente no Stripe → tabela local.
export async function reconciliar(env, cliente) {
  const lista = await stripe(env, 'GET', 'subscriptions', { customer: cliente, status: 'all', limit: 10 });
  const s = [...lista.data].sort((a, b) => (PESO[b.status] ?? 0) - (PESO[a.status] ?? 0) || b.created - a.created)[0];
  const item = s?.items?.data?.[0];
  const fim = (item?.current_period_end ?? s?.current_period_end ?? 0) * 1000;
  await sql(env, 'UPDATE assinaturas SET assinatura = ?, status = ?, preco = ?, periodo_fim = ?, cancela_no_fim = ?, atualizado_em = ? WHERE cliente = ?',
    s?.id ?? null, s?.status ?? 'nenhuma', item?.price?.id ?? null, fim, s && (s.cancel_at_period_end || s.cancel_at) ? 1 : 0, Date.now(), cliente).run();
  return sql(env, 'SELECT * FROM assinaturas WHERE cliente = ?', cliente).first();
}

async function clienteDa(env, conta) {
  const a = await sql(env, 'SELECT * FROM assinaturas WHERE conta = ?', conta.id).first();
  if (a) return a;
  const c = await stripe(env, 'POST', 'customers', { name: conta.nome, ...(conta.email ? { email: conta.email } : {}), metadata: { conta: conta.id } });
  // Corrida entre duas abas: a primeira grava, a segunda reaproveita (o cliente extra fica órfão e inofensivo).
  await sql(env, 'INSERT INTO assinaturas (conta, cliente, atualizado_em) VALUES (?, ?, ?) ON CONFLICT (conta) DO NOTHING', conta.id, c.id, Date.now()).run();
  return sql(env, 'SELECT * FROM assinaturas WHERE conta = ?', conta.id).first();
}

// Usado ao excluir a conta: encerra a cobrança imediatamente.
export async function cancelarDaConta(env, contaId) {
  const a = await sql(env, 'SELECT assinatura, status FROM assinaturas WHERE conta = ?', contaId).first();
  if (a?.assinatura && !['canceled', 'incomplete_expired'].includes(a.status)) await stripe(env, 'DELETE', `subscriptions/${encodeURIComponent(a.assinatura)}`);
}

const origem = (env, req) => String(env.APP_URL || new URL(req.url).origin).replace(/\/+$/, '');

// Verificação manual do cabeçalho Stripe-Signature: t=<unix>,v1=<hex>[,v1=...]; HMAC-SHA256 de "<t>.<corpo>".
export async function verificarAssinatura(corpo, cabecalho, segredo, agora = Date.now()) {
  const partes = String(cabecalho ?? '').split(',').map((p) => p.split('='));
  const t = Number(partes.find(([k]) => k === 't')?.[1]);
  const v1 = partes.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!segredo || !Number.isFinite(t) || !v1.length) return false;
  if (Math.abs(agora / 1000 - t) > TOLERANCIA_ASSINATURA_S) return false;
  const chave = await crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const esperado = [...new Uint8Array(await crypto.subtle.sign('HMAC', chave, enc.encode(`${t}.${corpo}`)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return v1.some((v) => v.length === esperado.length && [...v].reduce((d, c, i) => d | (c.charCodeAt(0) ^ esperado.charCodeAt(i)), 0) === 0);
}

const EVENTOS = new Set([
  'checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
  'customer.subscription.paused', 'customer.subscription.resumed', 'invoice.paid', 'invoice.payment_failed',
]);

export const ROTAS = {
  'GET /planos': async (_b, _req, env) => {
    if (!configurado(env)) return { configurado: false, planos: [] };
    if (Date.now() - cachePlanos.em > 600_000) {
      const planos = [];
      for (const [id, variavel] of Object.entries(PLANOS)) {
        if (!env[variavel]) continue;
        const p = await stripe(env, 'GET', `prices/${encodeURIComponent(env[variavel])}`);
        planos.push({ id, valor: p.unit_amount, moeda: p.currency, intervalo: p.recurring?.interval ?? null });
      }
      cachePlanos = { em: Date.now(), planos };
    }
    return { configurado: true, planos: cachePlanos.planos };
  },

  'POST /assinatura/checkout': async (b, req, env) => {
    const conta = await perfil(env, await quem(req, env));
    const preco = env[PLANOS[b.plano]];
    if (!preco) throw new Erro(400, 'Plano inválido.');
    if (premiumAtivo(conta.assinatura)) throw new Erro(409, 'Você já tem uma assinatura ativa. Use "Gerenciar assinatura" para trocar de plano.');
    const a = await clienteDa(env, conta);
    const base = origem(env, req);
    const s = await stripe(env, 'POST', 'checkout/sessions', {
      mode: 'subscription', customer: a.cliente, client_reference_id: conta.id, locale: 'pt-BR',
      line_items: [{ price: preco, quantity: 1 }],
      subscription_data: { metadata: { conta: conta.id } },
      success_url: `${base}/#/conta?assinatura=retorno`, cancel_url: `${base}/#/conta?assinatura=cancelada`,
    });
    return { url: s.url };
  },

  'POST /assinatura/portal': async (_b, req, env) => {
    const id = await quem(req, env);
    const a = await sql(env, 'SELECT cliente FROM assinaturas WHERE conta = ?', id).first();
    if (!a) throw new Erro(404, 'Você ainda não tem assinatura.');
    const s = await stripe(env, 'POST', 'billing_portal/sessions', { customer: a.cliente, return_url: `${origem(env, req)}/#/conta?assinatura=retorno` });
    return { url: s.url };
  },

  // Reconciliação sob demanda (volta do Checkout/Portal ou botão "Atualizar status").
  'POST /assinatura/sincronizar': async (_b, req, env) => {
    const id = await quem(req, env);
    const a = await sql(env, 'SELECT cliente FROM assinaturas WHERE conta = ?', id).first();
    return { assinatura: a ? assinaturaPublica(env, await reconciliar(env, a.cliente)) : null };
  },

  'POST /stripe/webhook': async (_b, req, env, corpo) => {
    if (!await verificarAssinatura(corpo, req.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)) throw new Erro(400, 'Assinatura do webhook inválida.');
    const ev = JSON.parse(corpo);
    if (!EVENTOS.has(ev.type)) return { ignorado: true };
    if (await sql(env, 'SELECT 1 AS ok FROM eventos_stripe WHERE id = ?', ev.id).first()) return { duplicado: true };
    const obj = ev.data?.object ?? {};
    const cliente = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
    if (cliente) {
      // Checkout de um cliente ainda não ligado (ex.: linha apagada): liga pela referência que o próprio servidor pôs na sessão.
      const ref = obj.client_reference_id ?? obj.metadata?.conta;
      if (ref && await sql(env, 'SELECT 1 AS ok FROM contas WHERE id = ?', ref).first()) {
        await sql(env, 'INSERT INTO assinaturas (conta, cliente, atualizado_em) VALUES (?, ?, ?) ON CONFLICT (conta) DO UPDATE SET cliente = excluded.cliente', ref, cliente, Date.now()).run();
      }
      if (await sql(env, 'SELECT 1 AS ok FROM assinaturas WHERE cliente = ?', cliente).first()) await reconciliar(env, cliente);
    }
    await sql(env, 'INSERT INTO eventos_stripe (id, tipo, recebido_em) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING', ev.id, ev.type, Date.now()).run();
    return { ok: true };
  },
};

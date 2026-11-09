// Autorização: papel (quem a pessoa é na plataforma) e assinatura (o que ela pagou) são independentes;
// `direitos` combina os dois e é a ÚNICA fonte de verdade para liberar recursos — no servidor.
import { Erro, sql, quem } from './base.js';

const DIA = 86_400_000;
// Webhooks de renovação podem atrasar (o Stripe tenta de novo por até 3 dias).
export const MARGEM_RENOVACAO = 3 * DIA;
// Cobrança recusada: o Stripe segue tentando; o aluno mantém o acesso por esta tolerância após o fim do período.
export const TOLERANCIA_PAGAMENTO = 7 * DIA;

export const PERMISSOES = {
  visitante: ['conteudo:basico'],
  aluno: ['conteudo:basico', 'assinatura:contratar'],
  admin: ['conteudo:basico', 'conteudo:premium', 'admin:usuarios'],
};
const DO_ASSINANTE = ['conteudo:premium'];

export function premiumAtivo(a, agora = Date.now()) {
  if (!a) return false;
  if (a.status === 'active' || a.status === 'trialing') return a.periodo_fim + MARGEM_RENOVACAO > agora;
  if (a.status === 'past_due') return a.periodo_fim + TOLERANCIA_PAGAMENTO > agora;
  return false;
}

export const direitos = (papel, assinatura, agora) => [...new Set([...(PERMISSOES[papel] ?? PERMISSOES.visitante), ...(premiumAtivo(assinatura, agora) ? DO_ASSINANTE : [])])];

// Perfil de acesso de uma conta (ou de visitante, com id null).
export async function perfil(env, id) {
  if (!id) return { id: null, papel: 'visitante', assinatura: null, direitos: direitos('visitante') };
  const c = await sql(env, 'SELECT id, nome, email, papel FROM contas WHERE id = ?', id).first();
  if (!c) throw new Erro(401, 'Conta não encontrada.');
  const a = await sql(env, 'SELECT * FROM assinaturas WHERE conta = ?', id).first();
  return { ...c, assinatura: a, direitos: direitos(c.papel, a) };
}

export async function exigir(env, req, permissao) {
  const p = await perfil(env, await quem(req, env));
  if (!p.direitos.includes(permissao)) throw new Erro(403, 'Sem permissão para esta operação.');
  return p;
}

const plano = (env, preco) => (preco && preco === env.STRIPE_PRICE_ANUAL ? 'anual' : preco && preco === env.STRIPE_PRICE_MENSAL ? 'mensal' : null);
export const assinaturaPublica = (env, a) => (a ? { status: a.status, plano: plano(env, a.preco), periodoFim: a.periodo_fim || null, cancelaNoFim: !!a.cancela_no_fim, premium: premiumAtivo(a) } : null);

export const ROTAS = {
  'GET /eu': async (_b, req, env) => {
    const p = await perfil(env, await quem(req, env));
    return { id: p.id, nome: p.nome, papel: p.papel, assinatura: assinaturaPublica(env, p.assinatura), direitos: p.direitos };
  },

  'GET /admin/usuarios': async (_b, req, env) => {
    await exigir(env, req, 'admin:usuarios');
    const busca = `%${(new URL(req.url).searchParams.get('busca') ?? '').trim().toLowerCase().slice(0, 40)}%`;
    const { results } = await sql(env, `SELECT c.id, c.nome, c.email, c.papel, c.criada_em, a.status, a.periodo_fim, a.preco, a.cancela_no_fim
      FROM contas c LEFT JOIN assinaturas a ON a.conta = c.id WHERE c.nome_lc LIKE ? OR c.email LIKE ? ORDER BY c.criada_em DESC LIMIT 200`, busca, busca).all();
    return { usuarios: results.map((r) => ({ id: r.id, nome: r.nome, email: r.email, papel: r.papel, criadaEm: r.criada_em, assinatura: r.status ? assinaturaPublica(env, r) : null })) };
  },

  'POST /admin/papel': async (b, req, env) => {
    const eu = await exigir(env, req, 'admin:usuarios');
    if (!['aluno', 'admin'].includes(b.papel)) throw new Erro(400, 'Papel inválido.');
    if (b.id === eu.id) throw new Erro(400, 'Você não pode mudar o próprio papel (evita ficar sem administrador).');
    const alvo = await sql(env, 'SELECT id FROM contas WHERE id = ?', String(b.id ?? '')).first();
    if (!alvo) throw new Erro(404, 'Conta não encontrada.');
    await sql(env, 'UPDATE contas SET papel = ? WHERE id = ?', b.papel, alvo.id).run();
    return { ok: true };
  },
};

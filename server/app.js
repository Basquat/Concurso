// Monólito modular: um único handler HTTP (Web Request → Response) que despacha para os módulos.
// Usado pela Vercel Function (api/index.js), pelo servidor local (server/dev.mjs) e pelos testes.
import { Erro } from './base.js';
import { ROTAS as CONTAS } from './contas.js';
import { ROTAS as ACESSO } from './acesso.js';
import { ROTAS as ASSINATURAS } from './assinaturas.js';
import { ROTAS as CONTEUDO } from './conteudo.js';

const ROTAS = { ...CONTAS, ...ACESSO, ...ASSINATURAS, ...CONTEUDO };
const MAX_CORPO = 4_000_000;

// Mesma origem na Vercel; ORIGENS só importa se o front for servido de outro domínio.
function cabecalhos(req, env) {
  const origem = req.headers.get('origin');
  const lista = (env.ORIGENS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const mesma = origem && origem === new URL(req.url).origin;
  const livre = lista.includes('*');
  if (origem && !mesma && !livre && !lista.includes(origem)) throw new Erro(403, 'Origem não autorizada.');
  return {
    ...(origem && !mesma ? { 'access-control-allow-origin': livre ? '*' : origem, 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'access-control-max-age': '86400' } : {}),
    vary: 'Origin',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };
}

// `caminho` permite montar a API sob um prefixo (/api) sem que os módulos saibam disso.
export async function atender(req, env, caminho = new URL(req.url).pathname) {
  let cab = {};
  const resp = (status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { ...cab, 'content-type': 'application/json; charset=utf-8' } });
  try {
    cab = cabecalhos(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cab });
    if (req.method === 'GET' && (caminho === '/' || caminho === '')) return resp(200, { ok: true, servico: 'concurso-lab' });
    const rota = ROTAS[`${req.method} ${caminho}`];
    if (!rota) throw new Erro(404, 'Rota inexistente.');
    let corpo = {};
    let bruto = '';
    if (req.method !== 'GET') {
      bruto = await req.text();
      if (bruto.length > MAX_CORPO) throw new Erro(413, 'Requisição grande demais.');
      // O webhook precisa do texto exato para conferir a assinatura; os demais recebem JSON.
      if (caminho !== '/stripe/webhook') {
        try { corpo = bruto ? JSON.parse(bruto) : {}; } catch { throw new Erro(400, 'JSON inválido.'); }
        if (!corpo || typeof corpo !== 'object') throw new Erro(400, 'JSON inválido.');
      }
    }
    return resp(200, await rota(corpo, req, env, bruto));
  } catch (e) {
    if (e instanceof Erro) return resp(e.status, { erro: e.message });
    console.error(e);
    return resp(500, { erro: 'Erro interno no servidor.' });
  }
}

export default { fetch: (req, env) => atender(req, env) };

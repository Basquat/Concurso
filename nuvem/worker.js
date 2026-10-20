// API de contas e sincronização do Concurso Lab (Cloudflare Worker + D1).
// Zero conhecimento: o navegador cifra tudo (AES-GCM) antes de enviar. O servidor guarda blobs opacos, as chaves
// de dados embrulhadas pela senha/código de recuperação e apenas o SHA-256 de segredos DERIVADOS da senha
// (PBKDF2 com sal próprio, diferente do que embrulha a chave) — nunca a senha nem a chave de dados.
const NOME = /^[\p{L}\p{N} ._'-]{2,40}$/u;
const ID = /^[\w-]{8,64}$/;
const B64 = /^[A-Za-z0-9+/=_-]*$/;
const TOKEN_MS = 30 * 86_400_000;
const MAX_CT = 1_900_000;
const enc = new TextEncoder();

class Erro extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

const hex = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const igual = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
const aleatorio = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]);

const b64 = (v, max = 256) => {
  if (typeof v !== 'string' || !v || v.length > max || !B64.test(v)) throw new Erro(400, 'Dados inválidos.');
  return v;
};
const inteiro = (v, min, max) => {
  if (!Number.isInteger(v) || v < min || v > max) throw new Erro(400, 'Dados inválidos.');
  return v;
};
function nomeOk(n) {
  n = String(n ?? '').trim().replace(/\s+/g, ' ');
  if (!NOME.test(n)) throw new Erro(400, 'Nome: de 2 a 40 caracteres (letras, números, espaço, ponto, hífen).');
  return n;
}
function emailOk(e) {
  e = String(e ?? '').trim().toLowerCase();
  if (e && (e.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) throw new Erro(400, 'E-mail inválido.');
  return e;
}
const emb = (e) => ({ iv: b64(e?.iv, 32), ct: b64(e?.ct, 128) });
function criptoOk(c) {
  if (!c || typeof c !== 'object') throw new Erro(400, 'Dados inválidos.');
  return {
    kdf: JSON.stringify({ alg: 'PBKDF2-SHA256', iteracoes: inteiro(c.kdf?.iteracoes, 100_000, 5_000_000), sal: b64(c.kdf?.sal, 64) }),
    dekSenha: JSON.stringify(emb(c.dekSenha)),
    rec: JSON.stringify({ ...emb(c.rec), sal: b64(c.rec?.sal, 64), iteracoes: inteiro(c.rec?.iteracoes, 100_000, 5_000_000) }),
  };
}
const publica = (r) => ({ id: r.id, nome: r.nome, email: r.email, cor: r.cor, criadaEm: r.criada_em, kdf: JSON.parse(r.kdf), dekSenha: JSON.parse(r.dek_senha), rec: JSON.parse(r.rec) });

const sql = (env, texto, ...args) => env.DB.prepare(texto).bind(...args);
const porNome = (env, nome) => sql(env, 'SELECT * FROM contas WHERE nome_lc = ?', nomeOk(nome).toLowerCase()).first();

// Confere um segredo derivado contra o hash guardado, com bloqueio progressivo após 5 falhas.
async function conferir(env, c, campo, segredo) {
  const agora = Date.now();
  if (c.bloqueada_ate > agora) throw new Erro(429, `Muitas tentativas. Tente de novo em ${Math.ceil((c.bloqueada_ate - agora) / 1000)} s.`);
  if (typeof segredo === 'string' && segredo.length < 200 && igual(await hex(segredo), c[campo])) {
    if (c.falhas) await sql(env, 'UPDATE contas SET falhas = 0, bloqueada_ate = 0 WHERE id = ?', c.id).run();
    return;
  }
  const falhas = c.falhas + 1;
  const ate = falhas >= 5 ? agora + Math.min(900_000, 30_000 * 2 ** (falhas - 5)) : 0;
  await sql(env, 'UPDATE contas SET falhas = ?, bloqueada_ate = ? WHERE id = ?', falhas, ate, c.id).run();
  throw new Erro(401, 'Nome ou senha incorretos.');
}
async function credenciais(env, b, campo = 'auth_hash', chave = 'auth') {
  const c = await porNome(env, b.nome);
  if (!c) throw new Erro(401, 'Nome ou senha incorretos.');
  await conferir(env, c, campo, b[chave]);
  return c;
}

async function novoToken(env, conta) {
  const t = aleatorio();
  await env.DB.batch([
    sql(env, 'DELETE FROM tokens WHERE conta = ? AND expira < ?', conta, Date.now()),
    sql(env, 'INSERT INTO tokens (hash, conta, expira) VALUES (?, ?, ?)', await hex(t), conta, Date.now() + TOKEN_MS),
  ]);
  return t;
}
const bearer = (req) => (req.headers.get('authorization') ?? '').replace(/^Bearer /, '');
async function quem(req, env) {
  const t = bearer(req);
  const r = t && await sql(env, 'SELECT conta FROM tokens WHERE hash = ? AND expira > ?', await hex(t), Date.now()).first();
  if (!r) throw new Erro(401, 'Sessão da nuvem expirada. Entre de novo com a senha.');
  return r.conta;
}
const duplicado = (e) => {
  if (/UNIQUE|constraint/i.test(String(e?.message))) throw new Erro(409, 'Esse nome já está em uso. Escolha outro ou entre na conta existente.');
  throw e;
};

const ROTAS = {
  'POST /salts': async (b, _req, env) => {
    const c = await porNome(env, b.nome);
    if (!c) throw new Erro(404, 'Conta não encontrada.');
    return { authSal: c.auth_sal, recSal: c.rec_sal };
  },

  'POST /conta': async (b, _req, env) => {
    const nome = nomeOk(b.nome);
    if (!ID.test(b.id ?? '')) throw new Erro(400, 'Dados inválidos.');
    const cor = /^#[0-9a-f]{6}$/i.test(b.cor) ? b.cor : '#4f46e5';
    const k = criptoOk(b);
    await sql(env, 'INSERT INTO contas (id, nome, nome_lc, email, cor, criada_em, auth_sal, auth_hash, rec_sal, rec_hash, kdf, dek_senha, rec) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      b.id, nome, nome.toLowerCase(), emailOk(b.email), cor, inteiro(b.criadaEm, 0, 2 ** 52), b64(b.authSal, 64), await hex(b64(b.auth, 64)), b64(b.recSal, 64), await hex(b64(b.recAuth, 64)), k.kdf, k.dekSenha, k.rec,
    ).run().catch(duplicado);
    return { token: await novoToken(env, b.id) };
  },

  'POST /entrar': async (b, _req, env) => {
    const c = await credenciais(env, b);
    return { token: await novoToken(env, c.id), conta: publica(c) };
  },

  'POST /recuperar': async (b, _req, env) => {
    const c = await credenciais(env, b, 'rec_hash', 'recAuth');
    const n = b.novo ?? {};
    const k = criptoOk(n);
    await env.DB.batch([
      sql(env, 'UPDATE contas SET auth_sal = ?, auth_hash = ?, rec_sal = ?, rec_hash = ?, kdf = ?, dek_senha = ?, rec = ? WHERE id = ?',
        b64(n.authSal, 64), await hex(b64(n.auth, 64)), b64(n.recSal, 64), await hex(b64(n.recAuth, 64)), k.kdf, k.dekSenha, k.rec, c.id),
      sql(env, 'DELETE FROM tokens WHERE conta = ?', c.id),
    ]);
    const r = await sql(env, 'SELECT * FROM contas WHERE id = ?', c.id).first();
    return { token: await novoToken(env, c.id), conta: publica(r) };
  },

  'POST /senha': async (b, _req, env) => {
    const c = await credenciais(env, b);
    const n = b.novo ?? {};
    const k = criptoOk({ ...n, rec: JSON.parse(c.rec) });
    await env.DB.batch([
      sql(env, 'UPDATE contas SET auth_sal = ?, auth_hash = ?, kdf = ?, dek_senha = ? WHERE id = ?', b64(n.authSal, 64), await hex(b64(n.auth, 64)), k.kdf, k.dekSenha, c.id),
      sql(env, 'DELETE FROM tokens WHERE conta = ?', c.id),
    ]);
    return { token: await novoToken(env, c.id) };
  },

  'POST /codigo': async (b, _req, env) => {
    const c = await credenciais(env, b);
    const k = criptoOk({ kdf: JSON.parse(c.kdf), dekSenha: JSON.parse(c.dek_senha), rec: b.rec });
    await sql(env, 'UPDATE contas SET rec_sal = ?, rec_hash = ?, rec = ? WHERE id = ?', b64(b.recSal, 64), await hex(b64(b.recAuth, 64)), k.rec, c.id).run();
    return { ok: true };
  },

  'DELETE /conta': async (b, _req, env) => {
    const c = await credenciais(env, b);
    await env.DB.batch([sql(env, 'DELETE FROM registros WHERE conta = ?', c.id), sql(env, 'DELETE FROM tokens WHERE conta = ?', c.id), sql(env, 'DELETE FROM contas WHERE id = ?', c.id)]);
    return { ok: true };
  },

  'POST /perfil': async (b, req, env) => {
    const id = await quem(req, env);
    if (b.nome != null) {
      const nome = nomeOk(b.nome);
      await sql(env, 'UPDATE contas SET nome = ?, nome_lc = ? WHERE id = ?', nome, nome.toLowerCase(), id).run().catch(duplicado);
    }
    if (b.email != null) await sql(env, 'UPDATE contas SET email = ? WHERE id = ?', emailOk(b.email), id).run();
    return { ok: true };
  },

  'POST /sair': async (_b, req, env) => {
    const t = bearer(req);
    if (t) await sql(env, 'DELETE FROM tokens WHERE hash = ?', await hex(t)).run();
    return { ok: true };
  },

  'GET /indice': async (_b, req, env) => {
    const id = await quem(req, env);
    return { itens: (await sql(env, 'SELECT chave, em FROM registros WHERE conta = ?', id).all()).results };
  },

  'POST /buscar': async (b, req, env) => {
    const id = await quem(req, env);
    const chaves = Array.isArray(b.chaves) ? b.chaves.slice(0, 20).map(String) : [];
    if (!chaves.length) return { registros: [] };
    const q = await sql(env, `SELECT chave, iv, ct, em FROM registros WHERE conta = ? AND chave IN (${chaves.map(() => '?').join(',')})`, id, ...chaves).all();
    return { registros: q.results };
  },

  'PUT /dados': async (b, req, env) => {
    const id = await quem(req, env);
    const regs = Array.isArray(b.registros) ? b.registros : [];
    if (regs.length > 100) throw new Erro(400, 'Lote grande demais.');
    const stmts = regs.map((r) => {
      if (typeof r.chave !== 'string' || !r.chave || r.chave.length > 200) throw new Erro(400, 'Dados inválidos.');
      return sql(env, 'INSERT INTO registros (conta, chave, iv, ct, em) VALUES (?,?,?,?,?) ON CONFLICT(conta, chave) DO UPDATE SET iv = excluded.iv, ct = excluded.ct, em = excluded.em WHERE excluded.em > registros.em',
        id, r.chave, b64(r.iv, 32), b64(r.ct, MAX_CT), inteiro(r.em, 0, 2 ** 52));
    });
    if (stmts.length) await env.DB.batch(stmts);
    return { ok: true, n: stmts.length };
  },
};

function cabecalhos(req, env) {
  const origem = req.headers.get('origin');
  const lista = (env.ORIGENS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const livre = lista.includes('*');
  if (origem && !livre && !lista.includes(origem)) throw new Erro(403, 'Origem não autorizada.');
  return {
    'access-control-allow-origin': livre ? '*' : origem ?? '',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'Origin',
    'cache-control': 'no-store',
  };
}

export default {
  async fetch(req, env) {
    let cab = {};
    const resp = (status, corpo) => new Response(JSON.stringify(corpo), { status, headers: { ...cab, 'content-type': 'application/json; charset=utf-8' } });
    try {
      cab = cabecalhos(req, env);
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cab });
      const url = new URL(req.url);
      if (req.method === 'GET' && url.pathname === '/') return resp(200, { ok: true, servico: 'concurso-lab-nuvem' });
      const rota = ROTAS[`${req.method} ${url.pathname}`];
      if (!rota) throw new Erro(404, 'Rota inexistente.');
      let corpo = {};
      if (req.method !== 'GET') {
        const texto = await req.text();
        if (texto.length > 4_000_000) throw new Erro(413, 'Requisição grande demais.');
        try { corpo = texto ? JSON.parse(texto) : {}; } catch { throw new Erro(400, 'JSON inválido.'); }
        if (!corpo || typeof corpo !== 'object') throw new Erro(400, 'JSON inválido.');
      }
      return resp(200, await rota(corpo, req, env));
    } catch (e) {
      if (e instanceof Erro) return resp(e.status, { erro: e.message });
      console.error(e);
      return resp(500, { erro: 'Erro interno na nuvem.' });
    }
  },
};

// Utilitários compartilhados pelos módulos do servidor: erro HTTP, banco, validação e sessão.
// O banco segue a interface do Cloudflare D1 (prepare/bind/first/all/run + batch), implementada por
// server/neon.js (produção) e server/sqlite.js (testes e desenvolvimento).
const enc = new TextEncoder();

export class Erro extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}

export const sql = (env, texto, ...args) => env.DB.prepare(texto).bind(...args);
export const hex = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
export const igual = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
export const aleatorio = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]);

const B64 = /^[A-Za-z0-9+/=_-]*$/;
export const b64 = (v, max = 256) => {
  if (typeof v !== 'string' || !v || v.length > max || !B64.test(v)) throw new Erro(400, 'Dados inválidos.');
  return v;
};
export const inteiro = (v, min, max) => {
  if (!Number.isInteger(v) || v < min || v > max) throw new Erro(400, 'Dados inválidos.');
  return v;
};

export const bearer = (req) => (req.headers.get('authorization') ?? '').replace(/^Bearer /, '');

// Conta dona do token. Com `opcional`, token ausente ou vencido vale como visitante (null).
export async function quem(req, env, { opcional = false } = {}) {
  const t = bearer(req);
  const r = t && await sql(env, 'SELECT conta FROM tokens WHERE hash = ? AND expira > ?', await hex(t), Date.now()).first();
  if (r) return r.conta;
  if (opcional) return null;
  throw new Erro(401, 'Sessão expirada. Entre de novo com a senha.');
}

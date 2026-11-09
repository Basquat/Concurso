// Vercel Function única: toda a API (/api/*) passa por aqui (ver rewrites em vercel.json).
import { atender } from '../server/app.js';
import { bancoNeon } from '../server/neon.js';

const env = { ...process.env, DB: bancoNeon(process.env.DATABASE_URL) };

export default {
  fetch(req) {
    const url = new URL(req.url);
    // A rewrite entrega o resto do caminho em ?rota=; sem ela (chamada direta), tira o prefixo /api.
    const rota = url.searchParams.get('rota');
    return atender(req, env, rota != null ? `/${rota}` : url.pathname.replace(/^\/api/, '') || '/');
  },
};

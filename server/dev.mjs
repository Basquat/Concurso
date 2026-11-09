// Servidor local completo (estático + API + SQLite em .dev/): npm run dev → http://localhost:8765
// Variáveis STRIPE_* opcionais (modo teste); sem elas a tela de planos informa que pagamentos não estão configurados.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { atender } from './app.js';
import { bancoSqlite } from './sqlite.js';
import { publico } from '../tools/publico.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.env.PORT ?? 8765);
fs.mkdirSync(path.join(RAIZ, '.dev'), { recursive: true });
const env = { ...process.env, DB: bancoSqlite(path.join(RAIZ, '.dev', 'banco.sqlite')) };
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api')) {
      const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((ok) => { const p = []; req.on('data', (c) => p.push(c)); req.on('end', () => ok(Buffer.concat(p))); });
      const r = await atender(new Request(url, { method: req.method, headers: req.headers, body: corpo }), env, url.pathname.replace(/^\/api/, '') || '/');
      res.writeHead(r.status, Object.fromEntries(r.headers));
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    const rel = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
    const arq = path.join(RAIZ, rel);
    if (!publico(rel) || !fs.existsSync(arq) || !fs.statSync(arq).isFile()) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(arq).pipe(res);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end('Erro interno');
  }
}).listen(PORTA, () => console.log(`Concurso Lab em http://localhost:${PORTA}`));

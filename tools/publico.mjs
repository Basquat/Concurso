// O que é servido como arquivo estático (build da Vercel e servidor local). Tudo fora daqui não é público:
// código do servidor, testes, ferramentas e o banco de questões (entregue só pela API, com controle de acesso).
// Uso: node tools/publico.mjs   → copia para ./public (Output Directory da Vercel)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVOS = new Set(['index.html', 'manifest.webmanifest']);
const PASTAS = ['assets/', 'src/', 'runner/', 'data/'];
const FECHADAS = ['data/questoes/', 'data/questoes-rascunho/'];

export const publico = (rel) => {
  rel = rel.replace(/\\/g, '/').replace(/^\/+/, '');
  return !rel.split('/').includes('..') && (ARQUIVOS.has(rel) || (PASTAS.some((p) => rel.startsWith(p)) && !FECHADAS.some((p) => rel.startsWith(p))));
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const destino = path.join(RAIZ, 'public');
  fs.rmSync(destino, { recursive: true, force: true });
  let n = 0;
  for (const rel of fs.readdirSync(RAIZ, { recursive: true })) {
    const origem = path.join(RAIZ, rel);
    if (!publico(rel) || !fs.statSync(origem).isFile()) continue;
    fs.mkdirSync(path.dirname(path.join(destino, rel)), { recursive: true });
    fs.copyFileSync(origem, path.join(destino, rel));
    n++;
  }
  console.log(`${n} arquivos públicos copiados para public/`);
}

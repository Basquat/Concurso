// Aula em slides: arquivo Markdown com cabeçalho (front matter) e slides separados por linhas "---".
//
// ---
// id: redes-osi-tcpip
// titulo: Modelos OSI e TCP/IP
// area: ti
// disciplina: Redes de computadores
// cargos: 402, 206
// labs: redes, wireshark
// ---
// # Título do slide          ← slide de conteúdo
// ## Título de seção         ← slide divisor de seção
import { blocos } from './markdown.js';

const LISTAS = new Set(['cargos', 'labs', 'tags', 'programas', 'requisitos']);

export function frente(texto) {
  const t = String(texto ?? '').replace(/^﻿/, '');
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!m) return { meta: {}, corpo: t };
  const meta = {};
  for (const l of m[1].split(/\r?\n/)) {
    const k = l.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!k) continue;
    const v = k[2].trim();
    meta[k[1]] = LISTAS.has(k[1]) ? v.split(',').map((x) => x.trim()).filter(Boolean) : /^\d+$/.test(v) ? Number(v) : v;
  }
  return { meta, corpo: t.slice(m[0].length) };
}

function slide(md) {
  const ctx = { notas: [], cartoes: [], quizzes: 0 };
  const linhas = md.split(/\r?\n/);
  const k = linhas.findIndex((l) => l.trim());
  let titulo = '';
  let tipo = 'conteudo';
  const m = linhas[k]?.match(/^(#{1,2})\s+(.*)$/);
  if (m) {
    titulo = m[2].trim();
    linhas.splice(k, 1);
    if (m[1] === '##') tipo = 'secao';
  }
  return { tipo, titulo, html: blocos(linhas, ctx), notas: ctx.notas.join('\n\n'), cartoes: ctx.cartoes, quizzes: ctx.quizzes };
}

export function parseAula(texto) {
  const { meta, corpo } = frente(texto);
  const partes = corpo.split(/^---\s*$/m).map((p) => p.trim()).filter(Boolean);
  const slides = partes.map(slide);
  const cartoes = slides.flatMap((s) => s.cartoes);
  const capa = { tipo: 'capa', titulo: meta.titulo ?? 'Aula', html: '', notas: meta.resumo ?? '' };
  return { meta: { ...meta, slides: slides.filter((s) => s.html || s.titulo).length + 1 }, slides: [capa, ...slides.filter((s) => s.html || s.titulo)], cartoes };
}

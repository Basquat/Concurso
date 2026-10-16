// Markdown do Concurso Lab (subconjunto seguro: todo HTML do autor é escapado).
// Blocos: parágrafos, títulos, listas aninhadas, tabelas, código com realce, citações e destaques
// (> [!dica] / [!atencao] / [!prova] / [!lei] / [!exemplo] / [!definicao] / [!memorize]), diagramas (```mermaid),
// e contêineres ::: colunas (+++ separa), ::: notas (orador), ::: quiz, ::: cartoes (flashcards "frente :: verso").
import { realcar } from './realce.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function inline(t) {
  const codigos = [];
  let s = String(t ?? '').replace(/`([^`]+)`/g, (_, c) => `\u0000${codigos.push(c) - 1}\u0000`);
  s = esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|#\/)[^)\s]+)\)/g, (_, txt, url) => `<a href="${url}"${url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${txt}</a>`)
    .replace(/ {2}$/g, '<br>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, k) => `<code>${esc(codigos[k])}</code>`);
}

const ROTULOS = { nota: 'Nota', dica: 'Dica', atencao: 'Atenção', prova: 'Na prova', lei: 'Texto legal', exemplo: 'Exemplo', definicao: 'Definição', memorize: 'Memorize', resumo: 'Resumo' };
const INICIO_BLOCO = /^(```|:::|#{1,4}\s|>\s?|\s*([-*+]|\d+[.)])\s+|\s*\|)/;

function tabela(linhas) {
  const cel = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  const cab = cel(linhas[0]);
  const alin = cel(linhas[1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : ''));
  const st = (k) => (alin[k] ? ` style="text-align:${alin[k]}"` : '');
  return `<table><thead><tr>${cab.map((c, k) => `<th${st(k)}>${inline(c)}</th>`).join('')}</tr></thead><tbody>${linhas.slice(2).map((l) => `<tr>${cel(l).map((c, k) => `<td${st(k)}>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function listaHtml(itens) {
  if (!itens.length) return '';
  const base = itens[0].ind;
  const tag = itens[0].ord ? 'ol' : 'ul';
  let html = `<${tag}>`;
  let k = 0;
  while (k < itens.length) {
    const it = itens[k];
    const filhos = [];
    let j = k + 1;
    while (j < itens.length && itens[j].ind > base) filhos.push(itens[j++]);
    html += `<li>${inline(it.txt)}${listaHtml(filhos)}</li>`;
    k = j;
  }
  return `${html}</${tag}>`;
}

function quiz(linhas, n) {
  const pergunta = [];
  const alts = [];
  const expl = [];
  for (const l of linhas) {
    let m;
    if ((m = l.match(/^\?\s*(.*)$/))) pergunta.push(m[1]);
    else if ((m = l.match(/^\s*[-*]\s*\[( |x|X)\]\s*(.*)$/))) alts.push({ certa: m[1].toLowerCase() === 'x', txt: m[2] });
    else if ((m = l.match(/^=\s*(.*)$/))) expl.push(m[1]);
    else if (l.trim() && alts.length === 0) pergunta.push(l.trim());
    else if (l.trim()) expl.push(l.trim());
  }
  const letras = 'ABCDEFGH';
  const nome = `qz${n}-${Math.random().toString(36).slice(2, 8)}`;
  return `<div class="quiz-slide" data-quiz="${n}"><p class="forte">${inline(pergunta.join(' '))}</p><ul class="alternativas">${alts.map((a, k) => `<li><label class="alt" data-certa="${a.certa ? 1 : 0}"><input type="radio" name="${nome}"><span class="letra">${letras[k]}</span><span>${inline(a.txt)}</span></label></li>`).join('')}</ul><div class="explicacao" hidden>${inline(expl.join(' '))}</div></div>`;
}

/**
 * Converte linhas Markdown em HTML. ctx coleta notas do orador, cartões e contagem de quizzes.
 * @param {string[]} linhas
 * @param {{ notas: string[], cartoes: {frente: string, verso: string}[], quizzes: number }} ctx
 */
export function blocos(linhas, ctx = { notas: [], cartoes: [], quizzes: 0 }) {
  const out = [];
  let i = 0;
  const n = linhas.length;
  while (i < n) {
    const l = linhas[i];
    if (!l.trim()) { i++; continue; }
    let m = l.match(/^```\s*([\w+#.-]*)\s*$/);
    if (m) {
      const lang = m[1].toLowerCase();
      const corpo = [];
      i++;
      while (i < n && !/^```\s*$/.test(linhas[i])) corpo.push(linhas[i++]);
      i++;
      const codigo = corpo.join('\n');
      out.push(lang === 'mermaid'
        ? `<div class="diagrama" data-mermaid="${esc(codigo)}"><pre class="mini">${esc(codigo)}</pre></div>`
        : `<pre class="codigo" data-lang="${esc(lang)}"><code>${realcar(codigo, lang)}</code></pre>`);
      continue;
    }
    m = l.match(/^:::\s*([\w-]+)\s*(.*)$/);
    if (m) {
      const tipo = m[1].toLowerCase();
      const titulo = m[2];
      const corpo = [];
      let nivel = 1;
      i++;
      while (i < n) {
        if (/^:::\s*[\w-]+/.test(linhas[i])) nivel++;
        else if (/^:::\s*$/.test(linhas[i]) && --nivel === 0) break;
        corpo.push(linhas[i++]);
      }
      i++;
      if (tipo === 'notas') ctx.notas.push(corpo.join('\n').trim());
      else if (tipo === 'cartoes') {
        for (const c of corpo) {
          const [frente, ...verso] = c.split('::');
          if (frente?.trim() && verso.length) ctx.cartoes.push({ frente: frente.trim(), verso: verso.join('::').trim() });
        }
      } else if (tipo === 'quiz') out.push(quiz(corpo, ctx.quizzes++));
      else if (tipo === 'colunas') {
        const cols = [[]];
        corpo.forEach((c) => (/^\+\+\+\s*$/.test(c) ? cols.push([]) : cols.at(-1).push(c)));
        out.push(`<div class="cols ${cols.length === 3 ? 'c3' : ''}">${cols.map((c) => `<div>${blocos(c, ctx)}</div>`).join('')}</div>`);
      } else {
        out.push(`<div class="caixa-${esc(tipo)}">${titulo ? `<h3>${inline(titulo)}</h3>` : ''}${blocos(corpo, ctx)}</div>`);
      }
      continue;
    }
    m = l.match(/^(#{1,4})\s+(.*)$/);
    if (m) {
      const h = Math.min(4, m[1].length + 1);
      out.push(`<h${h}>${inline(m[2])}</h${h}>`);
      i++;
      continue;
    }
    if (/^(\*{3,}|_{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^\s*\|/.test(l) && i + 1 < n && /^\s*\|?\s*:?-{2,}/.test(linhas[i + 1])) {
      const t = [];
      while (i < n && /^\s*\|/.test(linhas[i])) t.push(linhas[i++]);
      out.push(tabela(t));
      continue;
    }
    if (/^>\s?/.test(l)) {
      const q = [];
      while (i < n && /^>\s?/.test(linhas[i])) q.push(linhas[i++].replace(/^>\s?/, ''));
      const tm = q[0]?.match(/^\[!(\w+)\]\s*(.*)$/);
      const tipo = tm ? tm[1].toLowerCase() : '';
      if (tm) q.shift();
      const rot = tm ? `<span class="rot">${esc(ROTULOS[tipo] ?? tipo)}${tm[2] ? ` · ${inline(tm[2])}` : ''}</span>` : '';
      out.push(`<blockquote class="${esc(tipo)}">${rot}${blocos(q, ctx)}</blockquote>`);
      continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
      const itens = [];
      while (i < n) {
        const lm = linhas[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (lm) { itens.push({ ind: lm[1].replace(/\t/g, '  ').length, ord: /\d/.test(lm[2]), txt: lm[3] }); i++; continue; }
        if (/^\s{2,}\S/.test(linhas[i]) && itens.length) { itens.at(-1).txt += ` ${linhas[i].trim()}`; i++; continue; }
        break;
      }
      out.push(listaHtml(itens));
      continue;
    }
    const p = [];
    while (i < n && linhas[i].trim() && !(p.length && INICIO_BLOCO.test(linhas[i]))) p.push(linhas[i++]);
    out.push(`<p>${p.map(inline).join(' ')}</p>`);
  }
  return out.join('\n');
}

export const markdown = (texto, ctx) => blocos(String(texto ?? '').split(/\r?\n/), ctx);

// Texto puro (para busca e leitura em voz alta).
export const textoPuro = (md) => String(md ?? '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*=`|:\-[\]()!+]/g, ' ').replace(/\s+/g, ' ').trim();

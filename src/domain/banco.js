// Banco de questões em formato de texto compacto (data/questoes/*.txt):
//
// @area ti
// @disciplina Redes de computadores
// @aula redes-osi-tcpip
//
// ## redes-001 | Modelo OSI | facil
// Em qual camada do modelo OSI atua o roteador?
// A) Física
// B) Rede *            ← alternativa correta marcada com " *" no fim
// C) ...
// > Explicação (pode ter várias linhas iniciadas por ">").
// @ Referência (norma, lei, manual).
//
// Questões de certo/errado: sem alternativas, com uma linha "= C" ou "= E".

const DIFICULDADES = new Set(['facil', 'media', 'dificil']);

export function parseBanco(texto, origem = '') {
  const linhas = String(texto ?? '').replace(/^﻿/, '').split(/\r?\n/);
  const ctx = { area: '', disciplina: '', aula: '' };
  const questoes = [];
  const erros = [];
  let q = null;

  const fechar = () => {
    if (!q) return;
    q.enunciado = q.enunciado.join('\n').trim();
    q.explicacao = q.explicacao.join(' ').trim();
    if (q.ce != null) { q.tipo = 'ce'; q.alternativas = ['Certo', 'Errado']; q.correta = q.ce === 'C' ? 0 : 1; }
    delete q.ce;
    const problema = !q.enunciado ? 'sem enunciado' : q.alternativas.length < 2 ? 'menos de 2 alternativas' : q.correta < 0 ? 'sem alternativa correta (marque com *)' : null;
    if (problema) erros.push(`${origem}:${q.linha} ${q.id}: ${problema}`);
    else questoes.push(q);
    q = null;
  };

  linhas.forEach((l, k) => {
    let m;
    if ((m = l.match(/^@(area|disciplina|aula)\s+(.*)$/))) { fechar(); ctx[m[1]] = m[2].trim(); return; }
    if ((m = l.match(/^##\s+([\w.-]+)\s*(?:\|\s*(.*))?$/))) {
      fechar();
      const partes = (m[2] ?? '').split('|').map((s) => s.trim());
      const extra = Object.fromEntries(partes.filter((p) => /^\w+:/.test(p)).map((p) => [p.split(':')[0], p.split(':').slice(1).join(':').trim()]));
      const livres = partes.filter((p) => p && !/^\w+:/.test(p));
      q = {
        id: m[1], area: ctx.area, disciplina: ctx.disciplina, aula: extra.aula ?? ctx.aula,
        assunto: livres[0] ?? '', dificuldade: DIFICULDADES.has(livres[1]) ? livres[1] : 'media',
        enunciado: [], alternativas: [], correta: -1, explicacao: [], referencia: '', origem: { tipo: 'autoral' }, linha: k + 1,
      };
      return;
    }
    if (!q) return;
    if ((m = l.match(/^([A-H])\)\s+(.*?)(\s+\*)?\s*$/))) {
      if (m[3]) q.correta = q.alternativas.length;
      q.alternativas.push(m[2]);
      return;
    }
    if ((m = l.match(/^=\s*([CE])\s*$/i))) { q.ce = m[1].toUpperCase(); return; }
    if ((m = l.match(/^>\s?(.*)$/))) { q.explicacao.push(m[1]); return; }
    if ((m = l.match(/^@\s+(.*)$/))) { q.referencia = m[1].trim(); return; }
    if (!q.alternativas.length) q.enunciado.push(l);
  });
  fechar();
  return { questoes, erros };
}

// Serializa no mesmo formato (usado para converter o banco JSON da 1.0).
export function paraTexto(questoes) {
  const out = [];
  let area = null;
  let disc = null;
  for (const q of questoes) {
    if (q.area !== area) { out.push(`@area ${(area = q.area)}`); disc = null; }
    if (q.disciplina !== disc) out.push(`@disciplina ${(disc = q.disciplina)}`, '');
    out.push(`## ${q.id} | ${q.assunto ?? ''} | ${q.dificuldade ?? 'media'}${q.aula ? ` | aula: ${q.aula}` : ''}`);
    out.push(q.enunciado);
    q.alternativas.forEach((a, k) => out.push(`${'ABCDEFGH'[k]}) ${a}${k === q.correta ? ' *' : ''}`));
    if (q.explicacao) out.push(`> ${q.explicacao}`);
    if (q.referencia) out.push(`@ ${q.referencia}`);
    out.push('');
  }
  return out.join('\n');
}

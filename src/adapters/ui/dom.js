// Utilidades de interface compartilhadas pelas telas e laboratórios.
import { ic } from './icones.js';

export { ic };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

// toast('Salvo') · toast('Falhou', { tipo: 'erro' }) · toast(msg, 5000) (forma da 1.0)
export function toast(msg, opcoes = {}) {
  const { tipo = '', ms = 3800 } = typeof opcoes === 'number' ? { ms: opcoes } : opcoes;
  const caixa = $('#toasts');
  if (!caixa) return;
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  el.innerHTML = `${ic({ ok: 'okCirculo', erro: 'alerta', xp: 'estrela' }[tipo] ?? 'info')}<span></span>`;
  el.querySelector('span').textContent = msg;
  caixa.append(el);
  setTimeout(() => el.remove(), ms);
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const barra = (p, cls = '') => `<div class="progresso ${cls}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;

// Anel de progresso em SVG.
export function anel(p, { tam = 92, traco = 9, rotulo = `${p}%`, sub = '' } = {}) {
  const r = (tam - traco) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, p));
  return `<div class="anel" role="img" aria-label="${esc(sub || 'progresso')}: ${v}%"><svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
    <circle class="trilho" cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke-width="${traco}"/>
    <circle class="valor" cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke-width="${traco}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"/></svg>
    <div class="rotulo"><b>${esc(rotulo)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div></div>`;
}

// Mapa de calor das últimas semanas. minutosPorDia: { 'aaaa-mm-dd': n }
export function mapaCalor(minutosPorDia, semanas = 20, hoje = new Date()) {
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicio = new Date(fim);
  inicio.setDate(fim.getDate() - (semanas * 7 - 1) - fim.getDay());
  const cel = [];
  for (const d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    const k = diaIso(d);
    const m = minutosPorDia[k] ?? 0;
    const n = m <= 0 ? 0 : m < 15 ? 1 : m < 45 ? 2 : m < 90 ? 3 : 4;
    cel.push(`<i data-n="${n}" title="${d.toLocaleDateString('pt-BR')}: ${m} min"></i>`);
  }
  return `<div class="calor" role="img" aria-label="Minutos de estudo por dia nas últimas ${semanas} semanas">${cel.join('')}</div>`;
}

export const diaIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Cabeçalho padrão de página.
export const cabecalho = ({ sobre, titulo, texto, voltar, acoes = '' }) => `<header class="cabecalho">
  ${voltar ? `<nav class="trilha-nav" aria-label="Voltar"><a href="${esc(voltar[0])}">${ic('esq')} ${esc(voltar[1])}</a></nav>` : ''}
  <div class="linha entre topo-al"><div style="min-width:0">${sobre ? `<span class="sobretitulo">${esc(sobre)}</span>` : ''}
  <h1>${esc(titulo)}</h1>${texto ? `<p>${texto}</p>` : ''}</div>${acoes ? `<div class="linha">${acoes}</div>` : ''}</div></header>`;

// Dias inteiros até uma data "dd/mm/aaaa" (negativo se já passou).
export function diasAte(ddmmaaaa, hoje = new Date()) {
  const [d, m, a] = ddmmaaaa.split('/').map(Number);
  const alvo = Date.UTC(a, m - 1, d);
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo - base) / 86400000);
}

// Janela modal com <dialog> nativo (foco preso, Esc fecha). Devolve { el, fechar, pronto } onde pronto resolve
// com o valor passado a fechar(valor).
export function modal({ titulo, corpo, rodape = '', larga = false, classe = '' }) {
  const d = document.createElement('dialog');
  d.className = `modal ${larga ? 'larga' : ''} ${classe}`;
  d.innerHTML = `${titulo != null ? `<div class="modal-cab"><h2>${esc(titulo)}</h2><button class="btn fantasma icone peq" type="button" data-fechar aria-label="Fechar">${ic('x')}</button></div>` : ''}
    <div class="modal-corpo">${corpo}</div>${rodape ? `<div class="modal-rodape">${rodape}</div>` : ''}`;
  document.body.append(d);
  let resolver;
  const pronto = new Promise((ok) => { resolver = ok; });
  let valor;
  const fechar = (v) => { valor = v; d.close(); };
  d.addEventListener('close', () => { d.remove(); resolver(valor); });
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-fechar]')) fechar(); });
  d.showModal();
  return { el: d, fechar, pronto };
}

// Pergunta um valor numa janela (substitui prompt()). Resolve com a string digitada ou undefined.
export function pedir({ titulo, rotulo, valor = '', tipo = 'text', min, max, ajuda = '' }) {
  const id = `fp${Math.random().toString(36).slice(2, 7)}`;
  const m = modal({ titulo, corpo: `<form class="pilha" id="${id}"><label class="campo">${esc(rotulo)}<input name="v" type="${tipo}" value="${esc(valor)}" ${min != null ? `min="${min}"` : ''} ${max != null ? `max="${max}"` : ''} required></label>${ajuda ? `<p class="mini sutil mb0">${esc(ajuda)}</p>` : ''}</form>`, rodape: `<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn primario" form="${id}">OK</button>` });
  const f = m.el.querySelector('form');
  f.addEventListener('submit', (e) => { e.preventDefault(); m.fechar(String(new FormData(f).get('v'))); });
  f.querySelector('input').focus();
  f.querySelector('input').select?.();
  return m.pronto;
}

export function confirmar(texto,{ titulo = 'Confirmar', sim = 'Confirmar', perigo = false } = {}) {
  const m = modal({ titulo, corpo: `<p class="mb0">${esc(texto)}</p>`, rodape: `<button class="btn" data-fechar>Cancelar</button><button class="btn ${perigo ? 'perigo cheio' : 'primario'}" data-sim>${esc(sim)}</button>` });
  m.el.querySelector('[data-sim]').addEventListener('click', () => m.fechar(true));
  m.el.querySelector('[data-sim]').focus();
  return m.pronto.then((v) => v === true);
}

// Gráfico de barras em SVG (sem bibliotecas). itens: [{ rotulo, valor }]
export function graficoBarras(itens, { formato = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }), altura = 220 } = {}) {
  if (!itens.length) return '<p class="muted">Sem dados para o gráfico.</p>';
  const L = 640;
  const margem = { t: 18, b: 46, l: 8, r: 8 };
  const max = Math.max(...itens.map((i) => Math.abs(Number(i.valor) || 0)), 1);
  const larg = (L - margem.l - margem.r) / itens.length;
  const h = altura - margem.t - margem.b;
  const barras = itens.map((it, i) => {
    const v = Number(it.valor) || 0;
    const bh = (Math.abs(v) / max) * h;
    const x = margem.l + i * larg + larg * 0.15;
    const y = margem.t + h - bh;
    const rot = String(it.rotulo);
    return `<rect class="b" x="${x}" y="${y}" width="${larg * 0.7}" height="${bh}" rx="3" ${it.cor ? `style="fill:${esc(it.cor)}"` : ''}><title>${esc(rot)}: ${esc(formato(v))}</title></rect>
      <text class="valor" x="${x + larg * 0.35}" y="${y - 4}" text-anchor="middle">${esc(formato(v))}</text>
      <text x="${x + larg * 0.35}" y="${altura - 30}" text-anchor="middle">${esc(rot.length > 14 ? rot.slice(0, 13) + '…' : rot)}</text>`;
  }).join('');
  return `<div class="grafico"><svg viewBox="0 0 ${L} ${altura}" role="img" aria-label="Gráfico de barras">${barras}</svg></div>`;
}

export function graficoLinha(itens, { formato = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), altura = 220, max: maxFixo } = {}) {
  if (!itens.length) return '<p class="muted">Sem dados para o gráfico.</p>';
  const L = 640;
  const m = { t: 20, b: 40, l: 16, r: 16 };
  const max = maxFixo ?? Math.max(...itens.map((i) => Number(i.valor) || 0), 1);
  const passo = itens.length > 1 ? (L - m.l - m.r) / (itens.length - 1) : 0;
  const pts = itens.map((it, i) => [m.l + i * passo, m.t + (altura - m.t - m.b) * (1 - (Number(it.valor) || 0) / max)]);
  return `<div class="grafico"><svg viewBox="0 0 ${L} ${altura}" role="img" aria-label="Gráfico de linha">
    <polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="var(--prim)" stroke-width="2.5"/>
    ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--prim)"><title>${esc(itens[i].rotulo)}: ${esc(formato(itens[i].valor ?? 0))}</title></circle>
      <text class="valor" x="${x}" y="${y - 8}" text-anchor="middle">${esc(formato(itens[i].valor ?? 0))}</text>
      <text x="${x}" y="${altura - 18}" text-anchor="middle">${esc(itens[i].rotulo)}</text>`).join('')}
  </svg></div>`;
}

export function baixarArquivo(nome, conteudo, tipo = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo }));
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Lê um arquivo escolhido pela pessoa (texto).
export function escolherArquivo(aceitar = '') {
  return new Promise((ok) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = aceitar;
    i.onchange = () => { const f = i.files?.[0]; if (!f) return ok(null); f.text().then((texto) => ok({ nome: f.name, texto })); };
    i.click();
  });
}

export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast('Copiado.', { tipo: 'ok', ms: 1800 }); } catch { toast('Não foi possível copiar automaticamente.'); }
}

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

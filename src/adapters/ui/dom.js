// Utilidades de interface compartilhadas pelas telas.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export function toast(msg, ms = 3500) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), ms);
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const barra = (p) => `<div class="progresso" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;

// Cabeçalho padrão de página.
export const cabecalho = ({ sobre, titulo, texto, voltar }) => `<header class="cabecalho">
  ${voltar ? `<div class="trilha-nav"><a href="${esc(voltar[0])}">${esc(voltar[1])}</a></div>` : ''}
  ${sobre ? `<span class="sobretitulo">${esc(sobre)}</span>` : ''}
  <h1>${esc(titulo)}</h1>${texto ? `<p>${texto}</p>` : ''}</header>`;

// Dias inteiros até uma data "dd/mm/aaaa" (negativo se já passou).
export function diasAte(ddmmaaaa, hoje = new Date()) {
  const [d, m, a] = ddmmaaaa.split('/').map(Number);
  const alvo = Date.UTC(a, m - 1, d);
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo - base) / 86400000);
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
    return `<rect class="b" x="${x}" y="${y}" width="${larg * 0.7}" height="${bh}"><title>${esc(rot)}: ${esc(formato(v))}</title></rect>
      <text class="valor" x="${x + larg * 0.35}" y="${y - 4}" text-anchor="middle">${esc(formato(v))}</text>
      <text x="${x + larg * 0.35}" y="${altura - 30}" text-anchor="middle">${esc(rot.length > 14 ? rot.slice(0, 13) + '…' : rot)}</text>`;
  }).join('');
  return `<div class="grafico"><svg viewBox="0 0 ${L} ${altura}" role="img" aria-label="Gráfico de barras">${barras}</svg></div>`;
}

export function graficoLinha(itens, { formato = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), altura = 220 } = {}) {
  if (!itens.length) return '<p class="muted">Sem dados para o gráfico.</p>';
  const L = 640;
  const m = { t: 20, b: 40, l: 16, r: 16 };
  const max = Math.max(...itens.map((i) => Number(i.valor) || 0), 1);
  const passo = itens.length > 1 ? (L - m.l - m.r) / (itens.length - 1) : 0;
  const pts = itens.map((it, i) => [m.l + i * passo, m.t + (altura - m.t - m.b) * (1 - (Number(it.valor) || 0) / max)]);
  return `<div class="grafico"><svg viewBox="0 0 ${L} ${altura}" role="img" aria-label="Gráfico de linha">
    <polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
    ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"><title>${esc(itens[i].rotulo)}: ${esc(formato(itens[i].valor ?? 0))}</title></circle>
      <text class="valor" x="${x}" y="${y - 8}" text-anchor="middle">${esc(formato(itens[i].valor ?? 0))}</text>
      <text x="${x}" y="${altura - 18}" text-anchor="middle">${esc(itens[i].rotulo)}</text>`).join('')}
  </svg></div>`;
}

export function baixarArquivo(nome, conteudo, tipo = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Redação no formato do edital UFBA 2026: dissertativo-argumentativo, 20 a 30 linhas, 4 critérios × 15 pontos.
import { esc, ic, toast } from '../dom.js';

const TEMAS = [
  'O uso da inteligência artificial nos serviços públicos brasileiros',
  'Desafios da permanência estudantil nas universidades públicas',
  'Transparência pública e combate à desinformação',
  'Inclusão digital como condição para a cidadania',
  'Saúde mental no ambiente de trabalho do servidor público',
  'Proteção de dados pessoais em tempos de serviços digitais',
];
const CRITERIOS = ['Tema, informatividade e argumentação', 'Norma padrão da Língua Portuguesa', 'Coerência e coesão', 'Tipologia dissertativa e vocabulário'];
const CONECTIVOS = ['além disso', 'portanto', 'entretanto', 'contudo', 'dessa forma', 'por conseguinte', 'nesse sentido', 'todavia', 'ademais', 'assim', 'visto que', 'logo'];
const CPL = 75; // caracteres por linha da folha (aproximação)

export function analisar(texto) {
  const paragrafos = texto.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const linhas = paragrafos.reduce((s, p) => s + Math.max(1, Math.ceil(p.length / CPL)), 0);
  const baixo = texto.toLowerCase();
  const conectivos = CONECTIVOS.filter((c) => baixo.includes(c));
  const avisos = [];
  if (linhas < 20) avisos.push(`Texto com ~${linhas} linhas: o mínimo é 20 (perde pontos).`);
  if (linhas > 30) avisos.push(`~${linhas} linhas: o que passar de 30 é desconsiderado.`);
  if (paragrafos.length < 4) avisos.push('Use ao menos 4 parágrafos: introdução, 2 de desenvolvimento e conclusão.');
  if (conectivos.length < 3) avisos.push('Poucos conectivos: articule as ideias (além disso, portanto, contudo...).');
  if (/\b(eu|meu|minha)\b/i.test(texto)) avisos.push('Evite 1ª pessoa do singular na dissertação.');
  if (/\b(vc|pq|tb|né)\b/i.test(texto)) avisos.push('Evite abreviações e marcas de oralidade.');
  if (/\ba (ele|ela|eles|elas)\b/i.test(texto) === false && /\bà (ele|eles|um|uma)\b/i.test(texto)) avisos.push('Crase indevida antes de pronome masculino/artigo indefinido.');
  if (/\b(nome|assinatura)\s*:/i.test(texto)) avisos.push('Não se identifique: nome ou assinatura zeram a redação.');
  return { linhas, paragrafos: paragrafos.length, palavras: (texto.match(/\S+/g) ?? []).length, conectivos, avisos };
}

export default async function redacao(el, ctx, kit) {
  const st = kit.estado.carregar() ?? { tema: TEMAS[0], texto: '', entregas: [] };
  const salvar = () => kit.estado.salvar(st);
  const missoes = kit.missoes([
    { id: 'primeira', titulo: 'Primeira redação completa', descricao: 'Entregue um texto entre 20 e 30 linhas.', xp: 40, checar: (s) => s.entregas.some((e) => e.linhas >= 20 && e.linhas <= 30) },
    { id: 'estrutura', titulo: 'Estrutura clássica', descricao: 'Entregue um texto com 4 ou mais parágrafos e 3+ conectivos.', xp: 40, checar: (s) => s.entregas.some((e) => e.paragrafos >= 4 && e.conectivos >= 3) },
    { id: 'aprovado', titulo: 'Acima do corte', descricao: 'Autoavalie uma redação com 30 pontos ou mais (mínimo do edital).', xp: 50, checar: (s) => s.entregas.some((e) => e.nota >= 30) },
    { id: 'tres', titulo: 'Constância', descricao: 'Entregue 3 redações.', xp: 60, checar: (s) => s.entregas.length >= 3 },
  ]);
  kit.teoria(`**Edital UFBA 2026, item 13:** tipologia **dissertação**; **20 a 30 linhas**; 60 pontos (mínimo 30); nota zero por fuga ao tema, tipologia errada, identificação ou texto ilegível.

**Estrutura:** introdução com tese → 2 parágrafos de argumento (dado, exemplo, causa/consequência) → conclusão retomando a tese, com proposta.

| Critério | Pontos |
|---|---|
| ${CRITERIOS.join(' | 15 |\n| ')} | 15 |`);
  let inicio = Date.now();

  const render = () => {
    const a = analisar(st.texto);
    el.innerHTML = `<div class="split">
      <div class="pilha">
        <div class="card"><label class="campo">Tema<select id="tema">${TEMAS.map((t) => `<option ${t === st.tema ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label></div>
        <textarea id="texto" rows="24" style="font-family:Georgia,serif;font-size:1.05rem;line-height:1.9;background-image:repeating-linear-gradient(transparent 0 1.85em, var(--borda) 1.85em 1.9em)" placeholder="Escreva sua dissertação aqui...">${esc(st.texto)}</textarea>
        <div class="linha"><button class="btn primario" type="button" id="entregar">${ic('ok')} Entregar e autoavaliar</button><span class="mini sutil" id="tempo"></span></div>
      </div>
      <aside class="pilha">
        <div class="card"><div class="grade-2"><div><div class="contagem" style="font-size:1.8rem;color:${a.linhas < 20 || a.linhas > 30 ? 'var(--erro)' : 'var(--ok)'}">${a.linhas}</div><div class="mini sutil">linhas (20–30)</div></div><div><div class="contagem" style="font-size:1.8rem">${a.palavras}</div><div class="mini sutil">palavras · ${a.paragrafos} parágrafos</div></div></div></div>
        <div class="card"><h3 class="mt0">Revisão automática</h3>${a.avisos.length ? `<ul class="pequeno">${a.avisos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="ok pequeno">Nenhum problema estrutural encontrado.</p>'}<p class="mini sutil mb0">Conectivos: ${a.conectivos.map(esc).join(', ') || 'nenhum'}</p></div>
        <div class="card"><h3 class="mt0">Entregas</h3>${st.entregas.length ? st.entregas.slice(-5).reverse().map((e) => `<div class="linha entre pequeno"><span>${esc(e.data)} · ${e.linhas} linhas</span><strong>${e.nota}/60</strong></div>`).join('') : '<p class="muted pequeno mb0">Nenhuma ainda.</p>'}</div>
      </aside></div>`;
    const ta = el.querySelector('#texto');
    let t;
    ta.addEventListener('input', () => { st.texto = ta.value; clearTimeout(t); t = setTimeout(() => { salvar(); const pos = ta.selectionStart; render(); const n = el.querySelector('#texto'); n.focus(); n.setSelectionRange(pos, pos); }, 700); });
    el.querySelector('#tema').onchange = (e) => { st.tema = e.target.value; salvar(); };
    el.querySelector('#entregar').onclick = () => {
      if (a.palavras < 30) return toast('Escreva o texto antes de entregar.', { tipo: 'erro' });
      const corpo = `<p class="pequeno muted">Dê de 0 a 15 em cada critério do edital, com honestidade. A revisão automática ajuda nos critérios 2 a 4.</p>${CRITERIOS.map((c, k) => `<label class="campo">${esc(c)}<input type="range" min="0" max="15" value="${a.avisos.length ? 9 : 12}" data-c="${k}"></label>`).join('')}<p>Total: <strong id="tot"></strong>/60</p>`;
      const m = document.createElement('dialog');
      m.className = 'modal';
      m.innerHTML = `<div class="modal-cab"><h2>Autoavaliação</h2></div><div class="modal-corpo">${corpo}</div><div class="modal-rodape"><button class="btn primario" type="button">Registrar</button></div>`;
      document.body.append(m);
      const tot = () => [...m.querySelectorAll('[data-c]')].reduce((s, r) => s + Number(r.value), 0);
      const pinta = () => { m.querySelector('#tot').textContent = tot(); };
      m.querySelectorAll('[data-c]').forEach((r) => r.addEventListener('input', pinta));
      pinta();
      m.showModal();
      m.querySelector('.modal-rodape button').onclick = () => {
        st.entregas.push({ data: new Date().toLocaleDateString('pt-BR'), tema: st.tema, linhas: a.linhas, paragrafos: a.paragrafos, conectivos: a.conectivos.length, nota: tot(), min: Math.round((Date.now() - inicio) / 60000) });
        salvar();
        m.close(); m.remove();
        missoes.verificar(st);
        toast(tot() >= 30 ? 'Acima do mínimo do edital!' : 'Abaixo de 30: revise argumentação e norma.', { tipo: tot() >= 30 ? 'ok' : 'erro' });
        render();
      };
    };
    el.querySelector('#tempo').textContent = `Tempo de escrita: ${Math.round((Date.now() - inicio) / 60000)} min`;
  };
  kit.aoReiniciar(() => { st.texto = ''; inicio = Date.now(); salvar(); render(); }, 'Apagar o texto atual (as entregas continuam)?');
  render();
}

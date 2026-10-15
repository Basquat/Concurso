import { esc, cabecalho, toast } from '../dom.js';
import { LABS } from '../labs/registro.js';

// Aceita links youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ ou o próprio ID (11 caracteres).
export const idYoutube = (s) => (String(s).trim().match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) ?? String(s).trim().match(/^([\w-]{11})$/))?.[1] ?? null;

const CANAIS = ['', 'Gran Concursos', 'Estratégia Concursos', 'Bóson Treinamentos', 'Curso em Vídeo'];

export default async function aula(el, { conteudo, labs }, { args: [id] }) {
  const [{ aulas }, questoes] = await Promise.all([fetch('data/aulas.json').then((r) => r.json()), conteudo.questoes()]);
  const a = aulas.find((x) => x.id === id);
  if (!a) { el.innerHTML = cabecalho({ titulo: 'Aula não encontrada', voltar: ['#/aulas', 'Aulas'] }); return; }
  const qs = questoes.filter((q) => q.area === a.area && q.disciplina === a.disciplina);
  let i = 0;
  let aba = 'slides';
  const videos = () => labs.carregar(`aula:${a.id}`) ?? [];

  const corpo = () => {
    if (aba === 'slides') {
      const s = a.slides[i];
      return `<div class="slide" tabindex="0" aria-label="Slide ${i + 1} de ${a.slides.length}">
        <span class="slide-num">${i + 1} / ${a.slides.length}</span><h2>${esc(s.t)}</h2><ul>${s.p.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="linha entre" style="margin-top:10px"><button class="btn" data-ant ${i ? '' : 'disabled'}>Anterior</button>
        <div class="slide-pontos">${a.slides.map((_, k) => `<button aria-label="Slide ${k + 1}" class="${k === i ? 'ativo' : ''}" data-ir="${k}"></button>`).join('')}</div>
        <span class="linha"><button class="btn" data-tela>Tela cheia</button><button class="btn primario" data-prox ${i < a.slides.length - 1 ? '' : 'disabled'}>Próximo</button></span></div>
        <p class="pequeno muted">Setas do teclado navegam entre os slides.</p>`;
    }
    if (aba === 'videos') {
      const v = videos();
      return `<form class="linha" data-add><input name="url" placeholder="Cole o link de um vídeo do YouTube" style="flex:1;min-width:220px" required><input name="titulo" placeholder="Título (opcional)" maxlength="120"><button class="btn primario">Adicionar</button></form>
        <p class="pequeno muted">Os vídeos tocam aqui no modo de privacidade do YouTube (youtube-nocookie) e ficam salvos na sua conta neste navegador.</p>
        ${v.length ? v.map((x, k) => `<div class="card"><div class="linha entre"><strong>${esc(x.titulo || `Vídeo ${k + 1}`)}</strong><span class="linha"><a class="btn peq" href="https://www.youtube.com/watch?v=${x.id}" target="_blank" rel="noopener">Abrir no YouTube</a><button class="btn peq perigo" data-rm="${k}">Remover</button></span></div>
          <div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${x.id}" title="${esc(x.titulo || 'Vídeo')}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>`).join('') : '<p class="muted">Nenhum vídeo adicionado ainda. Use as buscas abaixo, copie o link e cole acima.</p>'}
        <h3>Buscar videoaulas sobre o tema</h3><div class="linha">${CANAIS.map((c) => `<a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${a.busca} ${c}`.trim())}">${c || 'Busca geral'}</a>`).join('')}</div>`;
    }
    if (aba === 'questoes') return qs.length ? `<p>${qs.length} questão(ões) de ${esc(a.disciplina)}.</p><a class="btn primario" href="#/questoes?area=${a.area}&disciplina=${encodeURIComponent(a.disciplina)}">Praticar agora</a>` : '<p class="muted">Ainda sem questões desta disciplina.</p>';
    return a.labs.length ? `<div class="grid">${a.labs.map((l) => `<a class="card" href="#/lab/${l}"><h3>${esc(LABS[l]?.nome ?? l)}</h3><p class="pequeno muted">${esc(LABS[l]?.resumo ?? '')}</p></a>`).join('')}</div>` : '<p class="muted">Tema teórico: pratique com questões.</p>';
  };

  const render = () => {
    el.innerHTML = `<div class="conteudo">${cabecalho({ voltar: ['#/aulas', 'Aulas'], sobre: a.disciplina, titulo: a.titulo })}
      <div class="abas" role="tablist">${[['slides', 'Slides'], ['videos', 'Videoaulas'], ['questoes', `Questões (${qs.length})`], ['pratica', 'Prática']].map(([k, n]) => `<button role="tab" aria-selected="${k === aba}" class="${k === aba ? 'ativa' : ''}" data-aba="${k}">${n}</button>`).join('')}</div>
      <div class="aba-corpo">${corpo()}</div></div>`;
    el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; render(); }));
    el.querySelector('[data-ant]')?.addEventListener('click', () => { i--; render(); });
    el.querySelector('[data-prox]')?.addEventListener('click', () => { i++; render(); });
    el.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { i = Number(b.dataset.ir); render(); }));
    el.querySelector('[data-tela]')?.addEventListener('click', () => el.querySelector('.slide').requestFullscreen?.());
    el.querySelector('[data-add]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const vid = idYoutube(f.get('url'));
      if (!vid) { toast('Link do YouTube não reconhecido.'); return; }
      labs.salvar(`aula:${a.id}`, [...videos(), { id: vid, titulo: String(f.get('titulo') || '').slice(0, 120) }]);
      render();
    });
    el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { const v = videos(); v.splice(Number(b.dataset.rm), 1); labs.salvar(`aula:${a.id}`, v); render(); }));
  };
  const teclas = (e) => {
    if (aba !== 'slides' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowRight' && i < a.slides.length - 1) { i++; render(); }
    if (e.key === 'ArrowLeft' && i > 0) { i--; render(); }
  };
  addEventListener('keydown', teclas);
  render();
  return () => removeEventListener('keydown', teclas);
}

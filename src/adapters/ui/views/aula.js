// Aula: slides 16:9 (apresentação, miniaturas, notas do orador, tela cheia, impressão), modo leitura,
// questões da aula, flashcards com revisão espaçada, laboratórios, videoaulas e anotações.
import { esc, ic, cabecalho, toast, barra, pct } from '../dom.js';
import { parseAula } from '../../../domain/aula.js';
import { AREAS } from '../../../domain/areas.js';
import { renderizarDiagramas } from '../cdn.js';
import { LABS } from '../labs/registro.js';
import { praticar } from '../componentes/questao.js';
import { NOTAS } from '../../../domain/srs.js';

export const idYoutube = (s) => (String(s).trim().match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) ?? String(s).trim().match(/^([\w-]{11})$/))?.[1] ?? null;
const CANAIS = ['', 'Gran Concursos', 'Estratégia Concursos', 'Bóson Treinamentos', 'Curso em Vídeo'];

function htmlSlide(s, meta, i, total) {
  const cor = AREAS[meta.area]?.cor ?? 'var(--prim)';
  if (s.tipo === 'capa') {
    return `<div class="slide s-capa" style="--cor-aula:${cor}"><span class="sobretitulo" style="font-size:1.4cqw">${esc(meta.disciplina ?? '')}</span>
      <h1>${esc(meta.titulo)}</h1>${meta.resumo ? `<p class="sub">${esc(meta.resumo)}</p>` : ''}
      <div class="meta"><span>${total} slides</span><span>~${meta.duracao ?? total * 2} min</span>${(meta.cargos ?? []).length ? `<span>Cargos: ${esc(meta.cargos.join(', '))}</span>` : ''}</div>
      <div class="rodape-slide"><span>Concurso Lab</span><span>${i + 1} / ${total}</span></div></div>`;
  }
  if (s.tipo === 'secao') {
    return `<div class="slide s-secao" style="--cor-aula:${cor}"><h2>${esc(s.titulo)}</h2><div class="corpo">${s.html}</div><div class="rodape-slide" style="color:rgb(255 255 255 / .7)"><span>${esc(meta.titulo)}</span><span>${i + 1} / ${total}</span></div></div>`;
  }
  return `<div class="slide" style="--cor-aula:${cor}">${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ''}<div class="corpo">${s.html}</div>
    <div class="rodape-slide"><span>${esc(meta.titulo)}</span><span>${i + 1} / ${total}</span></div></div>`;
}

// Reduz a fonte do slide até o conteúdo caber (sem rolagem dentro do slide).
function ajustar(palco) {
  const slide = palco.querySelector('.slide');
  const corpo = slide?.querySelector('.corpo');
  if (!corpo) return;
  let escala = 1;
  slide.style.fontSize = '';
  while (corpo.scrollHeight > corpo.clientHeight + 2 && escala > 0.62) {
    escala -= 0.04;
    slide.style.fontSize = `calc(2.05cqw * ${escala})`;
  }
}

function ligarQuizzes(raiz) {
  raiz.querySelectorAll('.quiz-slide').forEach((qz) => {
    qz.querySelectorAll('label.alt').forEach((lb) => lb.addEventListener('click', () => {
      if (qz.dataset.respondido) return;
      qz.dataset.respondido = '1';
      qz.querySelectorAll('label.alt').forEach((x) => { if (x.dataset.certa === '1') x.classList.add('certa'); });
      if (lb.dataset.certa !== '1') lb.classList.add('errada');
      qz.querySelector('.explicacao').hidden = false;
      qz.querySelectorAll('input').forEach((x) => { x.disabled = true; });
    }));
  });
}

export default async function aula(el, ctx, { args: [id], params }) {
  const { conteudo, servico, sessao, labs, casca } = ctx;
  let texto;
  try { texto = await conteudo.aula(id); } catch {
    el.innerHTML = cabecalho({ titulo: 'Aula não encontrada', voltar: ['#/aulas', 'Aulas'] }) + '<p>Ela pode ter sido renomeada. <a href="#/aulas">Ver todas as aulas</a>.</p>';
    return;
  }
  const { meta, slides, cartoes } = parseAula(texto);
  meta.id = id;
  casca?.definirTitulo(meta.titulo);
  const area = AREAS[meta.area];
  const todas = await conteudo.questoes().catch(() => []);
  const qs = todas.filter((q) => q.aula === id);
  const qsDisc = qs.length ? qs : todas.filter((q) => q.area === meta.area && q.disciplina === meta.disciplina);
  const total = slides.length;
  const progresso = () => servico.progresso.aulas?.[id] ?? { visto: 0 };
  let i = Math.min(Number(params.get('s') ?? Math.max(0, Math.min(progresso().visto, total) - 1)) || 0, total - 1);
  let aba = params.get('aba') ?? 'slides';
  let grade = false;
  let notasVisiveis = false;

  const abas = [['slides', 'slides', 'Slides'], ['leitura', 'livro', 'Leitura'], ['questoes', 'questoes', `Questões (${qsDisc.length})`], ['cartoes', 'cartoes', `Flashcards (${cartoes.length})`], ['pratica', 'frasco', 'Prática'], ['videos', 'play', 'Vídeos'], ['notas', 'redacao', 'Anotações']];

  el.innerHTML = `${cabecalho({
    voltar: ['#/aulas', 'Aulas'], sobre: `${area?.curto ?? ''} · ${meta.disciplina ?? ''}`, titulo: meta.titulo, texto: esc(meta.resumo ?? ''),
    acoes: `<button class="btn" type="button" data-imprimir>${ic('impressora')} PDF / imprimir</button><button class="btn primario" type="button" data-apresentar>${ic('tela')} Apresentar</button>`,
  })}
    <div class="linha mb2 pequeno muted" id="estadoAula"></div>
    <div class="abas" role="tablist">${abas.map(([k, icone, nome]) => `<button role="tab" type="button" data-aba="${k}" aria-selected="${k === aba}">${ic(icone)} ${esc(nome)}</button>`).join('')}</div>
    <div class="aba-corpo" id="corpoAula"></div>`;
  const corpo = el.querySelector('#corpoAula');

  const estado = () => {
    const p = progresso();
    el.querySelector('#estadoAula').innerHTML = `<span style="min-width:160px;flex:0 0 180px">${barra(pct(Math.min(p.visto, total), total), p.concluida ? 'ok' : '')}</span>
      <span>${p.concluida ? `${ic('okCirculo')} Aula concluída em ${new Date(`${p.concluida}T12:00`).toLocaleDateString('pt-BR')}` : `${Math.min(p.visto, total)} de ${total} slides vistos`}</span>
      ${(meta.labs ?? []).length ? `<span>· prática: ${meta.labs.map((l) => `<a href="#/lab/${esc(l)}">${esc(LABS[l]?.nome ?? l)}</a>`).join(', ')}</span>` : ''}`;
  };

  function mostrarSlide() {
    const palco = corpo.querySelector('#palco');
    palco.innerHTML = htmlSlide(slides[i], meta, i, total);
    corpo.querySelector('#contSlide').textContent = `${i + 1} / ${total}`;
    corpo.querySelector('.barra-slides span').style.width = `${((i + 1) / total) * 100}%`;
    corpo.querySelector('[data-ant]').disabled = i === 0;
    corpo.querySelector('[data-prox]').disabled = i === total - 1;
    const notas = corpo.querySelector('#notasOrador');
    notas.hidden = !notasVisiveis;
    notas.innerHTML = slides[i].notas ? `<strong>${ic('info')} Notas</strong><p class="mb0">${esc(slides[i].notas)}</p>` : '<span class="muted">Sem notas neste slide.</span>';
    ligarQuizzes(palco);
    ajustar(palco);
    renderizarDiagramas(palco).then(() => ajustar(palco));
    if (servico.registrarAula(id, { visto: i, total })) toast(`Aula concluída! +20 XP`, { tipo: 'xp' });
    estado();
    history.replaceState(null, '', `#/aulas/${id}?s=${i}`);
  }

  function irPara(n) { i = Math.max(0, Math.min(total - 1, n)); if (grade) { grade = false; desenhar(); } else mostrarSlide(); }

  function desenhar() {
    corpo.innerHTML = '';
    if (aba === 'slides') {
      if (grade) {
        corpo.innerHTML = `<div class="linha entre mb2"><strong>${total} slides</strong><button class="btn" type="button" data-grade>${ic('slides')} Voltar à apresentação</button></div>
          <div class="miniaturas">${slides.map((s, k) => `<button type="button" data-ir="${k}" class="${k === i ? 'atual' : ''}"><div class="palco">${htmlSlide(s, meta, k, total)}</div><div class="num">${k + 1}. ${esc(s.titulo || (s.tipo === 'capa' ? 'Capa' : ''))}</div></button>`).join('')}</div>`;
        corpo.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => irPara(Number(b.dataset.ir))));
        corpo.querySelector('[data-grade]').onclick = () => { grade = false; desenhar(); };
        renderizarDiagramas(corpo);
        return;
      }
      corpo.innerHTML = `<div class="palco-caixa" id="caixaPalco"><div class="palco" id="palco" tabindex="0" aria-live="polite" aria-label="Slide"></div>
        <div class="barra-slides"><span></span></div>
        <div class="controles-slide">
          <div class="linha"><button class="btn" type="button" data-ant>${ic('esq')} Anterior</button><span class="contador-slide" id="contSlide"></span><button class="btn primario" type="button" data-prox>Próximo ${ic('dir')}</button></div>
          <div class="linha"><button class="btn fantasma" type="button" data-grade title="Miniaturas (G)">${ic('grade')}</button><button class="btn fantasma" type="button" data-notas title="Notas do orador (N)">${ic('info')} Notas</button><button class="btn fantasma" type="button" data-tela title="Tela cheia (F)">${ic('tela')}</button></div>
        </div></div>
        <div class="notas-orador" id="notasOrador" hidden></div>
        <p class="mini sutil mt1">Teclado: ← → navegam · F tela cheia · G miniaturas · N notas. No celular, deslize o slide.</p>`;
      corpo.querySelector('[data-ant]').onclick = () => irPara(i - 1);
      corpo.querySelector('[data-prox]').onclick = () => irPara(i + 1);
      corpo.querySelector('[data-grade]').onclick = () => { grade = true; desenhar(); };
      corpo.querySelector('[data-notas]').onclick = () => { notasVisiveis = !notasVisiveis; corpo.querySelector('#notasOrador').hidden = !notasVisiveis; };
      corpo.querySelector('[data-tela]').onclick = telaCheia;
      // Deslizar no celular.
      const palco = corpo.querySelector('#palco');
      let x0 = null;
      palco.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
      palco.addEventListener('pointerup', (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 50) irPara(i + (e.clientX < x0 ? 1 : -1)); x0 = null; });
      mostrarSlide();
      return;
    }
    if (aba === 'leitura') {
      corpo.innerHTML = `<div class="leitura">${slides.filter((s) => s.tipo !== 'capa').map((s) => `<section>${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ''}${s.html}${s.notas ? `<p class="mini sutil">${esc(s.notas)}</p>` : ''}</section>`).join('')}</div>`;
      ligarQuizzes(corpo);
      renderizarDiagramas(corpo);
      return;
    }
    if (aba === 'questoes') {
      if (!qsDisc.length) { corpo.innerHTML = '<div class="vazio">Ainda não há questões para esta aula.</div>'; return; }
      let k = 0;
      const ordem = [...qsDisc].sort((a, b) => (servico.progresso.respostas[a.id] ? 1 : 0) - (servico.progresso.respostas[b.id] ? 1 : 0));
      const proxima = () => {
        if (k >= ordem.length) {
          corpo.innerHTML = `<div class="vazio">${ic('trofeu')}<p>Você passou por todas as ${ordem.length} questões desta aula.</p><a class="btn primario" href="#/questoes?area=${esc(meta.area)}&disciplina=${encodeURIComponent(meta.disciplina ?? '')}">Mais questões da disciplina</a></div>`;
          return;
        }
        praticar(corpo, ordem[k], { servico, numero: k + 1, total: ordem.length, aoProxima: () => { k++; proxima(); } });
      };
      proxima();
      return;
    }
    if (aba === 'cartoes') {
      if (!cartoes.length) { corpo.innerHTML = '<div class="vazio">Esta aula ainda não tem flashcards.</div>'; return; }
      let k = 0;
      const mostrar = () => {
        const c = cartoes[k];
        const idc = `f:${id}:${k}`;
        const srs = servico.revisoes[idc];
        corpo.innerHTML = `<div class="linha entre mb2"><span class="tag prim">Cartão ${k + 1} de ${cartoes.length}</span><span class="mini sutil">${srs ? `Próxima revisão: ${new Date(`${srs.v}T12:00`).toLocaleDateString('pt-BR')}` : 'Cartão novo'}</span></div>
          <div class="flashcard-caixa flashcard" tabindex="0" role="button" aria-label="Virar cartão"><div class="face frente">${esc(c.frente)}</div><div class="face verso">${esc(c.verso)}</div></div>
          <p class="mini sutil centro mt1">Clique ou pressione Espaço para virar.</p>
          <div class="linha centro mt2" style="justify-content:center" id="notasCartao" hidden>${NOTAS.map(([n, icone], v) => `<button class="btn ${v === 2 ? 'primario' : ''}" type="button" data-nota="${v}">${ic(icone)} ${n}</button>`).join('')}</div>`;
        const card = corpo.querySelector('.flashcard');
        const virar = () => { card.classList.toggle('virado'); corpo.querySelector('#notasCartao').hidden = false; };
        card.onclick = virar;
        card.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); virar(); } };
        corpo.querySelectorAll('[data-nota]').forEach((b) => b.addEventListener('click', () => { servico.avaliarCartao(idc, Number(b.dataset.nota)); k = (k + 1) % cartoes.length; mostrar(); }));
        card.focus();
      };
      mostrar();
      return;
    }
    if (aba === 'pratica') {
      const ids = meta.labs ?? [];
      corpo.innerHTML = ids.length ? `<div class="grid">${ids.map((l) => `<a class="card cartao-lab" href="#/lab/${esc(l)}"><span class="chip-area" style="--cor:${area?.cor}">${ic(LABS[l]?.icone ?? 'frasco')}</span><h3>${esc(LABS[l]?.nome ?? l)}</h3><p>${esc(LABS[l]?.resumo ?? '')}</p></a>`).join('')}</div>` : '<div class="vazio">Tema teórico: pratique com as questões e os flashcards.</div>';
      return;
    }
    if (aba === 'videos') {
      const lista = labs.carregar(`aula:${id}`) ?? [];
      corpo.innerHTML = `<form class="linha" data-add><input name="url" placeholder="Cole o link de um vídeo do YouTube" style="flex:1;min-width:220px" required><input name="titulo" placeholder="Título (opcional)" maxlength="120" style="max-width:240px"><button class="btn primario">${ic('mais')} Adicionar</button></form>
        <p class="mini sutil">Os vídeos tocam aqui no modo de privacidade do YouTube (youtube-nocookie.com) e ficam salvos na sua conta.</p>
        <div class="grid larga">${lista.length ? lista.map((x, k) => `<div class="card"><div class="linha entre"><strong>${esc(x.titulo || `Vídeo ${k + 1}`)}</strong><span class="linha"><a class="btn peq" href="https://www.youtube.com/watch?v=${esc(x.id)}" target="_blank" rel="noopener noreferrer">${ic('externo')}</a><button class="btn peq perigo" type="button" data-rm="${k}">${ic('lixeira')}</button></span></div>
          <div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(x.id)}" title="${esc(x.titulo || 'Vídeo')}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>`).join('') : '<div class="vazio">Nenhum vídeo ainda. Use as buscas abaixo, copie o link e cole acima.</div>'}</div>
        <h3>Buscar videoaulas sobre o tema</h3><div class="linha">${CANAIS.map((c) => `<a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${meta.busca ?? meta.titulo} ${c}`.trim())}">${ic('busca')} ${c || 'Busca geral'}</a>`).join('')}</div>`;
      corpo.querySelector('[data-add]').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const vid = idYoutube(f.get('url'));
        if (!vid) { toast('Link do YouTube não reconhecido.', { tipo: 'erro' }); return; }
        labs.salvar(`aula:${id}`, [...lista, { id: vid, titulo: String(f.get('titulo') || '').slice(0, 120) }]);
        desenhar();
      });
      corpo.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { lista.splice(Number(b.dataset.rm), 1); labs.salvar(`aula:${id}`, lista); desenhar(); }));
      return;
    }
    if (aba === 'notas') {
      const chave = `notas:${id}`;
      corpo.innerHTML = `<label class="campo">Suas anotações desta aula <span class="ajuda">Salvas automaticamente${sessao.conta ? ' e cifradas na sua conta' : ''}. Aceita Markdown simples.</span><textarea id="txtNotas" rows="14" placeholder="Resumo com suas palavras, dúvidas, macetes...">${esc(sessao.ler(chave) ?? '')}</textarea></label><p class="mini sutil" id="salvoNotas"></p>`;
      let t;
      corpo.querySelector('#txtNotas').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { sessao.gravar(chave, e.target.value); corpo.querySelector('#salvoNotas').textContent = `Salvo às ${new Date().toLocaleTimeString('pt-BR')}`; }, 500); });
    }
  }

  function telaCheia() {
    const caixa = corpo.querySelector('#caixaPalco');
    if (!caixa) return;
    if (document.fullscreenElement) document.exitFullscreen(); else caixa.requestFullscreen?.().then(() => setTimeout(() => ajustar(caixa.querySelector('#palco')), 200));
  }

  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => {
    aba = b.dataset.aba;
    el.querySelectorAll('[data-aba]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    grade = false;
    desenhar();
  }));
  el.querySelector('[data-apresentar]').onclick = () => {
    if (aba !== 'slides' || grade) { aba = 'slides'; grade = false; el.querySelectorAll('[data-aba]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.aba === 'slides'))); desenhar(); }
    telaCheia();
  };
  el.querySelector('[data-imprimir]').onclick = async () => {
    const janela = document.createElement('div');
    janela.className = 'imprimir-slides';
    janela.innerHTML = slides.map((s, k) => `<div class="palco" style="margin-bottom:12px">${htmlSlide(s, meta, k, total)}</div>`).join('');
    document.body.append(janela);
    await renderizarDiagramas(janela);
    const css = document.createElement('style');
    css.textContent = '@media print { body > *:not(.imprimir-slides) { display: none !important; } .imprimir-slides .palco { width: 100%; } @page { size: landscape; margin: 8mm; } } @media screen { .imprimir-slides { position: fixed; left: -99999px; width: 1100px; } }';
    document.head.append(css);
    setTimeout(() => { print(); janela.remove(); css.remove(); }, 300);
  };

  const teclas = (e) => {
    if (aba !== 'slides' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.querySelector('dialog[open]')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); irPara(i + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); irPara(i - 1); }
    else if (e.key === 'Home') irPara(0);
    else if (e.key === 'End') irPara(total - 1);
    else if (e.key.toLowerCase() === 'f' && !e.ctrlKey) telaCheia();
    else if (e.key.toLowerCase() === 'g' && !e.ctrlKey) { grade = !grade; desenhar(); }
    else if (e.key.toLowerCase() === 'n' && !e.ctrlKey) corpo.querySelector('[data-notas]')?.click();
  };
  const redimensionar = () => { const p = corpo.querySelector('#palco'); if (p) ajustar(p); };
  const tema = () => { corpo.querySelectorAll('[data-mermaid]').forEach((d) => d.removeAttribute('data-pronto')); renderizarDiagramas(corpo); };
  addEventListener('keydown', teclas);
  addEventListener('resize', redimensionar);
  addEventListener('tema-mudou', tema);
  document.addEventListener('fullscreenchange', redimensionar);
  desenhar();
  return () => {
    removeEventListener('keydown', teclas);
    removeEventListener('resize', redimensionar);
    removeEventListener('tema-mudou', tema);
    document.removeEventListener('fullscreenchange', redimensionar);
    if (document.fullscreenElement) document.exitFullscreen();
  };
}

// Revisões do dia (revisão espaçada): questões erradas/acertadas e flashcards vencidos, com previsão da semana.
import { esc, ic, cabecalho, diaIso } from '../dom.js';
import { previsao, NOTAS } from '../../../domain/srs.js';
import { parseAula } from '../../../domain/aula.js';
import { praticar } from '../componentes/questao.js';

// Carrega os cartões de várias aulas (ids "f:aula:k").
export async function cartoesPorId(conteudo, ids) {
  const aulas = [...new Set(ids.filter((i) => i.startsWith('f:')).map((i) => i.split(':')[1]))];
  const mapa = new Map();
  await Promise.all(aulas.map(async (a) => {
    try {
      const { meta, cartoes } = parseAula(await conteudo.aula(a));
      cartoes.forEach((c, k) => mapa.set(`f:${a}:${k}`, { ...c, aula: a, titulo: meta.titulo }));
    } catch { /* aula removida */ }
  }));
  return mapa;
}

export function mostrarCartao(el, c, { aoAvaliar, extra = '' }) {
  el.innerHTML = `<div class="linha entre mb2"><span class="tag prim">${ic('cartoes')} Flashcard</span><a class="mini" href="#/aulas/${esc(c.aula)}">${esc(c.titulo)}</a></div>
    <div class="flashcard-caixa flashcard" tabindex="0" role="button" aria-label="Virar cartão"><div class="face frente">${esc(c.frente)}</div><div class="face verso">${esc(c.verso)}</div></div>
    <p class="mini sutil centro mt1">Clique ou Espaço para virar · depois avalie com 1–4.</p>
    <div class="linha mt2" style="justify-content:center" id="notasCartao" hidden>${NOTAS.map(([n, icone], v) => `<button class="btn ${v === 2 ? 'primario' : ''}" type="button" data-nota="${v}">${ic(icone)} ${n} <kbd>${v + 1}</kbd></button>`).join('')}</div>${extra}`;
  const card = el.querySelector('.flashcard');
  let virado = false;
  const virar = () => { card.classList.toggle('virado'); virado = true; el.querySelector('#notasCartao').hidden = false; };
  card.onclick = virar;
  const avaliar = (v) => { removeEventListener('keydown', teclas); aoAvaliar(v); };
  const teclas = (e) => {
    if (!el.isConnected) return removeEventListener('keydown', teclas);
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); virar(); }
    if (virado && ['1', '2', '3', '4'].includes(e.key)) avaliar(Number(e.key) - 1);
  };
  addEventListener('keydown', teclas);
  el.querySelectorAll('[data-nota]').forEach((b) => b.addEventListener('click', () => avaliar(Number(b.dataset.nota))));
  card.focus();
}

export default async function revisoes(el, { conteudo, servico, casca }) {
  casca?.definirTitulo('Revisões');
  const questoes = await conteudo.questoes();
  const porId = new Map(questoes.map((q) => [q.id, q]));

  const inicio = async () => {
    const vencidas = servico.vencidas();
    const prev = previsao(servico.revisoes, diaIso(), 7);
    const max = Math.max(1, ...prev.map((d) => d.n));
    const total = Object.keys(servico.revisoes).length;
    el.innerHTML = `${cabecalho({ sobre: 'Estudar', titulo: 'Revisões do dia', texto: 'A revisão espaçada mostra cada item pouco antes de você esquecê-lo. Errou, volta amanhã; acertou, o intervalo aumenta (1, 6, 15, 35 dias...).' })}
      <div class="split">
        <section class="card centro" style="padding:32px">
          <div class="contagem">${vencidas.length}</div><p class="muted">item(ns) para revisar hoje · ${total} na sua memória de longo prazo</p>
          ${vencidas.length ? `<button class="btn primario grande" type="button" data-comecar>${ic('play')} Começar revisão</button>` : `<div class="vazio">${ic('okCirculo')}<p>Tudo em dia! Resolva questões ou estude flashcards para alimentar as revisões.</p><div class="linha" style="justify-content:center"><a class="btn" href="#/questoes">Questões</a><a class="btn" href="#/flashcards">Flashcards</a></div></div>`}
        </section>
        <section class="card"><h3 class="mt0">Próximos 7 dias</h3>
          <div class="pilha p">${prev.map((d, k) => `<div class="barra-peso"><span>${k === 0 ? 'Hoje' : new Date(`${d.dia}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</span><span class="mini sutil">${d.n}</span><div class="progresso fina"><span style="width:${(d.n / max) * 100}%"></span></div></div>`).join('')}</div></section>
      </div>`;
    el.querySelector('[data-comecar]')?.addEventListener('click', async () => {
      const cartoes = await cartoesPorId(conteudo, vencidas);
      const fila = vencidas.filter((id) => (id.startsWith('q:') ? porId.has(id.slice(2)) : cartoes.has(id)));
      let k = 0;
      const prox = () => {
        if (k >= fila.length) { inicio(); return; }
        const id = fila[k];
        el.innerHTML = `<div class="linha entre mb2"><button class="btn fantasma" type="button" data-sair>${ic('esq')} Encerrar</button><span class="pequeno muted">${k + 1} de ${fila.length}</span></div><div id="item"></div>`;
        el.querySelector('[data-sair]').onclick = inicio;
        const area = el.querySelector('#item');
        if (id.startsWith('q:')) praticar(area, porId.get(id.slice(2)), { servico, aoProxima: () => { k++; prox(); } });
        else mostrarCartao(area, cartoes.get(id), { aoAvaliar: (v) => { servico.avaliarCartao(id, v); k++; prox(); } });
      };
      prox();
    });
  };
  await inicio();
}

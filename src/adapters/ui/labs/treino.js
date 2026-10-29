// Laboratórios de treino: cálculos gerados, classificação e ordenação de etapas (motor em src/domain/treinos).
import { esc, ic, toast } from '../dom.js';
import { inline } from '../../../domain/markdown.js';
import { conferir, rodada, conferirOrdem, embaralhar, missoesDe } from '../../../domain/treinos/motor.js';

const TIPO = { calc: ['calculadora', 'Cálculo'], classificar: ['tag', 'Classificar'], ordenar: ['fluxo', 'Ordenar'] };

export default async function treino(el, ctx, kit) {
  const spec = (await import(`../../../domain/treinos/${kit.meta.treino}.js`)).default[kit.id];
  if (!spec) { el.innerHTML = '<div class="vazio">Treino não encontrado.</div>'; return; }
  const st = { ex: spec.exercicios[0].id, acertos: {}, melhor: {}, ordenado: {}, ...(kit.estado.carregar() ?? {}) };
  const salvar = () => kit.estado.salvar(st);
  const missoes = kit.missoes(missoesDe(spec));
  const calcs = spec.exercicios.filter((e) => e.tipo === 'calc' && e.formula);
  if (calcs.length) kit.referencia(`<dl>${calcs.map((e) => `<dt>${esc(e.titulo)}</dt><dd class="mono">${esc(e.formula)}</dd>`).join('')}</dl>`);
  if (spec.teoria) kit.teoria(spec.teoria);
  kit.aoReiniciar(() => { kit.estado.limpar(); Object.assign(st, { acertos: {}, melhor: {}, ordenado: {} }); desenhar(); });

  const corpo = () => el.querySelector('#exercicio');
  const fb = (ok, html) => `<div class="aviso ${ok ? 'ok' : 'erro'} mt2">${html}</div>`;
  const registrar = () => { salvar(); missoes.verificar(st); abas(); };

  function abas() {
    el.querySelector('#abas').innerHTML = spec.exercicios.map((e) => {
      const feito = missoesDe({ exercicios: [e] })[0].checar(st);
      return `<button class="filtro" type="button" data-ex="${esc(e.id)}" aria-pressed="${e.id === st.ex}">${feito ? ic('okCirculo') : ic(TIPO[e.tipo][0])} ${esc(e.titulo)}</button>`;
    }).join('');
    el.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => { st.ex = b.dataset.ex; salvar(); desenhar(); }));
  }

  function calc(e) {
    let x = e.gerar(Math.random);
    const novo = () => {
      x = e.gerar(Math.random);
      corpo().innerHTML = `<p class="mini sutil mb1">${ic('calculadora')} ${esc(e.formula ?? '')}</p><p class="forte">${inline(x.enunciado)}</p>
        <form class="linha" id="fCalc"><input name="r" autocomplete="off" inputmode="${typeof x.resposta === 'number' ? 'decimal' : 'text'}" placeholder="Sua resposta" style="max-width:220px" required>${x.unidade ? `<span class="muted">${esc(x.unidade)}</span>` : ''}
        <button class="btn primario" type="submit">Conferir</button><button class="btn" type="button" data-outro>Outro</button></form>
        <p class="mini sutil mt1 mb0">${typeof x.resposta === 'number' ? 'Use vírgula ou ponto para decimais, sem separador de milhar; arredonde para 2 casas.' : 'Digite exatamente no formato pedido.'} Acertos neste exercício: ${st.acertos[e.id] ?? 0}.</p><div id="fb"></div>`;
      const f = corpo().querySelector('#fCalc');
      f.r.focus();
      f.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const ok = conferir(x, f.r.value);
        const certo = typeof x.resposta === 'number' ? x.resposta.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : x.resposta;
        corpo().querySelector('#fb').innerHTML = fb(ok, `<strong>${ok ? 'Correto!' : 'Ainda não.'}</strong> Resposta: ${esc(certo)}${x.unidade ? ` ${esc(x.unidade)}` : ''}.${x.passos ? `<div class="mt1">${inline(x.passos)}</div>` : ''}`);
        if (ok) { st.acertos[e.id] = (st.acertos[e.id] ?? 0) + 1; registrar(); f.querySelector('[type=submit]').disabled = true; }
      });
      corpo().querySelector('[data-outro]').onclick = novo;
    };
    novo();
  }

  function classificar(e) {
    let itens = rodada(e.itens);
    let k = 0;
    let certos = 0;
    const passo = () => {
      if (k >= itens.length) {
        const p = Math.round((certos / itens.length) * 100);
        st.melhor[e.id] = Math.max(st.melhor[e.id] ?? 0, p);
        registrar();
        corpo().innerHTML = `<div class="centro pilha"><div class="contagem">${p}%</div><p>${certos} de ${itens.length} corretos · melhor rodada: ${st.melhor[e.id]}%</p>
          <div class="linha" style="justify-content:center"><button class="btn primario" type="button" data-nova>${ic('recarregar')} Nova rodada</button></div></div>`;
        corpo().querySelector('[data-nova]').onclick = () => { itens = rodada(e.itens); k = 0; certos = 0; passo(); };
        return;
      }
      const [texto, cat, expl] = itens[k];
      corpo().innerHTML = `<div class="linha entre mb1"><span class="mini sutil">${esc(e.pergunta ?? 'Classifique')}</span><span class="tag">${k + 1} de ${itens.length}</span></div>
        <p class="forte" style="font-size:1.08rem">${inline(texto)}</p>
        <div class="linha" id="cats">${e.categorias.map((c, i) => `<button class="btn" type="button" data-cat="${i}">${esc(c)}</button>`).join('')}</div><div id="fb"></div>`;
      corpo().querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
        const escolhido = e.categorias[Number(b.dataset.cat)];
        const ok = escolhido === cat;
        if (ok) certos++;
        corpo().querySelectorAll('[data-cat]').forEach((x) => { x.disabled = true; if (e.categorias[Number(x.dataset.cat)] === cat) x.classList.add('primario'); });
        corpo().querySelector('#fb').innerHTML = fb(ok, `<strong>${ok ? 'Correto!' : `Não: é ${esc(cat)}.`}</strong>${expl ? ` ${inline(expl)}` : ''}<div class="mt1"><button class="btn peq" type="button" data-prox>Próximo ${ic('dir')}</button></div>`);
        const prox = corpo().querySelector('[data-prox]');
        prox.focus();
        prox.onclick = () => { k++; passo(); };
      }));
    };
    passo();
  }

  function ordenar(e) {
    let ordem = embaralhar(e.passos);
    while (e.passos.length > 1 && ordem.every((p, i) => p === e.passos[i])) ordem = embaralhar(e.passos);
    let marcas = null;
    const lista = () => {
      corpo().innerHTML = `<p class="mini sutil">Use as setas para colocar as etapas na ordem correta e confira.</p>
        <ol class="lista">${ordem.map((p, i) => `<li class="com-acao" ${marcas ? `style="border-left:4px solid var(${marcas[i] ? '--ok' : '--erro'})"` : ''}><span>${inline(p)}</span><span class="linha nw">
          <button class="btn fantasma icone peq" type="button" data-sobe="${i}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ic('cima')}</button>
          <button class="btn fantasma icone peq" type="button" data-desce="${i}" aria-label="Descer" ${i === ordem.length - 1 ? 'disabled' : ''}>${ic('baixo')}</button></span></li>`).join('')}</ol>
        <div class="linha mt2"><button class="btn primario" type="button" data-conferir>Conferir ordem</button><button class="btn" type="button" data-misturar>${ic('recarregar')} Embaralhar</button></div><div id="fb"></div>`;
      const mover = (i, d) => { [ordem[i], ordem[i + d]] = [ordem[i + d], ordem[i]]; marcas = null; lista(); };
      corpo().querySelectorAll('[data-sobe]').forEach((b) => b.addEventListener('click', () => mover(Number(b.dataset.sobe), -1)));
      corpo().querySelectorAll('[data-desce]').forEach((b) => b.addEventListener('click', () => mover(Number(b.dataset.desce), 1)));
      corpo().querySelector('[data-misturar]').onclick = () => { ordem = embaralhar(e.passos); marcas = null; lista(); };
      corpo().querySelector('[data-conferir]').onclick = () => {
        marcas = conferirOrdem(e.passos, ordem);
        const n = marcas.filter(Boolean).length;
        const ok = n === ordem.length;
        lista();
        corpo().querySelector('#fb').innerHTML = fb(ok, ok ? `<strong>Ordem correta!</strong>${e.explicacao ? ` ${inline(e.explicacao)}` : ''}` : `<strong>${n} de ${ordem.length} na posição certa.</strong> As marcadas em vermelho estão fora do lugar.`);
        if (ok && !st.ordenado[e.id]) { st.ordenado[e.id] = true; registrar(); toast('Sequência correta!', { tipo: 'ok', ms: 1500 }); }
      };
    };
    lista();
  }

  function desenhar() {
    const e = spec.exercicios.find((x) => x.id === st.ex) ?? spec.exercicios[0];
    el.innerHTML = `<div class="pilha" style="max-width:920px;margin:0 auto">
      ${spec.intro ? `<p class="muted mb0">${inline(spec.intro)}</p>` : ''}
      <div class="filtros" id="abas" role="tablist" aria-label="Exercícios"></div>
      <section class="card"><div class="linha entre mb1"><h2 class="mt0 mb0" style="font-size:1.1rem">${ic(TIPO[e.tipo][0])} ${esc(e.titulo)}</h2><span class="tag">${TIPO[e.tipo][1]}</span></div><div id="exercicio"></div></section></div>`;
    abas();
    ({ calc, classificar, ordenar })[e.tipo](e);
  }
  desenhar();
  missoes.verificar(st);
}

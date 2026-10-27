import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const MISSOES_MUSICA = [
  { id: 'afinacao', titulo: 'Afinação básica', xp: 15, descricao: 'Afinando o instrumento usando referência auditiva ou afinação padrão.', dica: 'Use um afinação online ou o afímetro do navegador.', check: (estado) => estado.afinacaoConcluida }, 
  { id: 'ritmo', titulo: 'Manter ritmo', xp: 15, descricao: 'Exercício de batida usando metrônomo a 60 BPM.', dica: 'Concentre-se em bater junto com o clique constante.', check: (estado) => estado.ritmoConcluido },
];

export default async function musica(el, { servico, labs }) {
  let st = labs.carregar('musica') ?? { afinacaoConcluida: false, ritmoConcluido: false };
  el.innerHTML = cabecalhoLab('musica') + `<div class="split"><div class="pilha">\n      <section class="card pilha">\n        <div class="linha entre"><h3 style="margin:0">Afinação</h3></div>\n        <p>Afine seu instrumento usando referência padrão (Lá 440Hz).</p>\n        <button class="btn primario" id="afinaturaOk">Afinação confirmada</button>\n      </section>\n      <section class="card pilha">\n        <div class="linha entre"><h3 style="margin:0">Metrônomo</h3></div>\n        <p>Pratique batidas simples a 60 BPM.</p>\n        <div class="linha"><button class="btn peq" data-bpm="60">60 BPM</button><button class="btn peq" data-bpm="80">80 BPM</button><button class="btn peq" data-bpm="100">100 BPM</button></div>\n        <div id="batida"></div>\n      </section>\n    </div><aside class="card" id="missoes"></aside></div>`;

  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'musica', missoes: MISSOES_MUSICA, servico });
  
  el.querySelector('#afinaturaOk').onclick = () => {
    st.afinacaoConcluida = true;
    labs.salvar('musica', st);
    painel.verificar((m) => m.check(st));
    toast('Missão concluída: Afinação básica (+15 XP)', { tipo: 'xp' });
  };

  let bpm = 60;
  const batidaEl = el.querySelector('#batida');
  const intervalo = 60000 / bpm;
  
  function tocarBatida() {
    batidaEl.innerHTML = '<div class="mono" style="font-size:2rem; text-align:center">▶</div>';
    setTimeout(() => { batidaEl.innerHTML = ''; }, 100);
  }

  el.querySelectorAll('[data-bpm]').forEach(b => {
    b.onclick = () => {
      bpm = Number(b.dataset.bpm);
      el.querySelectorAll('[data-bpm]').forEach(x => x.classList.remove('ativa'));
      b.classList.add('ativa');
      // Limpar intervalo anterior e criar novo
      clearInterval(window._musicaBpmInterval);
      window._musicaBpmInterval = setInterval(tocarBatida, intervalo);
    };
  });

  confirmarReinicio(el, () => {
    labs.limpar('musica');
    st = { afinacaoConcluida: false, ritmoConcluido: false };
    painel.redesenhar();
    el.innerHTML = `<div class="split"><div class="pilha">\n      <section class="card pilha">\n        <div class="linha entre"><h3 style="margin:0">Afinação</h3></div>\n        <p>Afine seu instrumento usando referência auditiva ou afinação padrão.</p>\n        <button class="btn primario" id="afinaturaOk">Afinação confirmada</button>\n      </section>\n      <section class="card pilha">\n        <div class="linha entre"><h3 style="margin:0">Metrônomo</h3></div>\n        <p>Pratique batidas simples a 60 BPM.</p>\n        <div class="linha"><button class="btn peq" data-bpm="60">60 BPM</button><button class="btn peq" data-bpm="80">80 BPM</button><button class="btn peq" data-bpm="100">100 BPM</button></div>\n        <div id="batida"></div>\n      </section>\n    </div><aside class="card" id="missoes"></aside></div>`;
    musica(el, { servico, labs });
  });
}
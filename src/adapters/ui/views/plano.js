// Meu plano: cronograma diário até a prova (pesos do edital × domínio atual) e cronômetro Pomodoro.
import { esc, ic, cabecalho, diaIso, toast, pct, barra } from '../dom.js';
import { AREAS, provaPorArea, areaV2 } from '../../../domain/areas.js';
import { gerarPlano, totalMin } from '../../../domain/plano.js';
import { cargoAlvo, dataProva } from '../componentes/cargo.js';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPO = { revisao: ['cerebro', 'Revisão'], aula: ['slides', 'Aula'], questoes: ['questoes', 'Questões'], simulado: ['simulado', 'Simulado'], redacao: ['redacao', 'Redação'] };
const PADRAO = [120, 90, 90, 90, 90, 90, 180];

function bipe() {
  try {
    const ac = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.18, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2); o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.22); });
  } catch { /* sem áudio */ }
}

export default async function plano(el, { conteudo, servico, sessao, casca }) {
  casca?.definirTitulo('Meu plano');
  const [ufba, indice, questoes] = await Promise.all([conteudo.concurso('ufba-2026'), conteudo.indice(), conteudo.questoes().catch(() => [])]);
  let pomo = null;

  const render = () => {
    const p = servico.progresso;
    const cargo = cargoAlvo(p, ufba);
    const cfg = sessao.ler('plano:config') ?? { minutos: PADRAO };
    const hoje = diaIso();
    const prova = dataProva(ufba, cargo).split('/').reverse().join('-');
    if (!cargo?.objetiva) {
      el.innerHTML = `${cabecalho({ sobre: 'Planejamento', titulo: 'Meu plano de estudos' })}<div class="vazio">${ic('alvo')}<p>${cargo ? 'Seu cargo tem prova prática única; use o laboratório de Música para planejar os trechos.' : 'Defina seu cargo no Início para gerar o cronograma com os pesos do edital.'}</p><a class="btn primario" href="#/">Ir para o Início</a></div>`;
      return;
    }
    const porId = new Map(questoes.map((q) => [q.id, q]));
    const des = {};
    for (const [id, x] of Object.entries(p.respostas)) { const a = porId.get(id)?.area ?? areaV2(x.area); (des[a] ??= { f: 0, c: 0 }); des[a].f++; if (x.ultima) des[a].c++; }
    const areas = provaPorArea(cargo).map((d) => ({ area: d.area, nome: AREAS[d.area]?.curto ?? d.disciplina, peso: d.pontos, dominio: des[d.area]?.f ? des[d.area].c / des[d.area].f : 0 }));
    const aulas = indice.aulas.filter((a) => areas.some((x) => x.area === a.area) && (a.cargos.includes('todos') || a.cargos.includes(cargo.codigo)));
    const concluidas = new Set(Object.entries(p.aulas ?? {}).filter(([, v]) => v.concluida).map(([k]) => k));
    const { dias, pendentes } = gerarPlano({ hoje, prova, minutos: cfg.minutos, areas, aulas, concluidas, redacao: cargo.fases.includes('redacao') });
    const feitos = sessao.ler('plano:feitos') ?? {};
    const deHoje = dias[0]?.data === hoje ? dias[0] : null;
    const feitosHoje = feitos[hoje] ?? [];
    const proximos = dias.slice(1, 15);
    const total = totalMin(dias);

    el.innerHTML = `${cabecalho({ sobre: 'Planejamento', titulo: 'Meu plano de estudos', texto: `Cronograma até ${prova.split('-').reverse().join('/')} para ${esc(cargo.codigo)} – ${esc(cargo.nome)}, ponderado pelo peso de cada área no edital e pelo seu desempenho. Ele se recalcula conforme você avança.` })}
      <div class="split">
        <div class="pilha g">
          <section class="card"><div class="card-cab"><h2>${ic('calendario')} Hoje</h2><span class="mini sutil">${deHoje ? `${deHoje.blocos.reduce((s, b) => s + b.min, 0)} min planejados` : 'dia livre'}</span></div>
            ${deHoje?.blocos.length ? `<div class="pilha p">${deHoje.blocos.map((b, k) => `<div class="tarefa"><input type="checkbox" data-feito="${k}" ${feitosHoje.includes(k) ? 'checked' : ''} aria-label="Concluído"><span class="chip-area" style="--cor:${AREAS[b.area]?.cor ?? 'var(--prim)'}">${ic(TIPO[b.tipo][0])}</span><a href="${b.href}" style="min-width:0;flex:1;color:inherit"><span class="tt">${esc(b.titulo)}</span><br><span class="ds">${TIPO[b.tipo][1]} · ${b.min} min</span></a></div>`).join('')}</div>
              ${barra(pct(feitosHoje.length, deHoje.blocos.length), 'ok')}` : '<p class="muted mb0">Nada planejado para hoje — aproveite para descansar ou adiante uma aula.</p>'}</section>
          <section class="card"><div class="card-cab"><h2>Próximos 14 dias</h2><span class="mini sutil">${Math.round(total / 60)} h até a prova</span></div>
            <div class="pilha p">${proximos.map((d) => `<details class="recolhe"><summary><span class="linha entre" style="display:inline-flex;width:calc(100% - 20px)"><span>${new Date(`${d.data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span><span class="mini sutil">${d.blocos.length ? `${d.blocos.reduce((s, b) => s + b.min, 0)} min · ${d.blocos.map((b) => TIPO[b.tipo][1]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}` : 'livre'}</span></span></summary>
              ${d.blocos.map((b) => `<div class="linha pequeno" style="padding:4px 0">${ic(TIPO[b.tipo][0])}<a href="${b.href}">${esc(b.titulo)}</a><span class="sutil">${b.min} min</span></div>`).join('') || '<span class="muted pequeno">Sem estudo planejado.</span>'}</details>`).join('')}</div>
            ${pendentes ? `<div class="aviso alerta mt2 pequeno">${pendentes} aula(s) do seu cargo não cabem no tempo disponível até a prova. Aumente as horas da semana ou priorize as áreas de maior peso.</div>` : '<p class="mini sutil mt2 mb0">Todas as aulas do seu cargo cabem no cronograma.</p>'}</section>
        </div>
        <aside class="pilha g">
          <section class="card" id="pomodoro"></section>
          <section class="card"><h3 class="mt0">Tempo disponível</h3><p class="mini sutil">Minutos de estudo em cada dia da semana.</p>
            <form class="pilha p" data-cfg>${SEMANA.map((s, k) => `<label class="linha nw entre pequeno"><span style="width:44px">${s}</span><input type="range" min="0" max="480" step="15" name="d${k}" value="${cfg.minutos[k]}" style="flex:1"><output class="mono" style="width:52px;text-align:right">${cfg.minutos[k]}′</output></label>`).join('')}
              <button class="btn primario" type="submit">Recalcular plano</button></form></section>
          <section class="card"><h3 class="mt0">Peso × domínio</h3><div class="pilha p">${areas.map((a) => `<div class="barra-peso"><span>${esc(a.nome)}</span><span class="mini sutil">${a.peso} pts · ${Math.round(a.dominio * 100)}%</span>${barra(Math.round(a.dominio * 100))}</div>`).join('')}</div></section>
        </aside>
      </div>`;

    el.querySelectorAll('[data-feito]').forEach((c) => c.addEventListener('change', () => {
      const k = Number(c.dataset.feito);
      const lista = new Set(feitos[hoje] ?? []);
      if (c.checked) lista.add(k); else lista.delete(k);
      sessao.gravar('plano:feitos', { ...feitos, [hoje]: [...lista] });
      if (c.checked && lista.size === deHoje.blocos.length) toast('Plano do dia cumprido! 🎯', { tipo: 'ok' });
      render();
    }));
    const form = el.querySelector('[data-cfg]');
    form.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => { r.nextElementSibling.textContent = `${r.value}′`; }));
    form.addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(form); sessao.gravar('plano:config', { minutos: SEMANA.map((_, k) => Number(f.get(`d${k}`))) }); toast('Plano recalculado.', { tipo: 'ok' }); render(); });
    desenharPomodoro();
  };

  // Pomodoro: 25 min de foco, 5 de pausa, 15 a cada 4 ciclos.
  function desenharPomodoro() {
    const caixa = el.querySelector('#pomodoro');
    if (!caixa) return;
    pomo ??= { fase: 'foco', resta: 25 * 60, rodando: false, ciclos: 0, timer: null };
    const nomes = { foco: 'Foco', curta: 'Pausa curta', longa: 'Pausa longa' };
    const hoje = diaIso();
    const feitos = (sessao.ler('pomodoros') ?? {})[hoje] ?? 0;
    caixa.innerHTML = `<div class="linha entre"><h3 class="mt0 mb0">${ic('pomodoro')} Pomodoro</h3><span class="tag ${pomo.fase === 'foco' ? 'prim' : 'ok'}">${nomes[pomo.fase]}</span></div>
      <div class="centro" style="padding:14px 0"><div class="contagem mono" id="pomoTempo" style="font-size:3rem">${String(Math.floor(pomo.resta / 60)).padStart(2, '0')}:${String(pomo.resta % 60).padStart(2, '0')}</div><div class="mini sutil">${feitos} ciclo(s) de foco hoje</div></div>
      <div class="linha" style="justify-content:center"><button class="btn primario" type="button" data-pomo>${ic(pomo.rodando ? 'pausa' : 'play')} ${pomo.rodando ? 'Pausar' : 'Iniciar'}</button><button class="btn" type="button" data-reset>${ic('recarregar')}</button></div>`;
    caixa.querySelector('[data-pomo]').onclick = () => {
      pomo.rodando = !pomo.rodando;
      if (pomo.rodando) {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
        pomo.timer = setInterval(() => {
          pomo.resta--;
          const t = el.querySelector('#pomoTempo');
          if (t) t.textContent = `${String(Math.floor(pomo.resta / 60)).padStart(2, '0')}:${String(pomo.resta % 60).padStart(2, '0')}`;
          if (pomo.resta <= 0) {
            bipe();
            if (pomo.fase === 'foco') {
              pomo.ciclos++;
              const reg = sessao.ler('pomodoros') ?? {};
              sessao.gravar('pomodoros', { ...reg, [hoje]: (reg[hoje] ?? 0) + 1 });
              pomo.fase = pomo.ciclos % 4 === 0 ? 'longa' : 'curta';
              pomo.resta = (pomo.fase === 'longa' ? 15 : 5) * 60;
            } else { pomo.fase = 'foco'; pomo.resta = 25 * 60; }
            try { if (Notification.permission === 'granted') new Notification('Concurso Lab', { body: pomo.fase === 'foco' ? 'Hora de voltar ao foco.' : 'Pausa! Levante, beba água.' }); } catch { /* sem notificação */ }
            desenharPomodoro();
          }
        }, 1000);
      } else clearInterval(pomo.timer);
      desenharPomodoro();
    };
    caixa.querySelector('[data-reset]').onclick = () => { clearInterval(pomo.timer); pomo = null; desenharPomodoro(); };
  }

  render();
  return () => clearInterval(pomo?.timer);
}

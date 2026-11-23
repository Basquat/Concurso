// Meu plano: cronograma diário até a prova (pesos do edital × domínio atual) e cronômetro Pomodoro.
import { esc, ic, cabecalho, diaIso, toast, pct, barra } from '../dom.js';
import { AREAS, provaPorArea, areaV2 } from '../../../domain/areas.js';
import { gerarPlano, totalMin, porSemana } from '../../../domain/plano.js';
import { cargoAlvo, dataProva, concursoAlvoId } from '../componentes/cargo.js';
import { aulaDoCargo } from '../../../application/escopo.js';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPO = { revisao: ['cerebro', 'Revisão'], aula: ['slides', 'Aula'], questoes: ['questoes', 'Questões'], simulado: ['simulado', 'Simulado'], redacao: ['redacao', 'Redação'], discursiva: ['redacao', 'Discursiva'], pratica: ['frasco', 'Prática'] };
const NIVEL = { alta: ['erro', 'Alta'], media: ['aviso', 'Média'], baixa: ['', 'Baixa'] };
const dm = (iso) => iso.split('-').reverse().slice(0, 2).join('/');
const PADRAO = [120, 90, 90, 90, 90, 90, 180];

function bipe() {
  try {
    const ac = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.18, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2); o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.22); });
  } catch { /* sem áudio */ }
}

export default async function plano(el, { conteudo, servico, sessao, casca }) {
  casca?.definirTitulo('Meu plano');
  let [conc, indice, questoes] = await Promise.all([conteudo.concurso(concursoAlvoId(servico.progresso)), conteudo.indice(), conteudo.questoes().catch(() => [])]);
  let pomo = null;

  const render = () => {
    const p = servico.progresso;
    const cargo = cargoAlvo(p, conc);
    const hoje = diaIso();
    // Concurso-modelo não tem data oficial: vale a data informada pela pessoa (ou 90 dias à frente).
    const dataOficial = dataProva(conc, cargo);
    const prova = dataOficial ? dataOficial.split('/').reverse().join('-') : sessao.ler(`plano:perfil:${conc.id}:${cargo?.codigo}`)?.prova ?? diaIso(new Date(Date.now() + 90 * 86400000));
    if (!cargo?.objetiva) {
      el.innerHTML = `${cabecalho({ sobre: 'Planejamento', titulo: 'Meu plano de estudos' })}<div class="vazio">${ic('alvo')}<p>${cargo ? 'Seu cargo tem prova prática única; use o laboratório de Música para planejar os trechos.' : 'Defina um cargo-alvo no Início para gerar o cronograma ponderado. Enquanto isso, explore todas as áreas e use a prática por assunto.'}</p><div class="linha" style="justify-content:center"><a class="btn primario" href="#/">Definir cargo-alvo</a><a class="btn" href="#/areas">Estudar todas as áreas</a></div></div>`;
      return;
    }
    // Perfil por concurso+cargo, preenchido no questionário: rotina, área de trabalho e nível por bloco/área.
    const chaveP = `plano:perfil:${conc.id}:${cargo.codigo}`;
    const perfil = sessao.ler(chaveP);
    const cfg = perfil ?? { minutos: PADRAO };
    const salvar = (mais) => { sessao.gravar(chaveP, { ...cfg, ...mais }); render(); };
    const blocos = provaPorArea(cargo).map((d) => ({ chave: d.bloco ?? d.area, nome: d.bloco ? d.disciplina : AREAS[d.area]?.nome ?? d.disciplina }));
    const trocaAlvo = (p.alvos ?? []).length > 1 ? `<label class="campo">Concurso ativo<select data-alvo>${p.alvos.map((a, i) => `<option value="${i}" ${a.concurso === conc.id && a.cargo === cargo.codigo ? 'selected' : ''}>${esc(a.nome ?? a.cargo)} · ${esc(a.concurso)}</option>`).join('')}</select></label>` : '';
    const ligarAlvo = () => el.querySelector('[data-alvo]')?.addEventListener('change', async (e) => { servico.definirAlvo(p.alvos[e.target.value]); conc = await conteudo.concurso(concursoAlvoId(servico.progresso)); render(); });
    if (!perfil) {
      el.innerHTML = `${cabecalho({ sobre: 'Planejamento', titulo: 'Monte seu cronograma', texto: `Responda uma vez para ${esc(cargo.nome)}. Dá para mudar tudo depois.` })}
        ${trocaAlvo}
        <form class="card pilha g" data-quest style="max-width:760px">
          <fieldset class="pilha p"><legend><strong>Em quais destes conteúdos você já trabalha ou trabalhou?</strong></legend>
            ${blocos.map((b) => `<label class="linha nw"><input type="checkbox" name="t" value="${esc(b.chave)}"> ${esc(b.nome)}</label>`).join('')}</fieldset>
          <label class="campo">Experiência profissional nessas áreas<select name="exp"><option value="0">Nenhuma</option><option value="1">Menos de 2 anos</option><option value="2">2 a 5 anos</option><option value="3">Mais de 5 anos</option></select></label>
          <fieldset class="pilha p"><legend><strong>Seu nível hoje em cada conteúdo</strong> <span class="mini sutil">(0 = nunca vi, 100 = domino)</span></legend>
            ${blocos.map((b) => `<label class="linha nw entre pequeno"><span style="flex:1">${esc(b.nome)}</span><input type="range" min="0" max="100" step="10" name="n_${esc(b.chave)}" value="20" style="flex:1"><output class="mono" style="width:44px;text-align:right">20%</output></label>`).join('')}</fieldset>
          <fieldset class="pilha p"><legend><strong>Minutos de estudo por dia</strong></legend>
            ${SEMANA.map((s, k) => `<label class="linha nw entre pequeno"><span style="width:44px">${s}</span><input type="range" min="0" max="480" step="15" name="d${k}" value="${PADRAO[k]}" style="flex:1"><output class="mono" style="width:52px;text-align:right">${PADRAO[k]}′</output></label>`).join('')}</fieldset>
          ${dataOficial ? '' : `<label class="campo">Data prevista da prova<input type="date" name="prova" value="${prova}" min="${hoje}"></label>`}
          <button class="btn primario" type="submit">Gerar meu cronograma</button>
        </form>`;
      const fq = el.querySelector('[data-quest]');
      // Marcar uma área de trabalho sugere um nível inicial conforme a experiência; a pessoa ajusta no controle.
      const sugerir = () => { const exp = Number(fq.exp.value); fq.querySelectorAll('[name=t]').forEach((c) => { const r = fq[`n_${c.value}`]; if (c.checked && Number(r.value) < [40, 50, 60, 70][exp]) { r.value = [40, 50, 60, 70][exp]; r.nextElementSibling.textContent = `${r.value}%`; } }); };
      fq.addEventListener('change', sugerir);
      fq.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => { r.nextElementSibling.textContent = r.max === '100' ? `${r.value}%` : `${r.value}′`; }));
      fq.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = new FormData(fq);
        salvar({ trabalho: f.getAll('t'), exp: Number(f.get('exp')), minutos: SEMANA.map((_, k) => Number(f.get(`d${k}`))), dominio: Object.fromEntries(blocos.map((b) => [b.chave, Number(f.get(`n_${b.chave}`))])), ...(f.get('prova') ? { prova: f.get('prova') } : {}) });
        toast('Cronograma gerado.', { tipo: 'ok' });
      });
      ligarAlvo();
      return;
    }
    const porId = new Map(questoes.map((q) => [q.id, q]));
    const des = {};
    for (const [id, x] of Object.entries(p.respostas)) { const a = porId.get(id)?.area ?? areaV2(x.area); (des[a] ??= { f: 0, c: 0 }); des[a].f++; if (x.ultima) des[a].c++; }
    // Domínio: desempenho medido nas questões da área; o nível declarado pela pessoa (0–100%) entra na média e
    // vale sozinho enquanto há menos de 15 respostas na área.
    const declarado = cfg.dominio ?? {};
    const dominio = (chave, area) => {
      const m = des[area]?.f ? des[area].c / des[area].f : null;
      const d = declarado[chave] != null ? declarado[chave] / 100 : null;
      if (d == null) return m ?? 0;
      return m == null || des[area].f < 15 ? d : (m + d) / 2;
    };
    const areas = provaPorArea(cargo).map((d) => ({ area: d.area, chave: d.bloco ?? d.area, nome: d.bloco ? d.disciplina : AREAS[d.area]?.curto ?? d.disciplina, peso: Math.round(d.pontos * 10) / 10, dominio: dominio(d.bloco ?? d.area, d.area), aulas: d.aulas, labs: d.labs }));
    const aulas = indice.aulas.filter((a) => areas.some((x) => x.area === a.area) && aulaDoCargo(a, cargo));
    const temas = cargo.discursiva?.temas ?? [];
    const concluidas = new Set(Object.entries(p.aulas ?? {}).filter(([, v]) => v.concluida).map(([k]) => k));
    const { dias, pendentes } = gerarPlano({ hoje, prova, minutos: cfg.minutos, areas, aulas, concluidas, redacao: cargo.fases.includes('redacao'), discursiva: temas.map((x) => x.titulo) });
    const semanas = porSemana(dias);
    const feitos = sessao.ler('plano:feitos') ?? {};
    const deHoje = dias[0]?.data === hoje ? dias[0] : null;
    const feitosHoje = feitos[hoje] ?? [];
    const proximos = dias.slice(1, 15);
    const total = totalMin(dias);

    el.innerHTML = `${cabecalho({ sobre: 'Planejamento', titulo: 'Meu plano de estudos', texto: `Cronograma até ${prova.split('-').reverse().join('/')} para ${esc(cargo.nome)}, ponderado pelo peso de cada área no edital e pelo seu desempenho. Ele se recalcula conforme você avança.` })}
      <div class="linha mb3">${trocaAlvo}<button class="btn" type="button" data-refazer>Refazer questionário</button><button class="btn" type="button" data-remover>Remover este concurso</button><a class="btn" href="#/concursos">Adicionar outro concurso</a></div>
      <div class="split">
        <div class="pilha g">
          <section class="card"><div class="card-cab"><h2>${ic('calendario')} Hoje</h2><span class="mini sutil">${deHoje ? `${deHoje.blocos.reduce((s, b) => s + b.min, 0)} min planejados` : 'dia livre'}</span></div>
            ${deHoje?.blocos.length ? `<div class="pilha p">${deHoje.blocos.map((b, k) => `<div class="tarefa"><input type="checkbox" data-feito="${k}" ${feitosHoje.includes(k) ? 'checked' : ''} aria-label="Concluído"><span class="chip-area" style="--cor:${AREAS[b.area]?.cor ?? 'var(--prim)'}">${ic(TIPO[b.tipo][0])}</span><a href="${b.href}" style="min-width:0;flex:1;color:inherit"><span class="tt">${esc(b.titulo)}</span><br><span class="ds">${TIPO[b.tipo][1]} · ${b.min} min</span></a></div>`).join('')}</div>
              ${barra(pct(feitosHoje.length, deHoje.blocos.length), 'ok')}` : '<p class="muted mb0">Nada planejado para hoje — aproveite para descansar ou adiante uma aula.</p>'}</section>
          <section class="card"><div class="card-cab"><h2>Cronograma semanal até a prova</h2><span class="mini sutil">${semanas.length} semanas</span></div>
            <div class="rolagem"><table class="tabela empilha"><thead><tr><th>Semana</th>${Object.keys(TIPO).map((k) => `<th class="num">${TIPO[k][1]}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
            ${semanas.map((s) => `<tr><td data-rotulo="Semana">${dm(s.inicio)}${(new Date(prova) - new Date(s.inicio)) / 86400000 <= 7 ? ' · reta final' : ''}</td>${Object.keys(TIPO).map((k) => `<td data-rotulo="${TIPO[k][1]}" class="num">${s.tipos[k] ? `${Math.round(s.tipos[k] / 6) / 10} h` : '—'}</td>`).join('')}<td data-rotulo="Total" class="num"><strong>${Math.round(s.total / 6) / 10} h</strong></td></tr>`).join('')}
            </tbody></table></div><p class="mini sutil mb0">Última semana: sem conteúdo novo, só questões, revisões e simulado. A revisão espaçada diária vem dos cartões e questões vencidos.</p></section>
          ${prioridadesHtml(cargo, areas)}
          ${discursivaHtml(cargo)}
          <section class="card"><div class="card-cab"><h2>Próximos 14 dias</h2><span class="mini sutil">${Math.round(total / 60)} h até a prova</span></div>
            <div class="pilha p">${proximos.map((d) => `<details class="recolhe"><summary><span class="linha entre" style="display:inline-flex;width:calc(100% - 20px)"><span>${new Date(`${d.data}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span><span class="mini sutil">${d.blocos.length ? `${d.blocos.reduce((s, b) => s + b.min, 0)} min · ${d.blocos.map((b) => TIPO[b.tipo][1]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}` : 'livre'}</span></span></summary>
              ${d.blocos.map((b) => `<div class="linha pequeno" style="padding:4px 0">${ic(TIPO[b.tipo][0])}<a href="${b.href}">${esc(b.titulo)}</a><span class="sutil">${b.min} min</span></div>`).join('') || '<span class="muted pequeno">Sem estudo planejado.</span>'}</details>`).join('')}</div>
            ${pendentes ? `<div class="aviso alerta mt2 pequeno">${pendentes} aula(s) do seu cargo não cabem no tempo disponível até a prova. Aumente as horas da semana ou priorize as áreas de maior peso.</div>` : '<p class="mini sutil mt2 mb0">Todas as aulas do seu cargo cabem no cronograma.</p>'}</section>
        </div>
        <aside class="pilha g">
          <section class="card" id="pomodoro"></section>
          <section class="card"><h3 class="mt0">Tempo disponível</h3><p class="mini sutil">Minutos de estudo em cada dia da semana.</p>
            <form class="pilha p" data-cfg>${SEMANA.map((s, k) => `<label class="linha nw entre pequeno"><span style="width:44px">${s}</span><input type="range" min="0" max="480" step="15" name="d${k}" value="${cfg.minutos[k]}" style="flex:1"><output class="mono" style="width:52px;text-align:right">${cfg.minutos[k]}′</output></label>`).join('')}
              ${dataOficial ? '' : `<label class="campo">Data prevista da prova<input type="date" name="prova" value="${prova}" min="${hoje}"></label>`}<button class="btn primario" type="submit">Recalcular plano</button></form></section>
          <section class="card"><h3 class="mt0">Peso × domínio</h3><p class="mini sutil">Informe seu nível atual em cada ${areas.some((a) => a.chave !== a.area) ? 'bloco' : 'área'}; ele se combina com seu acerto nas questões.</p>
            <form class="pilha p" data-dom>${areas.map((a) => `<label class="barra-peso"><span>${esc(a.nome)}</span><span class="mini sutil">${a.peso} pts · domínio ${Math.round(a.dominio * 100)}%</span><span class="linha nw"><input type="range" min="0" max="100" step="10" name="${esc(a.chave)}" value="${declarado[a.chave] ?? Math.round(a.dominio * 100)}" style="flex:1"><output class="mono" style="width:44px;text-align:right">${declarado[a.chave] != null ? `${declarado[a.chave]}%` : '—'}</output></span></label>`).join('')}
            <button class="btn" type="submit">Salvar nível e recalcular</button></form></section>
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
    const fdom = el.querySelector('[data-dom]');
    fdom.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => { r.nextElementSibling.textContent = `${r.value}%`; }));
    fdom.addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(fdom); toast('Nível salvo; plano recalculado.', { tipo: 'ok' }); salvar({ dominio: Object.fromEntries(areas.map((a) => [a.chave, Number(f.get(a.chave))])) }); });
    el.querySelector('[data-refazer]').addEventListener('click', () => { sessao.apagar(chaveP); render(); });
    el.querySelector('[data-remover]').addEventListener('click', async () => {
      if (!confirm(`Remover ${cargo.nome} da sua lista? O cronograma deste concurso será apagado.`)) return;
      sessao.apagar(chaveP);
      servico.removerAlvo(conc.id, cargo.codigo);
      if (servico.progresso.alvo) conc = await conteudo.concurso(concursoAlvoId(servico.progresso));
      toast('Concurso removido.', { tipo: 'ok' });
      render();
    });
    ligarAlvo();
    const form = el.querySelector('[data-cfg]');
    form.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => { r.nextElementSibling.textContent = `${r.value}′`; }));
    form.addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(form); toast('Plano recalculado.', { tipo: 'ok' }); salvar({ minutos: SEMANA.map((_, k) => Number(f.get(`d${k}`))), ...(f.get('prova') ? { prova: f.get('prova') } : {}) }); });
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

// Matriz de priorização do edital: chance de cobrança na objetiva e na discursiva, ordenada pelo que pesa nas duas.
function prioridadesHtml(cargo, areas) {
  if (!cargo.prioridades?.length) return '';
  const v = { alta: 3, media: 2, baixa: 1 };
  const nome = Object.fromEntries(areas.map((a) => [a.chave, a.nome]));
  const xs = [...cargo.prioridades].sort((a, b) => v[b.objetiva] + v[b.discursiva] - v[a.objetiva] - v[a.discursiva]);
  const tag = (n) => `<span class="tag ${NIVEL[n][0]}">${NIVEL[n][1]}</span>`;
  return `<section class="card"><details class="recolhe"><summary><strong>Matriz de priorização</strong> <span class="mini sutil">${xs.length} tópicos · objetiva × discursiva</span></summary>
    <div class="rolagem"><table class="tabela empilha"><thead><tr><th>Tópico</th><th>Bloco</th><th>Objetiva</th><th>Discursiva</th><th>Por quê</th></tr></thead><tbody>
    ${xs.map((p) => `<tr><td data-rotulo="Tópico">${esc(p.topico)}</td><td data-rotulo="Bloco" class="pequeno">${esc(nome[p.bloco] ?? p.bloco)}</td><td data-rotulo="Objetiva">${tag(p.objetiva)}</td><td data-rotulo="Discursiva">${tag(p.discursiva)}</td><td data-rotulo="Por quê" class="pequeno muted">${esc(p.porque)}</td></tr>`).join('')}
    </tbody></table></div></details></section>`;
}

// Estudos de caso para a prova discursiva, com estrutura de resposta e pontos obrigatórios.
function discursivaHtml(cargo) {
  const d = cargo.discursiva;
  if (!d?.temas?.length) return '';
  return `<section class="card" id="discursiva"><details class="recolhe"><summary><strong>Treino da discursiva</strong> <span class="mini sutil">${d.temas.length} estudos de caso · ${d.linhas} linhas em ${d.minutos} min</span></summary>
    <h3>Estrutura recomendada</h3><ul class="leitura">${d.estrutura.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="pilha p">${d.temas.map((x, i) => `<details class="recolhe"><summary>${i + 1}. ${esc(x.titulo)}</summary><p>${esc(x.enunciado)}</p><p class="mini sutil mb0">Pontos que a resposta deve cobrir:</p><ol class="pequeno">${x.roteiro.map((r) => `<li>${esc(r)}</li>`).join('')}</ol><a class="btn peq" href="#/lab/redacao">Escrever no laboratório de redação</a></details>`).join('')}</div>
    </details></section>`;
}

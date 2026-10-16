// Painel inicial: meta do dia, sequência, revisões, próximos passos, mapa de calor e a prova do cargo-alvo.
import { esc, ic, barra, pct, anel, mapaCalor, diaIso, diasAte, toast, pedir } from '../dom.js';
import { nivel, sequencia } from '../../../domain/gamification.js';
import { AREAS, provaPorArea, areaV2 } from '../../../domain/areas.js';
import { cargoAlvo, seletorCargo, labsDoCargo, dataProva } from '../componentes/cargo.js';
import { LABS } from '../labs/registro.js';

const saudacao = (h = new Date().getHours()) => (h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');

// Acertos por área (última tentativa de cada questão).
function desempenho(respostas, questoes) {
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const r = {};
  for (const [id, x] of Object.entries(respostas)) {
    const area = porId.get(id)?.area ?? areaV2(x.area);
    const a = (r[area] ??= { feitas: 0, certas: 0 });
    a.feitas++;
    if (x.ultima) a.certas++;
  }
  return r;
}

export default async function inicio(el, ctx) {
  const { servico, conteudo, sessao, casca } = ctx;
  casca?.definirTitulo('');
  const [ufba, indice, questoes] = await Promise.all([conteudo.concurso('ufba-2026'), conteudo.indice(), conteudo.questoes().catch(() => [])]);

  const render = (trocando = false) => {
    const p = servico.progresso;
    const n = nivel(p.xp);
    const hoje = diaIso();
    const minHoje = p.tempo?.[hoje] ?? 0;
    const meta = p.meta?.diariaMin ?? 60;
    const venc = servico.vencidas().length;
    const cargo = trocando ? null : cargoAlvo(p, ufba);
    const dataP = dataProva(ufba, cargo);
    const dias = diasAte(dataP);
    const des = desempenho(p.respostas, questoes);
    const semana = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - k); return p.tempo?.[diaIso(d)] ?? 0; }).reduce((a, b) => a + b, 0);

    // Próximos passos.
    const tarefas = [];
    if (venc) tarefas.push(['#/revisoes', 'cerebro', `Revisar ${venc} item(ns) vencido(s)`, 'Revisão espaçada: o melhor momento para não esquecer é agora.']);
    const emAndamento = indice.aulas.find((a) => p.aulas?.[a.id]?.visto && !p.aulas[a.id].concluida);
    if (emAndamento) tarefas.push([`#/aulas/${emAndamento.id}`, 'slides', `Continuar: ${emAndamento.titulo}`, `${p.aulas[emAndamento.id].visto} de ${emAndamento.slides} slides`]);
    const prova = cargo ? provaPorArea(cargo) : [];
    if (prova.length) {
      const prioridade = [...prova].sort((a, b) => (b.pontos * (1 - (des[b.area]?.certas ?? 0) / Math.max(1, des[b.area]?.feitas ?? 0))) - (a.pontos * (1 - (des[a.area]?.certas ?? 0) / Math.max(1, des[a.area]?.feitas ?? 0))))[0];
      const aulaSug = indice.aulas.find((a) => a.area === prioridade.area && !p.aulas?.[a.id]?.concluida && (a.cargos.includes('todos') || a.cargos.includes(cargo.codigo)));
      if (aulaSug && aulaSug.id !== emAndamento?.id) tarefas.push([`#/aulas/${aulaSug.id}`, 'alvo', `Próxima aula: ${aulaSug.titulo}`, `${AREAS[prioridade.area]?.nome} vale ${prioridade.pontos} pontos na sua prova`]);
      tarefas.push([`#/questoes?area=${prioridade.area}`, 'questoes', `Praticar ${AREAS[prioridade.area]?.curto ?? ''}`, 'Área com maior peso × menor domínio no momento']);
    }
    if (!p.simulados?.some((s) => diasAte(s.data.split('-').reverse().join('/')) > -7)) tarefas.push(['#/simulado', 'simulado', 'Fazer o simulado da semana', 'No formato do edital: 60 questões, 5 alternativas']);
    const labsCargo = cargo ? labsDoCargo(ufba, cargo).filter((id) => LABS[id]) : [];
    const labSug = labsCargo.find((id) => !Object.keys(p.missoes).some((k) => k.startsWith(`${id}/`))) ?? labsCargo[0];
    if (labSug) tarefas.push([`#/lab/${labSug}`, LABS[labSug].icone ?? 'frasco', `Laboratório: ${LABS[labSug].nome}`, LABS[labSug].resumo]);
    if (!tarefas.length) tarefas.push(['#/aulas', 'slides', 'Escolha uma aula para começar', 'Aulas em slides com questões e flashcards']);

    el.innerHTML = `
      <div class="saudacao">
        <div><span class="sobretitulo">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>${saudacao()}${sessao.conta ? `, ${esc(sessao.conta.nome.split(' ')[0])}` : ''}!</h1></div>
        ${dias >= 0 ? `<div class="direita"><div class="contagem">${dias}</div><div class="pequeno muted">dias para a prova (${esc(dataP)})</div></div>` : ''}
      </div>
      ${sessao.visitante ? `<div class="aviso info mb3 linha entre"><div><strong>${ic('cadeado')} Você está sem conta.</strong> O progresso fica só neste navegador, sem senha. Crie uma conta para cifrar seus dados e levá-los a outros aparelhos com backup.</div><button class="btn primario" type="button" data-criar>Criar conta</button></div>` : ''}

      <div class="grade-4 mb3">
        <div class="card linha nw" style="gap:16px">${anel(Math.min(100, pct(minHoje, meta)), { rotulo: `${minHoje}′`, sub: `de ${meta} min` })}<div><div class="forte">Meta de hoje</div><div class="mini sutil">${minHoje >= meta ? 'Meta cumprida!' : `Faltam ${meta - minHoje} min`}</div><button class="btn fantasma peq" type="button" data-meta>${ic('ajustes')} Ajustar</button></div></div>
        <div class="card"><div class="linha" style="gap:8px"><span class="chip-area" style="--cor:#f97316">${ic('fogo')}</span><div><div class="contagem" style="font-size:1.8rem">${sequencia(p.dias)}</div><div class="mini sutil">dia(s) seguidos</div></div></div></div>
        <a class="card" href="#/revisoes"><div class="linha" style="gap:8px"><span class="chip-area">${ic('cerebro')}</span><div><div class="contagem" style="font-size:1.8rem">${venc}</div><div class="mini sutil">revisões para hoje</div></div></div></a>
        <a class="card" href="#/progresso"><div class="linha entre"><div><div class="forte">Nível ${n.numero}</div><div class="mini sutil">${esc(n.titulo)} · ${p.xp} XP</div></div><span class="chip-area" style="--cor:var(--acento)">${ic('estrela')}</span></div><div class="mt1">${barra(n.pct)}</div><div class="mini sutil mt1">${n.prox ? `${n.prox - p.xp} XP para o próximo nível` : 'Nível máximo'}</div></a>
      </div>

      <div class="split mb3">
        <section class="card"><div class="card-cab"><h2>Próximos passos</h2><span class="mini sutil">sugeridos pelo seu progresso</span></div>
          <div class="pilha p">${tarefas.slice(0, 5).map(([h, i, t, d]) => `<a class="tarefa" href="${h}"><span class="chip-area">${ic(i)}</span><span style="min-width:0"><span class="tt">${esc(t)}</span><br><span class="ds">${esc(d)}</span></span>${ic('dir', 'seta')}</a>`).join('')}</div></section>
        <section class="card"><div class="card-cab"><h3>Constância</h3><span class="mini sutil">${semana} min nesta semana</span></div>${mapaCalor(p.tempo ?? {}, 17)}
          <div class="linha mini sutil mt1" style="gap:6px">Menos <span class="calor" style="grid-template-rows:12px"><i></i><i data-n="1"></i><i data-n="2"></i><i data-n="3"></i><i data-n="4"></i></span> Mais</div></section>
      </div>

      ${cargo ? painelCargo(ufba, cargo, des, p) : `<section class="painel mb3"><span class="sobretitulo">Concurso UFBA 2026 · Edital nº 007/2026</span>
        <h2 class="mt0">Para qual cargo você vai prestar?</h2><p class="muted">O painel, a ordem das aulas, o simulado e as recomendações passam a seguir o peso das disciplinas do seu cargo.</p>
        <form class="linha" data-form-cargo style="max-width:640px">${seletorCargo(ufba, p.alvo?.cargo)}<button class="btn primario" type="submit">Definir meu cargo</button></form></section>`}

      <div class="secao-titulo"><h2>Atalhos</h2><span class="linha-fina"></span></div>
      <div class="grid peq">${[['#/aulas', 'slides', 'Aulas', `${indice.aulas.length} aulas em slides`], ['#/questoes', 'questoes', 'Questões', `${indice.questoes.total} comentadas`], ['#/simulado', 'simulado', 'Simulado', 'Formato do edital'], ['#/laboratorios', 'frasco', 'Laboratórios', `${Object.keys(LABS).length} ambientes práticos`], ['#/lab/code', 'codigo', 'Code Studio', 'Editor do VS Code + runtimes reais'], ['#/plano', 'calendario', 'Meu plano', 'Cronograma até a prova']].map(([h, i, t, d]) => `<a class="card" href="${h}"><span class="chip-area">${ic(i)}</span><h3 class="mt1 mb0" style="font-size:.98rem">${t}</h3><span class="mini sutil">${d}</span></a>`).join('')}</div>`;

    el.querySelector('[data-form-cargo]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const cod = new FormData(e.currentTarget).get('cargo');
      const c = ufba.cargos.find((x) => x.codigo === cod);
      if (c) { servico.definirAlvo({ concurso: ufba.id, cargo: cod, nome: c.nome }); toast(`Cargo definido: ${c.nome}.`, { tipo: 'ok' }); render(); }
    });
    el.querySelector('[data-trocar]')?.addEventListener('click', () => render(true));
    el.querySelector('[data-criar]')?.addEventListener('click', () => document.getElementById('abrirConta')?.click());
    el.querySelector('[data-meta]')?.addEventListener('click', async () => {
      const v = Number(await pedir({ titulo: 'Meta diária', rotulo: 'Minutos de estudo por dia', valor: meta, tipo: 'number', min: 10, max: 720, ajuda: 'Conta o tempo com o Concurso Lab aberto e em uso.' }));
      if (v >= 10 && v <= 720) { servico.definirMeta({ diariaMin: Math.round(v) }); render(); }
    });
  };

  function painelCargo(concurso, cargo, des, p) {
    const prova = provaPorArea(cargo);
    const maxPts = Math.max(...prova.map((d) => d.pontos), 1);
    return `<section class="painel mb3" aria-labelledby="tituloProva">
      <div class="linha entre topo-al"><div><span class="sobretitulo">Sua prova · ${esc(concurso.banca)}</span>
        <h2 id="tituloProva" class="mt0 mb0">${esc(cargo.codigo)} – ${esc(cargo.nome)}</h2>
        <p class="mini sutil mb0 mt1">UFBA 2026 · nível ${cargo.nivel === 'D' ? 'médio' : 'superior'} · ${esc(cargo.campus)} · ${cargo.vagas.total} vaga(s) · fases: ${cargo.fases.map((f) => ({ objetiva: 'objetiva', redacao: 'redação', titulos: 'títulos', oral: 'oral/prática', pratica: 'prática' }[f])).join(', ')}</p></div>
        <div class="linha"><a class="btn" href="#/concursos/${concurso.id}/cargo/${encodeURIComponent(cargo.codigo)}">${ic('arquivoTexto')} Conteúdo</a><a class="btn" href="#/concursos/${concurso.id}/matriz?cargo=${encodeURIComponent(cargo.codigo)}">${ic('grade')} Matriz</a><button class="btn fantasma" type="button" data-trocar>Trocar cargo</button></div></div>
      ${prova.length ? `<div class="grade-2 mt2">${prova.map((d) => {
        const a = AREAS[d.area];
        const x = des[d.area] ?? { feitas: 0, certas: 0 };
        const taxa = x.feitas ? pct(x.certas, x.feitas) : null;
        return `<div class="card plano"><div class="linha entre"><div class="linha nw" style="gap:10px"><span class="chip-area" style="--cor:${a?.cor}">${ic(a?.icone ?? 'livro')}</span><div><div class="forte">${esc(d.disciplina)}</div><div class="mini sutil">${d.questoes} questões × ${d.valor} = <strong>${d.pontos} pts</strong></div></div></div>
          <div class="direita"><div class="forte">${taxa == null ? '—' : `${taxa}%`}</div><div class="mini sutil">${x.feitas} resolvidas</div></div></div>
          <div class="mt1">${barra(pct(d.pontos, maxPts))}</div>
          <div class="linha mt1"><a class="btn peq" href="#/aulas?area=${d.area}">Aulas</a><a class="btn peq" href="#/questoes?area=${d.area}">Questões</a></div></div>`;
      }).join('')}</div>
      <p class="mini sutil mt2 mb0">Aprovação na objetiva: 50% dos pontos, sem zerar nenhuma área. ${cargo.fases.includes('redacao') ? 'Redação: 60 pontos (mínimo 30), dissertativo-argumentativa de 20 a 30 linhas — treine no <a href="#/lab/redacao">laboratório de Redação</a>.' : ''}</p>` : '<p>Prova prática única (100 pontos). Veja o repertório no conteúdo do cargo e use o <a href="#/lab/musica">laboratório de Música</a> (metrônomo e afinador).</p>'}
    </section>`;
  }

  render();
  const parar = servico.ouvir(() => { if (el.isConnected) render(); });
  return parar;
}

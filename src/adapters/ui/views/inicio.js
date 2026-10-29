// Painel inicial: meta do dia, sequência, revisões, próximos passos, mapa de calor e a prova do cargo-alvo.
import { esc, ic, barra, pct, anel, mapaCalor, diaIso, diasAte, toast, pedir } from '../dom.js';
import { nivel, sequencia } from '../../../domain/gamification.js';
import { AREAS, provaPorArea, areaV2 } from '../../../domain/areas.js';
import { cargoAlvo, seletorCargo, labsDoCargo, dataProva, concursoAlvoId, nomeNivel, rotuloCargo } from '../componentes/cargo.js';
import { aulaDoCargo } from '../../../application/escopo.js';
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
  // Concursos com edital detalhado (UFBA) ou modelo base; o seletor troca o concurso sem perder o cargo-alvo atual.
  const [catalogo, inicial] = await Promise.all([conteudo.concursos(), conteudo.concurso(concursoAlvoId(servico.progresso))]);
  const detalhados = catalogo.concursos.filter((c) => c.detalhe);
  let conc = inicial;
  // O conteúdo liberado depende do cargo: recarrega ao definir/trocar.
  let indice, questoes;
  const carregar = async () => { [indice, questoes] = await Promise.all([conteudo.indice(), conteudo.questoes().catch(() => [])]); };
  await carregar();

  const render = (trocando = false) => {
    const p = servico.progresso;
    const n = nivel(p.xp);
    const hoje = diaIso();
    const minHoje = p.tempo?.[hoje] ?? 0;
    const meta = p.meta?.diariaMin ?? 60;
    const venc = servico.vencidas().length;
    const cargo = trocando ? null : cargoAlvo(p, conc);
    const dataP = dataProva(conc, cargo);
    const dias = dataP ? diasAte(dataP) : -1;
    const des = desempenho(p.respostas, questoes);
    const semana = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - k); return p.tempo?.[diaIso(d)] ?? 0; }).reduce((a, b) => a + b, 0);
    const totalSlides = indice.aulas.reduce((s, a) => s + a.slides, 0);
    const totalCartoes = indice.aulas.reduce((s, a) => s + a.cartoes, 0);
    const totalLabs = Object.keys(LABS).length;

    // Próximos passos.
    const tarefas = [];
    if (venc) tarefas.push(['#/revisoes', 'cerebro', `Revisar ${venc} item(ns) vencido(s)`, 'Revisão espaçada: o melhor momento para não esquecer é agora.']);
    if (!cargo && indice.aulas.length) tarefas.push(['#/aulas', 'slides', `Começar: ${indice.aulas[0].titulo}`, `${indice.aulas.length} aulas em ${new Set(indice.aulas.map((a) => a.area)).size} áreas já liberadas`]);
    const emAndamento = indice.aulas.find((a) => p.aulas?.[a.id]?.visto && !p.aulas[a.id].concluida);
    if (emAndamento) tarefas.push([`#/aulas/${emAndamento.id}`, 'slides', `Continuar: ${emAndamento.titulo}`, `${p.aulas[emAndamento.id].visto} de ${emAndamento.slides} slides`]);
    const prova = cargo ? provaPorArea(cargo) : [];
    if (prova.length) {
      const prioridade = [...prova].sort((a, b) => (b.pontos * (1 - (des[b.area]?.certas ?? 0) / Math.max(1, des[b.area]?.feitas ?? 0))) - (a.pontos * (1 - (des[a.area]?.certas ?? 0) / Math.max(1, des[a.area]?.feitas ?? 0))))[0];
      const aulaSug = indice.aulas.find((a) => a.area === prioridade.area && !p.aulas?.[a.id]?.concluida && aulaDoCargo(a, cargo));
      if (aulaSug && aulaSug.id !== emAndamento?.id) tarefas.push([`#/aulas/${aulaSug.id}`, 'alvo', `Próxima aula: ${aulaSug.titulo}`, `${AREAS[prioridade.area]?.nome} vale ${prioridade.pontos} pontos na sua prova`]);
      tarefas.push([`#/questoes?area=${prioridade.area}`, 'questoes', `Praticar ${AREAS[prioridade.area]?.curto ?? ''}`, 'Área com maior peso × menor domínio no momento']);
    }
    if (!p.simulados?.some((s) => diasAte(s.data.split('-').reverse().join('/')) > -7)) tarefas.push(['#/simulado', 'simulado', 'Fazer o simulado da semana', 'No formato da prova do seu cargo']);
    const labsCargo = cargo ? labsDoCargo(conc, cargo).filter((id) => LABS[id]) : [];
    const labSug = labsCargo.find((id) => !Object.keys(p.missoes).some((k) => k.startsWith(`${id}/`))) ?? labsCargo[0];
    if (labSug) tarefas.push([`#/lab/${labSug}`, LABS[labSug].icone ?? 'frasco', `Laboratório: ${LABS[labSug].nome}`, LABS[labSug].resumo]);
    if (!tarefas.length) tarefas.push(['#/aulas', 'slides', 'Escolha uma aula para começar', 'Aulas em slides com questões e flashcards']);

    el.innerHTML = `
      <div class="saudacao">
        <div><span class="sobretitulo">Concurso Lab · acervo aberto</span>
          <h1>${saudacao()}${sessao.conta ? `, ${esc(sessao.conta.nome.split(' ')[0])}` : ''}!</h1><p class="muted mb0">Estude todas as áreas ou personalize o percurso pelo seu edital. Seu progresso fica salvo neste aparelho.</p></div>
        <div class="linha"><a class="btn primario" href="#/aulas">${ic('play')} Começar a estudar</a><a class="btn" href="#/laboratorios">${ic('frasco')} Laboratórios</a></div>
      </div>
      <div class="area-resumo mb3"><div><strong>${indice.aulas.length} aulas em ${new Set(indice.aulas.map((a) => a.area)).size} áreas</strong><span>${totalSlides} slides · ${totalCartoes} flashcards · ${questoes.length} questões comentadas · ${totalLabs} laboratórios</span></div><a class="btn" href="#/areas">${ic('grade')} Explorar o sistema</a></div>
      <div class="saudacao">
        <div><span class="sobretitulo">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h2 class="mt0">Seu ritmo de preparação</h2></div>
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

      ${cargo ? painelCargo(conc, cargo, des, p) : `<section class="painel mb3"><span class="sobretitulo">${detalhados.length} concursos detalhados · edital real ou modelo base</span>
        <h2 class="mt0">Personalizar recomendações pelo edital <span class="tag">opcional</span></h2><p class="muted">O sistema já libera todas as áreas. Selecione seu cargo para ver pesos, matriz e simulados fiéis ao seu edital — sem bloquear as outras trilhas.</p>
        <form class="linha" data-form-cargo style="max-width:860px"><select name="concurso" aria-label="Concurso">${detalhados.map((c) => `<option value="${esc(c.detalhe)}" ${c.detalhe === conc.id ? 'selected' : ''}>${esc(c.nome ?? c.orgao)}${c.tipo === 'Modelo base' ? ' (modelo)' : ''}</option>`).join('')}</select>${seletorCargo(conc, p.alvo?.cargo)}<button class="btn primario" type="submit">Definir cargo-alvo</button><a class="btn" href="#/areas">Explorar todas as áreas</a></form></section>`}

      <div class="secao-titulo"><h2>Estude por área</h2><span class="linha-fina"></span><a class="btn peq" href="#/areas">Ver todas</a></div>
      <div class="grid peq mb3">${Object.entries(AREAS).filter(([a]) => a !== 'outras' && (indice.aulas.some((x) => x.area === a) || questoes.some((x) => x.area === a) || Object.values(LABS).some((l) => l.area === a))).map(([a, metaArea]) => {
        const aulasArea = indice.aulas.filter((x) => x.area === a);
        const nAulas = aulasArea.length;
        const nQuestoes = questoes.filter((x) => x.area === a).length;
        const primeiraAula = aulasArea.slice().sort((x, y) => x.ordem - y.ordem)[0];
        return `<a class="card" href="#/aulas?area=${encodeURIComponent(a)}"><span class="chip-area" style="--cor:${metaArea.cor}">${ic(metaArea.icone)}</span><h3 class="mt1 mb0">${esc(metaArea.curto)}</h3><span class="mini sutil">${nAulas} aulas · ${nQuestoes} questões</span>${primeiraAula ? `<span class="mini sutil mt1">Começar: ${esc(primeiraAula.titulo)}</span>` : '<span class="mini sutil mt1">Ver questões e laboratórios disponíveis</span>'}</a>`;
      }).join('')}</div>

      <div class="secao-titulo"><h2>Atalhos</h2><span class="linha-fina"></span></div>
      <div class="grid peq">${[['#/areas', 'grade', 'Todas as áreas', `${Object.keys(AREAS).length - 1} áreas de estudo`], ['#/aulas', 'slides', 'Aulas', `${indice.aulas.length} aulas · ${indice.aulas.reduce((s, a) => s + a.slides, 0)} slides`], ['#/questoes', 'questoes', 'Questões', `${questoes.length} comentadas`], ['#/simulado', 'simulado', 'Simulado', 'Por área ou pelo edital'], ['#/laboratorios', 'frasco', 'Laboratórios', `${Object.keys(LABS).length} ambientes registrados`], ['#/plano', 'calendario', 'Meu plano', 'Cronograma até a prova']].map(([h, i, t, d]) => `<a class="card" href="${h}"><span class="chip-area">${ic(i)}</span><h3 class="mt1 mb0" style="font-size:.98rem">${t}</h3><span class="mini sutil">${d}</span></a>`).join('')}</div>`;

    el.querySelector('[data-form-cargo]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cod = new FormData(e.currentTarget).get('cargo');
      const c = conc.cargos.find((x) => x.codigo === cod);
      if (c) { servico.definirAlvo({ concurso: conc.id, cargo: cod, nome: c.nome }); toast(`Cargo definido: ${c.nome}. O conteúdo de estudo foi liberado para ele.`, { tipo: 'ok' }); await carregar(); render(); }
    });
    el.querySelector('[data-form-cargo] [name=concurso]')?.addEventListener('change', async (e) => { conc = await conteudo.concurso(e.target.value); render(true); });
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
        <h2 id="tituloProva" class="mt0 mb0">${esc(rotuloCargo(cargo))}</h2>
        <p class="mini sutil mb0 mt1">${esc(concurso.sigla ?? concurso.orgao)} · nível ${nomeNivel(cargo.nivel)}${cargo.campus ? ` · ${esc(cargo.campus)}` : ''}${cargo.vagas ? ` · ${cargo.vagas.total} vaga(s)` : ''} · fases: ${cargo.fases.map((f) => ({ objetiva: 'objetiva', redacao: 'redação', discursiva: 'discursiva', titulos: 'títulos', oral: 'oral/prática', pratica: 'prática', fisico: 'teste físico' }[f])).join(', ')}</p></div>
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
      <p class="mini sutil mt2 mb0">${esc(concurso.aprovacao ?? 'Aprovação na objetiva: 50% dos pontos, sem zerar nenhuma área.')} ${cargo.fases.includes('redacao') ? `${esc(concurso.redacaoResumo ?? 'Redação:')} Treine no <a href="#/lab/redacao">laboratório de Redação</a>.` : ''}</p>` : '<p>Prova prática única (100 pontos). Veja o repertório no conteúdo do cargo e use o <a href="#/lab/musica">laboratório de Música</a> (metrônomo e afinador).</p>'}
    </section>`;
  }

  render();
  const parar = servico.ouvir(() => { if (el.isConnected) render(); });
  return parar;
}

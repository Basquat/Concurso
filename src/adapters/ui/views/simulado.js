// Simulados: prova completa no formato do edital do cargo, simulado rápido ou por área. Cronômetro, mapa de
// questões, marcação para revisar, retomada após recarregar, resultado ponderado e histórico.
import { esc, ic, cabecalho, barra, pct, confirmar, graficoLinha, toast } from '../dom.js';
import { AREAS, provaPorArea } from '../../../domain/areas.js';
import { comporSimulado, apurarProva } from '../../../domain/simulado.js';
import { htmlQuestao, atalhosQuestao } from '../componentes/questao.js';
import { cargoAlvo } from '../componentes/cargo.js';

const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default async function simulado(el, { servico, conteudo, sessao, casca }) {
  casca?.definirTitulo('Simulados');
  const [todas, ufba] = await Promise.all([conteudo.questoes(), conteudo.concurso('ufba-2026')]);
  const porId = new Map(todas.map((q) => [q.id, q]));
  const cargo = cargoAlvo(servico.progresso, ufba);
  let relogio = null;
  let teclas = null;
  const parar = () => { clearInterval(relogio); teclas?.parar(); };

  const preferir = (q) => (servico.progresso.respostas[q.id] ? (servico.progresso.respostas[q.id].ultima ? 2 : 1) : 0);

  function configurar() {
    parar();
    const andamento = sessao.ler('simulado:atual');
    const comp = cargo ? provaPorArea(cargo) : [];
    const hist = (servico.progresso.simulados ?? []).slice(-12);
    const areas = [...new Set(todas.map((q) => q.area))];
    el.innerHTML = `${cabecalho({ sobre: 'Praticar', titulo: 'Simulados', texto: 'Como na prova: você marca as respostas e só vê o gabarito ao entregar. Pontuação ponderada pelo edital e o critério real de aprovação.' })}
      ${andamento ? `<div class="aviso alerta mb3 linha entre"><div><strong>Simulado em andamento</strong> · ${Object.keys(andamento.respostas).length} de ${andamento.ids.length} respondidas.</div><div class="linha"><button class="btn primario" type="button" data-continuar>Continuar</button><button class="btn perigo" type="button" data-descartar>Descartar</button></div></div>` : ''}
      <div class="grade-3">
        <div class="card cartao-lab"><span class="chip-area">${ic('predio')}</span><h3>Prova do meu cargo</h3>
          <p>${cargo ? `${esc(cargo.codigo)} – ${esc(cargo.nome)}: ${comp.map((d) => `${d.questoes} ${AREAS[d.area]?.curto}`).join(' · ')}. 60 questões, 3 h (na prova real, 4 h incluem a redação).` : 'Defina seu cargo no Início para montar a prova com a composição do edital.'}</p>
          <button class="btn primario" type="button" data-modo="cargo" ${cargo?.objetiva ? '' : 'disabled'}>${ic('play')} Começar</button></div>
        <div class="card cartao-lab"><span class="chip-area">${ic('raio')}</span><h3>Simulado rápido</h3><p>20 questões ${cargo ? 'na proporção do seu cargo' : 'variadas'}, 45 minutos.</p>
          <button class="btn" type="button" data-modo="rapido">${ic('play')} Começar</button></div>
        <form class="card cartao-lab" data-form-area><span class="chip-area">${ic('alvo')}</span><h3>Por área</h3>
          <select name="area">${areas.map((a) => `<option value="${a}">${esc(AREAS[a]?.nome ?? a)} (${todas.filter((q) => q.area === a).length})</option>`).join('')}</select>
          <div class="linha"><label class="campo" style="flex:1">Questões<input type="number" name="n" value="15" min="3" max="60"></label><label class="campo" style="flex:1">Minutos<input type="number" name="min" value="35" min="5" max="240"></label></div>
          <button class="btn" type="submit">${ic('play')} Começar</button></form>
      </div>
      <div class="secao-titulo"><h2>Histórico</h2><span class="linha-fina"></span></div>
      ${hist.length ? `<div class="card">${graficoLinha(hist.map((s) => ({ rotulo: s.data.slice(5).split('-').reverse().join('/'), valor: s.max ? pct(s.pontos, s.max) : pct(s.acertos, s.total) })), { max: 100, formato: (v) => `${v}%` })}
        <div class="rolagem"><table class="tabela compacta mt2"><thead><tr><th>Data</th><th>Tipo</th><th class="num">Acertos</th><th class="num">Pontos</th><th class="num">Tempo</th><th>Situação</th></tr></thead><tbody>${[...hist].reverse().map((s) => `<tr><td>${s.data.split('-').reverse().join('/')}</td><td>${esc({ cargo: 'Prova do cargo', rapido: 'Rápido', area: 'Por área' }[s.modo] ?? 'Simulado')}</td><td class="num">${s.acertos}/${s.total}</td><td class="num">${s.max ? `${s.pontos}/${s.max}` : '—'}</td><td class="num">${fmt(s.segundos ?? 0)}</td><td>${s.aprovado == null ? '—' : s.aprovado ? '<span class="tag ok">aprovado</span>' : '<span class="tag erro">abaixo</span>'}</td></tr>`).join('')}</tbody></table></div></div>` : '<div class="vazio">Nenhum simulado ainda. O primeiro vale +30 XP.</div>'}`;

    el.querySelector('[data-continuar]')?.addEventListener('click', () => prova(andamento));
    el.querySelector('[data-descartar]')?.addEventListener('click', async () => { if (await confirmar('Descartar o simulado em andamento?', { perigo: true, sim: 'Descartar' })) { sessao.apagar('simulado:atual'); configurar(); } });
    el.querySelectorAll('[data-modo]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.modo === 'cargo') criar('cargo', comp.map((d) => ({ area: d.area, disciplina: d.disciplina, n: d.questoes, valor: d.valor })), 3 * 3600);
      else {
        const base = comp.length ? comp : [...new Set(todas.map((q) => q.area))].map((a) => ({ area: a, disciplina: AREAS[a]?.nome, questoes: 1, valor: 1 }));
        const soma = base.reduce((s, d) => s + d.questoes, 0);
        let resto = 20;
        const partes = base.map((d, k) => { const n = k === base.length - 1 ? resto : Math.max(1, Math.round((d.questoes / soma) * 20)); resto -= n; return { area: d.area, disciplina: d.disciplina, n: Math.max(0, n), valor: d.valor }; });
        criar('rapido', partes, 45 * 60);
      }
    }));
    el.querySelector('[data-form-area]').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      criar('area', [{ area: f.get('area'), n: Math.max(3, Math.min(60, Number(f.get('n')) || 15)), valor: 1 }], Math.max(5, Number(f.get('min')) || 35) * 60);
    });
  }

  function criar(modo, composicao, segundos) {
    const { itens, faltas } = comporSimulado(todas, composicao, { preferir });
    if (!itens.length) return toast('Ainda não há questões suficientes para esse simulado.', { tipo: 'erro' });
    if (faltas.length) toast(`O banco ainda não tem questões suficientes em: ${faltas.map((f) => `${AREAS[f.area]?.curto} (${f.obtido}/${f.pedido})`).join(', ')}. O simulado foi montado com o que existe.`, { ms: 8000 });
    const st = { modo, ids: itens.map((i) => i.q.id), areas: itens.map((i) => i.area), disciplinas: itens.map((i) => i.disciplina), valores: itens.map((i) => i.valor), respostas: {}, marcadas: [], atual: 0, inicio: Date.now(), duracao: segundos };
    sessao.gravar('simulado:atual', st);
    prova(st);
  }

  function prova(st) {
    parar();
    const itens = st.ids.map((id, k) => ({ q: porId.get(id), area: st.areas[k], disciplina: st.disciplinas[k], valor: st.valores[k] })).filter((i) => i.q);
    const salvar = () => sessao.gravar('simulado:atual', st);
    el.innerHTML = `<div class="linha entre mb2" style="position:sticky;top:var(--topo);z-index:5;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--borda)">
        <div class="linha"><strong>Simulado</strong><span class="tag" id="resp"></span></div>
        <div class="linha"><span class="chip mono" id="tempo">${ic('relogio')} --:--:--</span><button class="btn" type="button" data-sair>${ic('pausa')} Pausar</button><button class="btn primario" type="button" data-entregar>${ic('ok')} Entregar</button></div></div>
      <div class="split"><div id="area"></div>
        <aside class="card"><h3 class="mt0">Mapa da prova</h3><div class="mapa-q" id="mapa"></div>
        <p class="mini sutil mt2 mb0">Azul: respondida · contorno: atual · ${ic('bandeira')} marcada para revisar. Atalhos: 1–5 marcam, ← → navegam.</p></aside></div>`;
    const area = el.querySelector('#area');

    const mapa = () => {
      el.querySelector('#mapa').innerHTML = itens.map((it, k) => `<button type="button" data-ir="${k}" class="${st.respostas[it.q.id] != null ? 'resp' : ''} ${k === st.atual ? 'atual' : ''}" title="${esc(it.disciplina)}">${k + 1}${st.marcadas.includes(it.q.id) ? '⚑' : ''}</button>`).join('');
      el.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { st.atual = Number(b.dataset.ir); salvar(); mostrar(); }));
      el.querySelector('#resp').textContent = `${Object.keys(st.respostas).length}/${itens.length} respondidas`;
    };
    const mostrar = () => {
      const it = itens[st.atual];
      area.innerHTML = htmlQuestao(it.q, { numero: st.atual + 1, total: itens.length, escolha: st.respostas[it.q.id] ?? null, nome: `sim-${it.q.id}` });
      const acoes = area.querySelector('.acoes-questao');
      const marcada = st.marcadas.includes(it.q.id);
      acoes.innerHTML = `<button class="btn" type="button" data-ant ${st.atual ? '' : 'disabled'}>${ic('esq')} Anterior</button><button class="btn ${marcada ? 'sec' : 'fantasma'}" type="button" data-marcar>${ic('bandeira')} ${marcada ? 'Marcada' : 'Marcar para revisar'}</button><span class="espaco"></span><button class="btn primario" type="button" data-prox>${st.atual < itens.length - 1 ? 'Próxima' : 'Revisar e entregar'} ${ic('dir')}</button>`;
      area.querySelectorAll('input[type=radio]').forEach((r) => r.addEventListener('change', () => { st.respostas[it.q.id] = Number(r.value); salvar(); mapa(); }));
      acoes.querySelector('[data-ant]').onclick = () => { st.atual--; salvar(); mostrar(); };
      acoes.querySelector('[data-prox]').onclick = () => { if (st.atual < itens.length - 1) { st.atual++; salvar(); mostrar(); } else entregar(); };
      acoes.querySelector('[data-marcar]').onclick = () => { st.marcadas = marcada ? st.marcadas.filter((x) => x !== it.q.id) : [...st.marcadas, it.q.id]; salvar(); mostrar(); };
      teclas?.parar();
      teclas = atalhosQuestao(area, it.q, (k) => { const r = area.querySelectorAll('input[type=radio]')[k]; if (r) { r.checked = true; r.dispatchEvent(new Event('change')); } }, () => acoes.querySelector('[data-prox]').click());
      mapa();
      window.scrollTo({ top: 0 });
    };
    const navegar = (e) => {
      if (!el.isConnected) return removeEventListener('keydown', navegar);
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && document.activeElement.type !== 'radio') return;
      if (e.key === 'ArrowRight' && st.atual < itens.length - 1) { st.atual++; salvar(); mostrar(); }
      if (e.key === 'ArrowLeft' && st.atual > 0) { st.atual--; salvar(); mostrar(); }
    };
    addEventListener('keydown', navegar);
    const tique = () => {
      const resta = Math.max(0, Math.round((st.inicio + st.duracao * 1000 - Date.now()) / 1000));
      const t = el.querySelector('#tempo');
      if (!t) return parar();
      t.innerHTML = `${ic('relogio')} ${fmt(resta)}`;
      t.style.color = resta < 600 ? 'var(--erro)' : '';
      if (resta === 0) { toast('Tempo esgotado! Prova entregue.', { tipo: 'erro', ms: 6000 }); entregar(true); }
    };
    relogio = setInterval(tique, 1000);
    tique();
    el.querySelector('[data-sair]').onclick = () => { removeEventListener('keydown', navegar); configurar(); toast('Simulado pausado. O cronômetro continua correndo, como na prova.'); };
    async function entregar(forcado = false) {
      const faltam = itens.length - Object.keys(st.respostas).length;
      if (!forcado && !(await confirmar(faltam ? `Ainda há ${faltam} questão(ões) sem resposta. Entregar mesmo assim?` : 'Entregar a prova e ver o resultado?', { titulo: 'Entregar', sim: 'Entregar' }))) return;
      removeEventListener('keydown', navegar);
      parar();
      const r = apurarProva(itens, st.respostas);
      const segundos = Math.min(st.duracao, Math.round((Date.now() - st.inicio) / 1000));
      // Cada questão respondida também alimenta as revisões e as estatísticas.
      itens.forEach((it) => { if (st.respostas[it.q.id] != null) servico.responder(it.q, st.respostas[it.q.id]); });
      servico.concluirSimulado({ acertos: r.acertos, total: r.total, segundos, pontos: r.pontos, max: r.max, modo: st.modo, aprovado: st.modo === 'cargo' ? r.aprovado : null });
      sessao.apagar('simulado:atual');
      resultado(itens, st, r, segundos);
    }
    el.querySelector('[data-entregar]').onclick = () => entregar();
    mostrar();
  }

  function resultado(itens, st, r, segundos) {
    el.innerHTML = `${cabecalho({ sobre: 'Resultado do simulado', titulo: `${r.pontos} de ${r.max} pontos (${r.pct}%)`, texto: `${r.acertos} de ${r.total} questões certas em ${fmt(segundos)}.` })}
      ${st.modo === 'cargo' ? `<div class="aviso ${r.aprovado ? 'ok' : 'erro'} mb3"><strong>${r.aprovado ? 'Acima da nota de corte da objetiva.' : 'Abaixo do critério de aprovação.'}</strong> O edital exige 50% dos pontos sem zerar nenhuma área${r.zerou ? ' — você zerou pelo menos uma área' : ''}.</div>` : ''}
      <div class="card mb3"><h3 class="mt0">Desempenho por área</h3>
        <div class="pilha">${Object.entries(r.porArea).map(([a, x]) => `<div class="barra-peso"><span>${ic(AREAS[a]?.icone ?? 'livro')} ${esc(x.disciplina || AREAS[a]?.nome)}</span><span class="mono pequeno">${x.acertos}/${x.total} · ${x.pontos}/${x.max} pts</span>${barra(pct(x.pontos, x.max), x.acertos ? '' : '')}</div>`).join('')}</div></div>
      <div class="linha mb3"><button class="btn primario" type="button" data-novo>${ic('recarregar')} Novo simulado</button><a class="btn" href="#/revisoes">${ic('cerebro')} Ir para revisões</a></div>
      <div class="secao-titulo"><h2>Gabarito comentado</h2><span class="linha-fina"></span></div>
      <div class="pilha g">${itens.map((it, k) => htmlQuestao(it.q, { numero: k + 1, total: itens.length, escolha: st.respostas[it.q.id] ?? null, revelada: true, nome: `res-${it.q.id}` })).join('')}</div>`;
    el.querySelector('[data-novo]').onclick = configurar;
  }

  // Simulado vencido enquanto a página estava fechada é entregue automaticamente ao continuar.
  configurar();
  return parar;
}

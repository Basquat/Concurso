// Progresso: nível, conquistas, desempenho por área e disciplina, tempo de estudo e laboratórios.
import { esc, ic, cabecalho, barra, pct, mapaCalor, graficoBarras, diaIso } from '../dom.js';
import { nivel, sequencia, conquistas, NIVEIS } from '../../../domain/gamification.js';
import { AREAS, areaV2 } from '../../../domain/areas.js';
import { LABS } from '../labs/registro.js';

export default async function progresso(el, { servico, conteudo, casca }) {
  casca?.definirTitulo('Progresso');
  const [questoes, indice] = await Promise.all([conteudo.questoes().catch(() => []), conteudo.indice()]);
  const p = servico.progresso;
  const n = nivel(p.xp);
  const porId = new Map(questoes.map((q) => [q.id, q]));
  const area = {};
  const disc = {};
  for (const [id, x] of Object.entries(p.respostas)) {
    const q = porId.get(id);
    const a = q?.area ?? areaV2(x.area);
    const d = `${a}|${q?.disciplina ?? '—'}`;
    for (const [m, k] of [[area, a], [disc, d]]) { m[k] ??= { f: 0, c: 0 }; m[k].f++; if (x.ultima) m[k].c++; }
  }
  const minTotal = Object.values(p.tempo ?? {}).reduce((s, v) => s + v, 0);
  const semanas = Array.from({ length: 8 }, (_, k) => {
    let soma = 0;
    for (let d = 0; d < 7; d++) { const dt = new Date(); dt.setDate(dt.getDate() - (7 * (7 - k) + d)); soma += p.tempo?.[diaIso(dt)] ?? 0; }
    return { rotulo: k === 7 ? 'esta' : `-${7 - k}`, valor: Math.round(soma / 6) / 10 };
  });
  const aulasFeitas = Object.values(p.aulas ?? {}).filter((a) => a.concluida).length;
  const missoes = Object.keys(p.missoes);
  const lista = conquistas(p);

  el.innerHTML = `${cabecalho({ sobre: 'Você', titulo: 'Seu progresso' })}
    <div class="grade-4 mb3">
      <div class="card"><div class="mini sutil">Nível</div><div class="contagem" style="font-size:2rem">${n.numero}</div><div class="mini sutil">${esc(n.titulo)} · ${p.xp} XP</div>${barra(n.pct)}</div>
      <div class="card"><div class="mini sutil">Sequência</div><div class="contagem" style="font-size:2rem">${sequencia(p.dias)} <small class="mini">dias</small></div><div class="mini sutil">${p.dias.length} dias com estudo no total</div></div>
      <div class="card"><div class="mini sutil">Tempo de estudo</div><div class="contagem" style="font-size:2rem">${Math.floor(minTotal / 60)}h${String(minTotal % 60).padStart(2, '0')}</div><div class="mini sutil">com o app aberto e em uso</div></div>
      <div class="card"><div class="mini sutil">Conteúdo</div><div class="contagem" style="font-size:2rem">${Object.keys(p.respostas).length}</div><div class="mini sutil">questões · ${aulasFeitas}/${indice.aulas.length} aulas · ${missoes.length} missões</div></div>
    </div>
    <div class="dividido mb3">
      <section class="card"><h3 class="mt0">Horas por semana</h3>${graficoBarras(semanas, { formato: (v) => `${v}h`, altura: 200 })}</section>
      <section class="card"><h3 class="mt0">Constância</h3>${mapaCalor(p.tempo ?? {}, 22)}</section>
    </div>
    <section class="card mb3"><h3 class="mt0">Desempenho por área</h3>
      ${Object.keys(area).length ? `<div class="pilha">${Object.entries(area).sort((a, b) => b[1].f - a[1].f).map(([a, x]) => `<details class="recolhe"><summary><span class="linha entre" style="display:inline-flex;width:calc(100% - 22px)"><span>${ic(AREAS[a]?.icone ?? 'livro')} ${esc(AREAS[a]?.nome ?? a)}</span><span class="mono pequeno">${x.c}/${x.f} · ${pct(x.c, x.f)}%</span></span></summary>
        <div class="pilha p mt1">${Object.entries(disc).filter(([k]) => k.startsWith(`${a}|`)).map(([k, y]) => `<div class="barra-peso"><span>${esc(k.split('|')[1])}</span><span class="mini sutil">${y.c}/${y.f}</span>${barra(pct(y.c, y.f))}</div>`).join('')}</div></details>`).join('')}</div>` : '<p class="muted mb0">Resolva questões para ver seu desempenho.</p>'}</section>
    <section class="card mb3"><h3 class="mt0">Conquistas</h3><div class="grid peq">${lista.map((c) => `<div class="card plano" style="${c.ok ? '' : 'opacity:.5'}"><span class="chip-area" style="--cor:${c.ok ? 'var(--acento)' : 'var(--texto-3)'}">${ic(c.ok ? 'trofeu' : 'cadeado')}</span><div class="forte mt1">${esc(c.nome)}</div><div class="mini sutil">${esc(c.desc)}</div></div>`).join('')}</div></section>
    <section class="card mb3"><h3 class="mt0">Laboratórios</h3>${missoes.length ? `<div class="pilha p">${Object.entries(missoes.reduce((m, k) => { const lab = k.split('/')[0]; m[lab] = (m[lab] ?? 0) + 1; return m; }, {})).map(([lab, q]) => `<a class="tarefa" href="#/lab/${esc(lab)}"><span class="chip-area">${ic(LABS[lab]?.icone ?? 'frasco')}</span><span class="tt">${esc(LABS[lab]?.nome ?? lab)}</span><span class="tag ok" style="margin-left:auto">${q} missão(ões)</span></a>`).join('')}</div>` : '<p class="muted mb0">Nenhuma missão concluída ainda.</p>'}</section>
    <section class="card"><h3 class="mt0">Níveis</h3><div class="linha">${NIVEIS.map(([xp, nome], k) => `<span class="tag ${k + 1 <= n.numero ? 'prim' : ''}">${k + 1}. ${esc(nome)} · ${xp} XP</span>`).join('')}</div></section>`;
}

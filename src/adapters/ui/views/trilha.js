import { esc, barra, pct } from '../dom.js';
import { LABS } from '../labs/registro.js';

export default async function trilha(el, { servico, conteudo }, { args: [id] }) {
  const [trilhas, questoes] = await Promise.all([conteudo.trilhas(), conteudo.questoes()]);
  const t = trilhas.find((x) => x.id === id);
  if (!t) { el.innerHTML = '<p>Trilha não encontrada. <a href="#/">Início</a></p>'; return; }
  const p = servico.progresso;
  const qs = questoes.filter((q) => q.area === t.id);

  const disciplina = (d) => {
    const qd = qs.filter((q) => q.disciplina === d.nome);
    const acertos = qd.filter((q) => p.respostas[q.id]?.ultima).length;
    return `<details class="card">
      <summary class="linha entre" style="cursor:pointer"><strong>${esc(d.nome)}</strong>
        <span class="linha pequeno muted">${qd.length ? `${acertos}/${qd.length} certas` : 'sem questões ainda'}</span></summary>
      <div class="pilha" style="margin-top:10px">
        ${d.teoria.map((x) => `<div><h4 style="margin-bottom:4px">${esc(x.titulo)}</h4><p class="pequeno" style="margin:0">${esc(x.texto)}</p></div>`).join('')}
        ${d.fontes?.length ? `<div class="pequeno muted">Fontes: ${d.fontes.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a>`).join(' · ')}</div>` : ''}
        ${qd.length ? `<a class="btn peq" href="#/questoes?area=${t.id}&disciplina=${encodeURIComponent(d.nome)}">Praticar ${qd.length} questão(ões)</a>` : ''}
      </div>
    </details>`;
  };

  const labsHtml = t.labs.map((lid) => {
    const l = LABS[lid];
    const feitas = Object.keys(p.missoes).filter((k) => k.startsWith(`${lid}/`)).length;
    return `<a class="card" href="#/lab/${lid}"><div class="icone">${l.icone}</div><h3>${esc(l.nome)}</h3><p class="muted pequeno">${esc(l.resumo)}</p><span class="tag">${feitas} missão(ões) concluída(s)</span></a>`;
  }).join('');

  const respondidas = qs.filter((q) => p.respostas[q.id]).length;
  el.innerHTML = `
    <a class="pequeno" href="#/">← Início</a>
    <div class="lab-cab"><div><h1>${t.icone} ${esc(t.nome)}</h1><p class="muted">${esc(t.descricao)}</p></div>
      <div style="min-width:220px"><div class="pequeno muted">${respondidas}/${qs.length} questões respondidas</div>${barra(pct(respondidas, qs.length))}
      <div class="linha" style="margin-top:8px"><a class="btn primario" href="#/questoes?area=${t.id}">Praticar a trilha</a><a class="btn" href="#/simulado?area=${t.id}">Simulado</a></div></div>
    </div>
    ${t.nota ? `<div class="callout aviso" style="margin-bottom:14px">${esc(t.nota)}</div>` : ''}
    ${t.labs.length ? `<h2>Laboratórios</h2><div class="grid" style="margin-bottom:20px">${labsHtml}</div>` : ''}
    <h2>Conteúdo</h2>
    <div class="pilha">${t.disciplinas.map(disciplina).join('')}</div>
  `;
}

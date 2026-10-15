import { esc, barra, pct } from '../dom.js';
import { nivel, sequencia } from '../../../domain/gamification.js';
import { LABS } from '../labs/registro.js';

export default async function inicio(el, { servico, conteudo }) {
  const [trilhas, questoes, cat] = await Promise.all([conteudo.trilhas(), conteudo.questoes(), conteudo.concursos()]);
  const p = servico.progresso;
  const n = nivel(p.xp);
  const resp = Object.values(p.respostas);
  const erros = resp.filter((r) => r.ultima === false).length;
  const alvo = cat.concursos.find((c) => c.id === p.alvo);

  const cartaoTrilha = (t) => {
    const qs = questoes.filter((q) => q.area === t.id);
    const feitas = qs.filter((q) => p.respostas[q.id]).length;
    const missoesTot = t.labs.length;
    return `<a class="card" href="#/trilhas/${t.id}">
      <div class="icone">${t.icone}</div><h3>${esc(t.nome)}</h3>
      <p class="muted pequeno">${esc(t.descricao)}</p>
      <div class="linha pequeno muted"><span>${qs.length} questões</span>·<span>${missoesTot} laboratório(s)</span></div>
      <div style="margin-top:8px">${barra(pct(feitas, qs.length))}</div>
    </a>`;
  };

  el.innerHTML = `
    <section class="card" style="margin-bottom:18px">
      <div class="linha entre">
        <div>
          <h1 style="margin-bottom:4px">Estude teoria, questões e prática profissional</h1>
          <p class="muted" style="margin:0">Questões com explicação, simulados cronometrados e laboratórios que reproduzem ferramentas reais em ambiente seguro.</p>
        </div>
        <div style="min-width:220px">
          <div class="linha entre pequeno"><strong>Nível ${n.numero} · ${esc(n.titulo)}</strong><span>${p.xp} XP</span></div>
          ${barra(n.pct)}
          <div class="pequeno muted" style="margin-top:4px">${n.prox ? `${n.prox - p.xp} XP para o próximo nível` : 'Nível máximo!'} · 🔥 ${sequencia(p.dias)} dia(s) seguidos</div>
        </div>
      </div>
      <div class="linha" style="margin-top:14px">
        <a class="btn primario" href="#/questoes">Praticar questões</a>
        <a class="btn" href="#/simulado">Fazer simulado</a>
        <a class="btn" href="#/laboratorios">Abrir laboratórios</a>
        ${erros ? `<a class="btn" href="#/questoes?erros=1">Revisar ${erros} erro(s)</a>` : ''}
      </div>
    </section>

    <section class="callout ${alvo ? 'info' : ''}" style="margin-bottom:18px">
      ${alvo ? `🎯 <strong>Concurso-alvo:</strong> ${esc(alvo.orgao)} — ${esc(alvo.tipo ?? '')} ${esc(alvo.edital ?? '')}${alvo.dataProva ? ` · prova em ${esc(alvo.dataProva)}` : ''}. <a href="${esc(alvo.url)}" target="_blank" rel="noopener">Página oficial</a> · <a href="#/concursos">trocar</a>`
        : `🎯 Escolha seu <a href="#/concursos">concurso-alvo</a> no catálogo do Instituto Avalia. As trilhas abaixo são gerais; o mapeamento fino por edital entra quando o edital escolhido for analisado.`}
    </section>

    <h2>Trilhas por área</h2>
    <div class="grid" style="margin-bottom:22px">${trilhas.map(cartaoTrilha).join('')}</div>

    <h2>Laboratórios em destaque</h2>
    <div class="grid">${Object.entries(LABS).slice(0, 4).map(([id, l]) => `<a class="card" href="#/lab/${id}"><div class="icone">${l.icone}</div><h3>${esc(l.nome)}</h3><p class="muted pequeno">${esc(l.resumo)}</p></a>`).join('')}</div>
  `;
}

import { esc, barra, pct, graficoBarras, baixarArquivo, toast } from '../dom.js';
import { nivel, sequencia, conquistas } from '../../../domain/gamification.js';
import { LABS } from '../labs/registro.js';

export default async function progresso(el, { servico, conteudo }) {
  const trilhas = await conteudo.trilhas();
  const render = () => {
    const p = servico.progresso;
    const n = nivel(p.xp);
    const resp = Object.values(p.respostas);
    const porArea = trilhas.map((t) => {
      const r = resp.filter((x) => x.area === t.id);
      return { rotulo: t.nome.split(' ')[0], valor: pct(r.filter((x) => x.ultima).length, r.length), n: r.length };
    }).filter((x) => x.n);
    el.innerHTML = `<h1>Meu progresso</h1>
      <div class="grid" style="margin-bottom:14px">
        <div class="card"><div class="muted pequeno">Nível</div><div style="font-size:1.6rem;font-weight:800">${n.numero} · ${esc(n.titulo)}</div>${barra(n.pct)}<div class="pequeno muted">${p.xp} XP</div></div>
        <div class="card"><div class="muted pequeno">Questões respondidas</div><div style="font-size:1.6rem;font-weight:800">${resp.length}</div><div class="pequeno muted">${resp.filter((x) => x.ultima).length} certas na última tentativa</div></div>
        <div class="card"><div class="muted pequeno">Missões de laboratório</div><div style="font-size:1.6rem;font-weight:800">${Object.keys(p.missoes).length}</div><div class="pequeno muted">em ${new Set(Object.keys(p.missoes).map((k) => k.split('/')[0])).size} laboratório(s)</div></div>
        <div class="card"><div class="muted pequeno">Sequência</div><div style="font-size:1.6rem;font-weight:800">🔥 ${sequencia(p.dias)} dia(s)</div><div class="pequeno muted">${p.dias.length} dia(s) de estudo no total</div></div>
      </div>
      ${porArea.length ? `<div class="card" style="margin-bottom:14px"><h3>% de acerto por área</h3>${graficoBarras(porArea, { formato: (v) => `${v}%` })}</div>` : ''}
      <h2>Conquistas</h2>
      <div class="grid" style="margin-bottom:14px">${conquistas(p).map((c) => `<div class="card" style="${c.ok ? '' : 'opacity:.55'}"><strong>${c.ok ? '🏅' : '🔒'} ${esc(c.nome)}</strong><div class="pequeno muted">${esc(c.desc)}</div></div>`).join('')}</div>
      <h2>Missões por laboratório</h2>
      <div class="grid" style="margin-bottom:14px">${Object.entries(LABS).map(([id, l]) => `<a class="card" href="#/lab/${id}"><strong>${l.icone} ${esc(l.nome)}</strong><div class="pequeno muted">${Object.keys(p.missoes).filter((k) => k.startsWith(`${id}/`)).length} concluída(s)</div></a>`).join('')}</div>
      ${p.simulados.length ? `<h2>Simulados</h2><div class="card" style="margin-bottom:14px"><table class="tabela"><thead><tr><th>Data</th><th class="num">Acertos</th><th class="num">%</th><th class="num">Tempo</th></tr></thead><tbody>${[...p.simulados].reverse().map((s) => `<tr><td>${esc(s.data)}</td><td class="num">${s.acertos}/${s.total}</td><td class="num">${pct(s.acertos, s.total)}%</td><td class="num">${Math.round(s.segundos / 60)} min</td></tr>`).join('')}</tbody></table></div>` : ''}
      <h2>Backup e estudo em grupo</h2>
      <div class="card pilha">
        <p class="pequeno" style="margin:0">O progresso fica salvo só neste navegador. Exporte para fazer backup, levar a outro dispositivo ou comparar com colegas que estudam para o mesmo concurso.</p>
        <div class="linha">
          <button class="btn" id="exp">Exportar progresso</button>
          <label class="btn">Importar progresso<input type="file" id="imp" accept="application/json" hidden></label>
          <label class="btn">Comparar com colega<input type="file" id="cmp" accept="application/json" hidden></label>
          <button class="btn perigo" id="zerar">Zerar tudo</button>
        </div>
        <div id="comparacao"></div>
      </div>`;
    el.querySelector('#exp').onclick = () => baixarArquivo(`concurso-lab-progresso-${new Date().toISOString().slice(0, 10)}.json`, servico.exportar());
    el.querySelector('#imp').onchange = async (e) => {
      const f = e.target.files[0];
      if (!f || !confirm('Importar substitui o progresso atual deste navegador. Continuar?')) return;
      try { servico.importar(await f.text()); toast('Progresso importado.'); render(); } catch (err) { alert(err.message); }
    };
    el.querySelector('#cmp').onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const outro = JSON.parse(await f.text()).progresso;
        if (typeof outro?.xp !== 'number') throw new Error('Arquivo inválido.');
        const linha = (nome, x) => { const r = Object.values(x.respostas ?? {}); return `<tr><td>${esc(nome)}</td><td class="num">${x.xp}</td><td class="num">${nivel(x.xp).numero}</td><td class="num">${r.length}</td><td class="num">${pct(r.filter((y) => y.ultima).length, r.length)}%</td><td class="num">${Object.keys(x.missoes ?? {}).length}</td></tr>`; };
        el.querySelector('#comparacao').innerHTML = `<table class="tabela"><thead><tr><th></th><th class="num">XP</th><th class="num">Nível</th><th class="num">Questões</th><th class="num">Acerto</th><th class="num">Missões</th></tr></thead><tbody>${linha('Você', servico.progresso)}${linha(f.name.replace(/\.json$/, ''), outro)}</tbody></table>`;
      } catch (err) { alert(err.message); }
    };
    el.querySelector('#zerar').onclick = () => { if (confirm('Apagar todo o progresso deste navegador? Isso não pode ser desfeito.')) { servico.zerar(); render(); } };
  };
  render();
}

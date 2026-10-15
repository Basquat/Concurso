import { esc } from '../dom.js';
import { LABS } from '../labs/registro.js';

export default async function laboratorios(el, { servico, conteudo }) {
  const trilhas = await conteudo.trilhas();
  const p = servico.progresso;
  el.innerHTML = `<h1>Laboratórios</h1>
    <p class="muted">Ambientes didáticos que reproduzem o funcionamento de ferramentas profissionais. Tudo roda no seu navegador, com dados fictícios e sem efeitos externos. Cada laboratório explica o que é real e o que é simulado.</p>
    ${trilhas.filter((t) => t.labs.length).map((t) => `<h2 style="margin-top:18px">${t.icone} ${esc(t.nome)}</h2>
      <div class="grid">${t.labs.map((id) => {
        const l = LABS[id];
        const feitas = Object.keys(p.missoes).filter((k) => k.startsWith(`${id}/`)).length;
        return `<a class="card" href="#/lab/${id}"><div class="icone">${l.icone}</div><h3>${esc(l.nome)}</h3><p class="muted pequeno">${esc(l.resumo)}</p>${feitas ? `<span class="tag ok">${feitas} missão(ões) concluída(s)</span>` : ''}</a>`;
      }).join('')}</div>`).join('')}`;
}

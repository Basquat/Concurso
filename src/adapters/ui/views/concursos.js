import { esc } from '../dom.js';

export default async function concursos(el, { servico, conteudo }) {
  const cat = await conteudo.concursos();
  const render = () => {
    const alvo = servico.progresso.alvo;
    el.innerHTML = `<h1>Concursos — Instituto Avalia</h1>
      <div class="callout info" style="margin-bottom:14px">
        Referência inicial da plataforma. Lista copiada de <a href="${esc(cat.fonte)}" target="_blank" rel="noopener">avalia.org.br</a> em ${esc(cat.capturadoEm)}.
        ${esc(cat.aviso)}
      </div>
      <div class="callout aviso" style="margin-bottom:14px">
        <strong>Como funciona o mapeamento por edital:</strong> ao escolher um concurso, o próximo passo é analisar o edital de abertura (cargos, atribuições e conteúdo programático) e cadastrar em <code>data/</code> as disciplinas e assuntos efetivamente cobrados.
        Questões oficiais só entram com banca, concurso, ano e número identificados; questões escritas aqui ficam marcadas como <em>autorais</em> e nunca são atribuídas ao Instituto Avalia.
      </div>
      <div class="rolagem" style="max-height:none">
      <table class="tabela"><thead><tr><th>Órgão</th><th>Tipo · edital</th><th>Escolaridade</th><th>Prova</th><th>Situação</th><th></th></tr></thead>
      <tbody>${cat.concursos.map((c) => `<tr>
        <td><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.orgao)}</a>${c.cargos ? `<div class="pequeno muted">${c.cargos} cargo(s)</div>` : ''}</td>
        <td class="pequeno">${esc(c.tipo ?? '—')}<br>${esc(c.edital ?? '')}</td>
        <td class="pequeno">${esc(c.escolaridade ?? '—')}</td>
        <td class="pequeno">${esc(c.dataProva ?? 'a definir')}</td>
        <td class="pequeno">${esc(c.situacao ?? '')}</td>
        <td>${alvo === c.id ? '<span class="tag ok">alvo</span>' : `<button class="btn peq" data-alvo="${c.id}">Definir alvo</button>`}</td>
      </tr>`).join('')}</tbody></table></div>`;
    el.querySelectorAll('[data-alvo]').forEach((b) => b.addEventListener('click', () => { servico.definirAlvo(Number(b.dataset.alvo)); render(); }));
  };
  render();
}

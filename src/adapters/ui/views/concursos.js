import { esc, cabecalho } from '../dom.js';

export default async function concursos(el, { conteudo }) {
  const cat = await conteudo.concursos();
  const bancas = [...new Set(cat.concursos.map((c) => c.banca))];
  const situacoes = [...new Set(cat.concursos.map((c) => c.situacao))];
  const filtro = { banca: '', situacao: '' };

  const render = () => {
    const lista = cat.concursos.filter((c) => (!filtro.banca || c.banca === filtro.banca) && (!filtro.situacao || c.situacao === filtro.situacao));
    el.innerHTML = `<div class="conteudo">
      ${cabecalho({ sobre: `Consulta em ${cat.consultadoEm.split('-').reverse().join('/')}`, titulo: 'Catálogo de concursos', texto: `${esc(cat.aviso)} Cada concurso detalhado tem cargos, conteúdos e critérios próprios, sem misturar editais.` })}
      <form class="linha" data-filtros style="margin-bottom:12px">
        <label class="campo">Banca<select name="banca"><option value="">Todas</option>${bancas.map((b) => `<option ${b === filtro.banca ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
        <label class="campo">Situação<select name="situacao"><option value="">Todas</option>${situacoes.map((s) => `<option ${s === filtro.situacao ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      </form>
      <p class="pequeno muted">${lista.length} concurso(s).</p>
      <ul class="lista">${lista.map((c) => `<li class="com-acao">
        <div><span class="titulo">${esc(c.orgao)}</span>
          <div class="meta">${esc(c.banca)} · ${esc(c.tipo ?? '')}${c.edital ? ` · edital ${esc(c.edital)}` : ''}${c.escolaridade ? ` · ${esc(c.escolaridade)}` : ''}</div>
          <div class="meta">${esc(c.situacao)}${c.inscricoesAte ? ` até ${esc(c.inscricoesAte)}` : ''}${c.dataProva ? ` · prova ${esc(c.dataProva)}` : ''}${c.publicacao ? ` · ${esc(c.publicacao)}` : ''}</div></div>
        <div class="linha">${c.detalhe ? `<a class="botao peq" href="#/concursos/${esc(c.detalhe)}">Edital detalhado</a>` : ''}<a class="botao sec peq" href="${esc(c.url)}" target="_blank" rel="noopener">Página oficial</a></div></li>`).join('')}</ul>
      <h2>Como um novo concurso entra na plataforma</h2>
      <ol class="leitura">
        <li>Ler o edital, anexos e retificações nas fontes oficiais e registrar a data da consulta.</li>
        <li>Cadastrar em <code>data/concursos/&lt;id&gt;.json</code> os cargos, requisitos, atribuições, estrutura das provas, critérios e conteúdos.</li>
        <li>Gerar a matriz de cobertura e tratar as lacunas com teoria, questões e, quando houver justificativa prática, laboratórios.</li>
      </ol>
      <p class="pequeno muted">Questões oficiais só entram identificadas (banca, concurso, ano e número) e respeitando direitos autorais; questões escritas aqui ficam marcadas como autorais e nunca são atribuídas a uma banca.</p>
    </div>`;
    el.querySelector('[data-filtros]').addEventListener('change', (e) => { filtro[e.target.name] = e.target.value; render(); });
  };
  render();
}

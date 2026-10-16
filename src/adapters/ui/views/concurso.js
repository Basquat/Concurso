import { esc, cabecalho } from '../dom.js';
import { cargoAlvo } from '../componentes/cargo.js';

const FASE = { objetiva: 'Objetiva', redacao: 'Redação', titulos: 'Títulos', oral: 'Oral/prática', pratica: 'Prática' };
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => iso.split('-').reverse().join('/');

export default async function concurso(el, { servico, conteudo }, { args: [id] }) {
  let c;
  try { c = await conteudo.concurso(id); } catch {
    el.innerHTML = `${cabecalho({ titulo: 'Edital ainda não detalhado', voltar: ['#/concursos', 'Catálogo de concursos'] })}<p>Este concurso está no catálogo, mas o edital ainda não foi analisado e cadastrado. Consulte a página oficial pelo catálogo.</p>`;
    return;
  }
  const meu = cargoAlvo(servico.progresso, c);
  const vagas = (cg) => (cg.vagas.listaUnica ? `${cg.vagas.total} (lista única ${cg.vagas.listaUnica})` : `${cg.vagas.total}`);

  el.innerHTML = `<div class="conteudo">
    ${cabecalho({ sobre: `${c.banca} · consulta em ${dataBR(c.consultadoEm)}`, titulo: `${c.orgao} – Edital nº 007/2026`, texto: esc(c.edital) })}
    <dl class="numeros">
      <div><dt>Cargos</dt><dd>${c.cargos.length}</dd></div>
      <div><dt>Vagas</dt><dd>${c.totalVagas}</dd></div>
      <div><dt>Inscrições até</dt><dd style="font-size:1.1rem">29/10/2026</dd></div>
      <div><dt>Prova objetiva</dt><dd style="font-size:1.1rem">20/12/2026</dd></div>
    </dl>
    ${meu ? `<div class="aviso ok" style="margin-bottom:16px">Seu cargo: <a href="#/concursos/${c.id}/cargo/${encodeURIComponent(meu.codigo)}">${esc(meu.codigo)} – ${esc(meu.nome)}</a></div>` : ''}
    <div class="linha"><a class="botao" href="#/concursos/${c.id}/matriz">Matriz de cobertura do edital</a><a class="botao sec" href="${esc(c.paginaNova)}" target="_blank" rel="noopener">Página oficial do concurso</a></div>
    <p class="pequeno muted" style="margin-top:8px">${esc(c.nota)}</p>

    <h2>Cargos</h2>
    <div class="rolagem"><table class="tabela empilha"><thead><tr><th>Código</th><th>Cargo</th><th>Nível</th><th>Campus</th><th>Carga</th><th class="num">Vagas</th><th>Fases</th></tr></thead><tbody>
      ${c.cargos.map((cg) => `<tr>
        <td data-rotulo="Código" class="mono">${esc(cg.codigo)}</td>
        <td data-rotulo="Cargo"><a href="#/concursos/${c.id}/cargo/${encodeURIComponent(cg.codigo)}">${esc(cg.nome)}</a></td>
        <td data-rotulo="Nível">${cg.nivel === 'D' ? 'Médio (D)' : 'Superior (E)'}</td>
        <td data-rotulo="Campus">${esc(cg.campus)}</td>
        <td data-rotulo="Carga">${esc(cg.cargaHoraria)}</td>
        <td data-rotulo="Vagas" class="num">${vagas(cg)}</td>
        <td data-rotulo="Fases">${cg.fases.map((f) => FASE[f]).join(', ')}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="pequeno muted">${esc(c.reservas)}</p>

    <h2>Como é a seleção</h2>
    <div class="leitura">
      <ul>${Object.entries(c.provas).map(([k, v]) => `<li><strong>${{ local: 'Locais', data: 'Data', objetiva: 'Prova objetiva', redacao: 'Redação', titulos: 'Títulos', oral: 'Oral/prática', pratica: 'Prática (músicos)' }[k]}:</strong> ${esc(v)}</li>`).join('')}</ul>
      <h3>Nota final</h3><ul>${c.notaFinal.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <h3>Desempate, na ordem</h3><ol>${c.desempate.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
      <h3>Regime e remuneração</h3>
      <p>${esc(c.regime)}</p>
      <p>Vencimento básico inicial: classe D ${brl(c.remuneracao.D)}; classe E ${brl(c.remuneracao.E)}. ${esc(c.remuneracao.beneficios)} Taxa de inscrição: ${brl(c.taxa.D)} (D) e ${brl(c.taxa.E)} (E).</p>
    </div>

    <h2>Cronograma</h2>
    <div class="rolagem"><table class="tabela empilha"><thead><tr><th>Evento</th><th>Data</th></tr></thead><tbody>
      ${c.cronograma.map((e) => `<tr><td data-rotulo="Evento">${esc(e.evento)}</td><td data-rotulo="Data">${esc(e.data)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="pequeno muted">Datas prováveis do Anexo III, com as correções das retificações. Confirme sempre nas publicações oficiais.</p>

    <h2>Retificações</h2>
    <ul class="lista">${c.retificacoes.map((r) => `<li><span class="titulo">${r.numero}º Termo de Retificação · ${esc(r.data)}</span><span class="meta">${esc(r.resumo)}</span></li>`).join('')}</ul>

    <h2>Documentos oficiais consultados</h2>
    <ul class="lista">${c.documentos.map((d) => `<li class="com-acao"><span><span class="titulo">${esc(d.titulo)}</span><br><span class="meta">Publicado em ${esc(d.data)}</span></span><a class="botao sec peq" href="${esc(d.url)}" target="_blank" rel="noopener">Abrir PDF</a></li>`).join('')}</ul>
  </div>`;
}

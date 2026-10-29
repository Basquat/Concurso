import { esc, cabecalho } from '../dom.js';
import { cargoAlvo, nomeNivel } from '../componentes/cargo.js';

const FASE = { objetiva: 'Objetiva', redacao: 'Redação', discursiva: 'Discursiva', titulos: 'Títulos', oral: 'Oral/prática', pratica: 'Prática', fisico: 'Teste físico' };
const PROVA = { local: 'Locais', data: 'Data', objetiva: 'Prova objetiva', redacao: 'Redação', discursiva: 'Discursiva', titulos: 'Títulos', oral: 'Oral/prática', pratica: 'Prática', fisico: 'Teste físico' };
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso) => iso.split('-').reverse().join('/');
const nivel = (n) => `${nomeNivel(n)[0].toUpperCase()}${nomeNivel(n).slice(1)}${['D', 'E'].includes(n) ? ` (${n})` : ''}`;

export default async function concurso(el, { servico, conteudo }, { args: [id] }) {
  let c;
  try { c = await conteudo.concurso(id); } catch {
    el.innerHTML = `${cabecalho({ titulo: 'Edital ainda não detalhado', voltar: ['#/concursos', 'Catálogo de concursos'] })}<p>Este concurso está no catálogo, mas o edital ainda não foi analisado e cadastrado. Consulte a página oficial pelo catálogo.</p>`;
    return;
  }
  const meu = cargoAlvo(servico.progresso, c);
  const vagas = (cg) => (!cg.vagas ? '—' : cg.vagas.listaUnica ? `${cg.vagas.total} (lista única ${cg.vagas.listaUnica})` : `${cg.vagas.total}`);
  const lista = (titulo, itens, html) => (itens?.length ? `<h2>${titulo}</h2>${html(itens)}` : '');
  const salarios = Object.entries(c.remuneracao ?? {}).filter(([k, v]) => k !== 'beneficios' && typeof v === 'number');

  el.innerHTML = `<div class="conteudo">
    ${cabecalho({ sobre: `${c.banca} · consulta em ${dataBR(c.consultadoEm)}`, titulo: c.titulo ?? c.orgao, texto: esc(c.edital) })}
    ${c.modelo ? `<div class="aviso info mb3"><strong>Modelo base.</strong> ${esc(c.modelo)}</div>` : ''}
    <dl class="numeros">
      <div><dt>Cargos</dt><dd>${c.cargos.length}</dd></div>
      ${c.totalVagas ? `<div><dt>Vagas</dt><dd>${c.totalVagas}</dd></div>` : ''}
      ${c.inscricoesAte ? `<div><dt>Inscrições até</dt><dd style="font-size:1.1rem">${esc(c.inscricoesAte)}</dd></div>` : ''}
      <div><dt>Prova objetiva</dt><dd style="font-size:1.1rem">${esc(c.dataProva ?? 'conforme edital')}</dd></div>
    </dl>
    ${meu ? `<div class="aviso ok" style="margin-bottom:16px">Seu cargo: <a href="#/concursos/${c.id}/cargo/${encodeURIComponent(meu.codigo)}">${c.modelo ? '' : `${esc(meu.codigo)} – `}${esc(meu.nome)}</a></div>` : ''}
    <div class="linha"><a class="botao" href="#/concursos/${c.id}/matriz">Matriz de cobertura</a>${c.paginaNova ? `<a class="botao sec" href="${esc(c.paginaNova)}" target="_blank" rel="noopener">Página oficial do concurso</a>` : ''}</div>
    ${c.nota ? `<p class="pequeno muted" style="margin-top:8px">${esc(c.nota)}</p>` : ''}

    <h2>Cargos</h2>
    <div class="rolagem"><table class="tabela empilha"><thead><tr>${c.modelo ? '' : '<th>Código</th>'}<th>Cargo</th><th>Nível</th><th>Lotação</th><th>Carga</th><th class="num">Vagas</th><th>Fases</th></tr></thead><tbody>
      ${c.cargos.map((cg) => `<tr>
        ${c.modelo ? '' : `<td data-rotulo="Código" class="mono">${esc(cg.codigo)}</td>`}
        <td data-rotulo="Cargo"><a href="#/concursos/${c.id}/cargo/${encodeURIComponent(cg.codigo)}">${esc(cg.nome)}</a></td>
        <td data-rotulo="Nível">${nivel(cg.nivel)}</td>
        <td data-rotulo="Lotação">${esc(cg.campus ?? '—')}</td>
        <td data-rotulo="Carga">${esc(cg.cargaHoraria ?? '—')}</td>
        <td data-rotulo="Vagas" class="num">${vagas(cg)}</td>
        <td data-rotulo="Fases">${cg.fases.map((f) => FASE[f] ?? f).join(', ')}</td></tr>`).join('')}
    </tbody></table></div>
    ${c.reservas ? `<p class="pequeno muted">${esc(c.reservas)}</p>` : ''}

    <h2>Como é a seleção</h2>
    <div class="leitura">
      <ul>${Object.entries(c.provas ?? {}).map(([k, v]) => `<li><strong>${PROVA[k] ?? k}:</strong> ${esc(v)}</li>`).join('')}</ul>
      ${c.notaFinal?.length ? `<h3>Nota final</h3><ul>${c.notaFinal.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${c.desempate?.length ? `<h3>Desempate, na ordem</h3><ol>${c.desempate.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      ${c.regime || salarios.length || c.remuneracao?.beneficios ? `<h3>Regime e remuneração</h3>
      ${c.regime ? `<p>${esc(c.regime)}</p>` : ''}
      <p>${salarios.length ? `Vencimento básico inicial: ${salarios.map(([k, v]) => `${nomeNivel(k)}${['D', 'E'].includes(k) ? ` (classe ${k})` : ''} ${brl(v)}`).join('; ')}. ` : ''}${esc(c.remuneracao?.beneficios ?? '')}${c.taxa ? ` Taxa de inscrição: ${Object.entries(c.taxa).map(([k, v]) => `${brl(v)} (${k})`).join(' e ')}.` : ''}</p>` : ''}
    </div>

    ${lista('Cronograma', c.cronograma, (xs) => `<div class="rolagem"><table class="tabela empilha"><thead><tr><th>Evento</th><th>Data</th></tr></thead><tbody>
      ${xs.map((e) => `<tr><td data-rotulo="Evento">${esc(e.evento)}</td><td data-rotulo="Data">${esc(e.data)}</td></tr>`).join('')}
    </tbody></table></div><p class="pequeno muted">Datas prováveis do edital, com as correções das retificações. Confirme sempre nas publicações oficiais.</p>`)}
    ${lista('Retificações', c.retificacoes, (xs) => `<ul class="lista">${xs.map((r) => `<li><span class="titulo">${r.numero}º Termo de Retificação · ${esc(r.data)}</span><span class="meta">${esc(r.resumo)}</span></li>`).join('')}</ul>`)}
    ${lista('Documentos oficiais consultados', c.documentos, (xs) => `<ul class="lista">${xs.map((d) => `<li class="com-acao"><span><span class="titulo">${esc(d.titulo)}</span><br><span class="meta">Publicado em ${esc(d.data)}</span></span><a class="botao sec peq" href="${esc(d.url)}" target="_blank" rel="noopener">Abrir PDF</a></li>`).join('')}</ul>`)}
    ${lista('Como estudar para este concurso', c.dicas, (xs) => `<ul class="leitura">${xs.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`)}
  </div>`;
}

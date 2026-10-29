import { esc, cabecalho, toast } from '../dom.js';
import { avaliarItem, contador } from '../../../domain/cobertura.js';
import { cargoAlvo, nomeNivel } from '../componentes/cargo.js';
import { LABS } from '../labs/registro.js';

const ESTADO = { coberto: 'Coberto', parcial: 'Parcial', lacuna: 'Lacuna' };
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function cargo(el, { servico, acervo: conteudo }, { args: [id, cod] }) {
  const [c, questoes] = await Promise.all([conteudo.concurso(id), conteudo.questoes()]);
  const cg = c.cargos.find((x) => x.codigo === cod);
  if (!cg) { el.innerHTML = `${cabecalho({ titulo: 'Cargo não encontrado', voltar: [`#/concursos/${id}`, 'Voltar ao edital'] })}`; return; }
  const contar = contador(questoes);

  const render = () => {
    const meu = cargoAlvo(servico.progresso, c)?.codigo === cg.codigo;
    const red = cg.redacaoCorrigida;
    el.innerHTML = `<div class="conteudo">
      ${cabecalho({ voltar: [`#/concursos/${c.id}`, c.titulo ?? c.orgao], sobre: `${c.modelo ? 'Cargo-modelo' : `Cargo ${cg.codigo}`} · nível ${nomeNivel(cg.nivel)}`, titulo: cg.nome })}
      <div class="linha" style="margin-bottom:16px">${meu ? '<span class="estado feito">Este é o seu cargo</span>' : '<button class="botao" type="button" data-meu>Definir como meu cargo</button>'}
        <a class="botao sec" href="#/concursos/${c.id}/matriz?cargo=${encodeURIComponent(cg.codigo)}">Matriz de cobertura</a></div>
      <dl class="numeros">
        ${cg.vagas ? `<div><dt>Vagas</dt><dd>${cg.vagas.total}</dd></div>` : ''}
        <div><dt>Lotação</dt><dd style="font-size:1rem">${esc(cg.campus ?? '—')}</dd></div>
        <div><dt>Carga horária</dt><dd>${esc(cg.cargaHoraria ?? '—')}</dd></div>
        <div><dt>Questões objetivas</dt><dd>${(cg.objetiva ?? []).reduce((s, d) => s + d.questoes, 0) || '—'}</dd></div>
        ${c.remuneracao?.[cg.nivel] ? `<div><dt>Vencimento inicial</dt><dd style="font-size:1rem">${brl(c.remuneracao[cg.nivel])}</dd></div>` : ''}
      </dl>
      ${!cg.vagas ? '' : cg.vagas.listaUnica ? `<p class="pequeno muted">Vagas reservadas distribuídas pelo método da lista única entre os cargos ${esc(c.gruposListaUnica[cg.vagas.listaUnica].cargos)}.</p>` : `<p class="pequeno muted">Ampla concorrência ${cg.vagas.ac}; pretos e pardos ${cg.vagas.pp}; PcD ${cg.vagas.pcd}; indígenas ${cg.vagas.indigenas}; quilombolas ${cg.vagas.quilombolas}.</p>`}

      <div class="leitura">
        ${cg.requisito ? `<h2>Requisito</h2><p>${esc(cg.requisito)}</p>` : ''}
        ${cg.atribuicoes ? `<h2>Atribuições</h2><p>${esc(cg.atribuicoes)}</p>` : ''}
      </div>

      <h2>Prova</h2>
      ${cg.objetiva ? `<div class="rolagem"><table class="tabela"><thead><tr><th>Área</th><th class="num">Questões</th><th class="num">Valor</th><th class="num">Pontos</th></tr></thead><tbody>
        ${cg.objetiva.map((d) => `<tr><td>${esc(d.disciplina)}</td><td class="num">${d.questoes}</td><td class="num">${d.valor}</td><td class="num">${d.questoes * d.valor}</td></tr>`).join('')}
        <tr><td><strong>Total da objetiva</strong></td><td class="num">${cg.objetiva.reduce((s, d) => s + d.questoes, 0)}</td><td></td><td class="num"><strong>${cg.objetiva.reduce((s, d) => s + d.questoes * d.valor, 0)}</strong></td></tr></tbody></table></div>` : ''}
      <ul class="leitura">
        ${cg.fases.filter((f) => c.provas?.[f]).map((f) => `<li>${esc(c.provas[f])}${f === 'redacao' && red ? ` Limite de redações corrigidas para este cargo (Tabela 13.1): ampla concorrência ${red.ac}, pretos e pardos ${red.pp}, PcD ${red.pcd}${red.indigenas ? `, indígenas ${red.indigenas}` : ''}${red.quilombolas ? `, quilombolas ${red.quilombolas}` : ''}.` : ''}</li>`).join('')}
      </ul>

      <h2>Conteúdo programático</h2>
      <p class="pequeno muted">${c.modelo ? 'Conteúdo típico dos editais deste cargo.' : 'Texto do Anexo II com as alterações dos termos de retificação.'} O estado de cada item indica o que a plataforma já oferece: <span class="estado coberto">Coberto</span> teoria e ao menos 3 questões relacionadas; <span class="estado parcial">Parcial</span> há material, mas poucas questões; <span class="estado lacuna">Lacuna</span> ainda sem recurso.</p>
      ${cg.programas.map((pid, i) => {
        const p = c.programas[pid];
        return `<details class="painel recolhe" ${i === cg.programas.length - 1 || cg.programas.length === 1 ? 'open' : ''}><summary>${esc(p.disciplina)}</summary>
          ${p.blocos.map((b) => `${b.titulo ? `<h3 style="margin-top:12px">${esc(b.titulo)}</h3>` : ''}<ol class="lista" style="padding-left:0">${b.itens.map((it) => {
            const a = avaliarItem(`${b.titulo ?? ''} ${it}`, contar);
            return `<li><span>${esc(it)}</span><span class="linha pequeno"><span class="estado ${a.estado}">${ESTADO[a.estado]}</span>
              ${a.trilhas.map((t) => `<a href="#/trilhas/${t.area}">${esc(t.disciplina)}</a>`).join(' · ')}
              ${a.labs.map((l) => `<a href="#/lab/${l}">Lab: ${esc(LABS[l].nome)}</a>`).join(' · ')}</span></li>`;
          }).join('')}</ol>`).join('')}</details>`;
      }).join('')}
    </div>`;
    el.querySelector('[data-meu]')?.addEventListener('click', () => { servico.definirAlvo({ concurso: c.id, cargo: cg.codigo }); toast(`Cargo definido: ${cg.codigo} – ${cg.nome}`); render(); });
  };
  render();
}

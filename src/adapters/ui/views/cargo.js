import { esc, cabecalho, toast } from '../dom.js';
import { avaliarItem } from '../../../domain/cobertura.js';
import { cargoAlvo } from './inicio.js';
import { LABS } from '../labs/registro.js';

const ESTADO = { coberto: 'Coberto', parcial: 'Parcial', lacuna: 'Lacuna' };
const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function cargo(el, { servico, conteudo }, { args: [id, cod] }) {
  const [c, questoes] = await Promise.all([conteudo.concurso(id), conteudo.questoes()]);
  const cg = c.cargos.find((x) => x.codigo === cod);
  if (!cg) { el.innerHTML = `${cabecalho({ titulo: 'Cargo não encontrado', voltar: [`#/concursos/${id}`, 'Voltar ao edital'] })}`; return; }
  const contar = (area, disc) => questoes.filter((q) => q.area === area && q.disciplina === disc).length;

  const render = () => {
    const meu = cargoAlvo(servico.progresso, c)?.codigo === cg.codigo;
    const red = cg.redacaoCorrigida;
    el.innerHTML = `<div class="conteudo">
      ${cabecalho({ voltar: [`#/concursos/${c.id}`, 'UFBA 2026 – Edital nº 007/2026'], sobre: `Cargo ${cg.codigo} · nível ${cg.nivel === 'D' ? 'médio' : 'superior'}`, titulo: cg.nome })}
      <div class="linha" style="margin-bottom:16px">${meu ? '<span class="estado feito">Este é o seu cargo</span>' : '<button class="botao" type="button" data-meu>Definir como meu cargo</button>'}
        <a class="botao sec" href="#/concursos/${c.id}/matriz?cargo=${encodeURIComponent(cg.codigo)}">Matriz de cobertura</a></div>
      <dl class="numeros">
        <div><dt>Vagas</dt><dd>${cg.vagas.total}</dd></div>
        <div><dt>Campus</dt><dd style="font-size:1rem">${esc(cg.campus)}</dd></div>
        <div><dt>Carga horária</dt><dd>${esc(cg.cargaHoraria)}</dd></div>
        <div><dt>Vencimento inicial</dt><dd style="font-size:1rem">${brl(c.remuneracao[cg.nivel])}</dd></div>
      </dl>
      ${cg.vagas.listaUnica ? `<p class="pequeno muted">Vagas reservadas distribuídas pelo método da lista única entre os cargos ${esc(c.gruposListaUnica[cg.vagas.listaUnica].cargos)}.</p>` : `<p class="pequeno muted">Ampla concorrência ${cg.vagas.ac}; pretos e pardos ${cg.vagas.pp}; PcD ${cg.vagas.pcd}; indígenas ${cg.vagas.indigenas}; quilombolas ${cg.vagas.quilombolas}.</p>`}

      <div class="leitura">
        <h2>Requisito</h2><p>${esc(cg.requisito)}</p>
        <h2>Atribuições</h2><p>${esc(cg.atribuicoes)}</p>
      </div>

      <h2>Prova</h2>
      ${cg.objetiva ? `<div class="rolagem"><table class="tabela"><thead><tr><th>Área</th><th class="num">Questões</th><th class="num">Valor</th><th class="num">Pontos</th></tr></thead><tbody>
        ${cg.objetiva.map((d) => `<tr><td>${esc(d.disciplina)}</td><td class="num">${d.questoes}</td><td class="num">${d.valor}</td><td class="num">${d.questoes * d.valor}</td></tr>`).join('')}
        <tr><td><strong>Total da objetiva</strong></td><td class="num">60</td><td></td><td class="num"><strong>90</strong></td></tr></tbody></table></div>` : ''}
      <ul class="leitura">
        ${cg.fases.includes('objetiva') ? `<li>${esc(c.provas.objetiva)}</li>` : ''}
        ${cg.fases.includes('redacao') ? `<li>${esc(c.provas.redacao)}${red ? ` Limite de redações corrigidas para este cargo (Tabela 13.1): ampla concorrência ${red.ac}, pretos e pardos ${red.pp}, PcD ${red.pcd}${red.indigenas ? `, indígenas ${red.indigenas}` : ''}${red.quilombolas ? `, quilombolas ${red.quilombolas}` : ''}.` : ''}</li>` : ''}
        ${cg.fases.includes('titulos') ? `<li>${esc(c.provas.titulos)}</li>` : ''}
        ${cg.fases.includes('oral') ? `<li>${esc(c.provas.oral)}</li>` : ''}
        ${cg.fases.includes('pratica') ? `<li>${esc(c.provas.pratica)}</li>` : ''}
      </ul>

      <h2>Conteúdo programático</h2>
      <p class="pequeno muted">Texto do Anexo II com as alterações dos termos de retificação. O estado de cada item indica o que a plataforma já oferece: <span class="estado coberto">Coberto</span> teoria e ao menos 3 questões relacionadas; <span class="estado parcial">Parcial</span> há material, mas poucas questões; <span class="estado lacuna">Lacuna</span> ainda sem recurso.</p>
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

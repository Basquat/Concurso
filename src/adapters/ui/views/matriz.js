import { esc, cabecalho, baixarArquivo, pct } from '../dom.js';
import { matriz, resumo } from '../../../domain/cobertura.js';
import { seletorCargo, cargoAlvo } from '../componentes/cargo.js';
import { LABS } from '../labs/registro.js';

const ESTADO = { coberto: 'Coberto', parcial: 'Parcial', lacuna: 'Lacuna' };

export default async function matrizView(el, { servico, conteudo }, { args: [id], params }) {
  const [c, questoes, trilhas] = await Promise.all([conteudo.concurso(id), conteudo.questoes(), conteudo.trilhas()]);
  const contar = (area, disc) => questoes.filter((q) => q.area === area && q.disciplina === disc).length;
  const nomeTrilha = Object.fromEntries(trilhas.map((t) => [t.id, t.nome]));
  let cod = params.get('cargo') || cargoAlvo(servico.progresso, c)?.codigo || c.cargos[0].codigo;
  const filtro = { disciplina: '', estado: '' };

  const render = () => {
    const linhas = matriz(c, cod, contar);
    const r = resumo(linhas);
    const visiveis = linhas.filter((l) => (!filtro.disciplina || l.disciplina === filtro.disciplina) && (!filtro.estado || l.estado === filtro.estado));
    const disciplinas = [...new Set(linhas.map((l) => l.disciplina))];
    el.innerHTML = `<div class="conteudo">
      ${cabecalho({ voltar: [`#/concursos/${c.id}`, 'UFBA 2026 – Edital nº 007/2026'], sobre: 'Matriz de cobertura', titulo: 'O que o edital cobra e o que a plataforma já oferece', texto: 'Cada linha é um item do conteúdo programático do cargo. O mapeamento é feito por palavras-chave e revisado pelo critério abaixo; serve para planejar o estudo e mostrar as lacunas, não para garantir domínio do tópico.' })}
      <form class="linha" data-filtros style="margin-bottom:16px">
        <label class="campo">Cargo${seletorCargo(c, cod)}</label>
        <label class="campo">Disciplina<select name="disciplina"><option value="">Todas</option>${disciplinas.map((d) => `<option ${d === filtro.disciplina ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
        <label class="campo">Estado<select name="estado"><option value="">Todos</option>${Object.entries(ESTADO).map(([k, v]) => `<option value="${k}" ${k === filtro.estado ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <button class="botao sec" type="button" data-csv style="align-self:end">Baixar CSV</button>
      </form>
      <dl class="numeros">
        <div><dt>Itens do edital</dt><dd>${r.total}</dd></div>
        <div><dt>Cobertos</dt><dd class="ok">${r.coberto} <small>(${pct(r.coberto, r.total)}%)</small></dd></div>
        <div><dt>Parciais</dt><dd>${r.parcial}</dd></div>
        <div><dt>Lacunas</dt><dd class="erro">${r.lacuna}</dd></div>
      </dl>
      <p class="pequeno muted">Coberto: há teoria resumida e ao menos 3 questões nas disciplinas relacionadas. Parcial: há material, mas menos de 3 questões. Lacuna: nenhum recurso ainda. Dificuldade estimada pelo nível do cargo (médio: intermediária; superior: avançada). Laboratórios só aparecem quando há justificativa prática.</p>
      <div class="rolagem"><table class="tabela empilha"><thead><tr><th>Disciplina</th><th>Conteúdo previsto</th><th>Referência</th><th>Material teórico</th><th class="num">Questões</th><th>Laboratório e cenário</th><th>Dificuldade</th><th>Estado</th><th>Lacunas</th></tr></thead><tbody>
        ${visiveis.map((l) => `<tr>
          <td data-rotulo="Disciplina">${esc(l.disciplina)}${l.bloco ? `<div class="pequeno muted">${esc(l.bloco)}</div>` : ''}</td>
          <td data-rotulo="Conteúdo">${esc(l.conteudo)}</td>
          <td data-rotulo="Referência" class="pequeno">${esc(l.referencia)}</td>
          <td data-rotulo="Teoria" class="pequeno">${l.trilhas.map((t) => `<a href="#/trilhas/${t.area}">${esc(t.disciplina)}</a>`).join('<br>') || '—'}</td>
          <td data-rotulo="Questões" class="num">${l.questoes ? `<a href="#/questoes?area=${l.trilhas[0].area}&disciplina=${encodeURIComponent(l.trilhas[0].disciplina)}">${l.questoes}</a>` : '0'}</td>
          <td data-rotulo="Laboratório" class="pequeno">${l.labs.map((lab, i) => `<a href="#/lab/${lab}">${esc(LABS[lab].nome)}</a><div class="muted">${esc(l.cenarios[i])}</div>`).join('') || '—'}</td>
          <td data-rotulo="Dificuldade" class="pequeno">${esc(l.dificuldade)}</td>
          <td data-rotulo="Estado"><span class="estado ${l.estado}">${ESTADO[l.estado]}</span></td>
          <td data-rotulo="Lacunas" class="pequeno">${esc(l.lacunas.join('; ')) || '—'}</td></tr>`).join('') || '<tr><td colspan="9">Nenhum item com esse filtro.</td></tr>'}
      </tbody></table></div>
    </div>`;
    const form = el.querySelector('[data-filtros]');
    form.addEventListener('change', (e) => {
      const f = new FormData(form);
      if (e.target.name === 'cargo') { cod = f.get('cargo') || cod; filtro.disciplina = ''; history.replaceState(null, '', `#/concursos/${c.id}/matriz?cargo=${encodeURIComponent(cod)}`); } else { filtro.disciplina = f.get('disciplina'); filtro.estado = f.get('estado'); }
      render();
    });
    el.querySelector('[data-csv]').addEventListener('click', () => {
      const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
      const cab = ['Cargo', 'Disciplina', 'Bloco', 'Conteúdo previsto', 'Referência', 'Material teórico', 'Questões', 'Laboratório', 'Cenário profissional', 'Dificuldade', 'Estado', 'Lacunas'];
      const csv = [cab, ...linhas.map((l) => [l.cargo, l.disciplina, l.bloco ?? '', l.conteudo, l.referencia, l.trilhas.map((t) => `${nomeTrilha[t.area]} / ${t.disciplina}`).join('; '), l.questoes, l.labs.map((x) => LABS[x].nome).join('; '), l.cenarios.join('; '), l.dificuldade, ESTADO[l.estado], l.lacunas.join('; ')])].map((row) => row.map(q).join(';')).join('\r\n');
      baixarArquivo(`matriz-ufba-2026-cargo-${cod}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
    });
  };
  render();
}

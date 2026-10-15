// Laboratório de Time Scrum (UI)
import { criarTime, adicionarBacklogItem, planejarSprint, adicionarTarefa, concluirTarefa, concluirItem, registrarDaily, atualizarBurndown, registrarRetrospectiva, calcularMetricas } from '../../../domain/lab-scrum/index.js';
import { MISSOES_SCRUM } from '../../../domain/lab-scrum/misssoes.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

export default async function labScrum(el, { labs }) {
  let st = labs.carregar('scrum') ?? criarTime();
  el.innerHTML = cabecalhoLab('scrum') + `<div class="split">
      <div><div id="painel"></div></div>
      <aside class="card" id="missoes"></aside></div>`;
  const painel = el.querySelector('#painel');
  const missoesPainel = painelMissoes(el.querySelector('#missoes'), { lab: 'scrum', missoes: MISSOES_SCRUM, servico: { progresso: { missoes: labs.progresso?.missoes ?? {} }, concluirMissao(lab, m) { return false; } } });

  const desenhar = () => {
    const metricas = calcularMetricas(st);
    const sprint = st.sprint;
    painel.innerHTML = `
      <div class="card">
        <h2>Time</h2>
        <ul class="pequeno">${st.time.map(t => `<li><strong>${esc(t.tipo)}</strong> — ${esc(t.nome)} ${t.ativo ? '' : '(inativo)'}</li>`).join('')}</ul>
      </div>
      <div class="card">
        <h2>Sprint ${sprint.number} — ${esc(sprint.objetivo || 'Sem objetivo')}</h2>
        <p class="pequeno muted">Duração: ${sprint.duracao} dias · Restantes: ${sprint.diasRestantes} · Estado: ${sprint.estado}</p>
        <h3>Backlog da Sprint</h3>
        <ul class="pequeno">
          ${st.productBacklog.filter(i => i.estado === 'sprint').map(i => `
            <li><strong>${esc(i.id)}</strong> — ${esc(i.nome)} (${i.pontos} pts) — ${i.estado === 'done' ? '✅ Concluído' : 'Em andamento'}
              <ul class="pequeno">${i.tarefas.map((t, idx) => `<li>${t.concluida ? '☑' : '☐'} ${esc(t.nome)} <button data-t="${i.id}" data-idx="${idx}" class="btn pequeno">Concluir</button></li>`).join('')}</ul>
            </li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h2>Burndown</h2>
        <ul class="pequeno">${sprint.burndown.map(b => `<li>Dia ${b.dia}: ${b.pontos} pts</li>`).join('')}</ul>
        <button class="btn" data-atualizar-burndown>Atualizar Burndown</button>
      </div>
      <div class="card">
        <h2>Métricas</h2>
        <p class="pequeno">Velocidade: ${metricas.velociade.toFixed(1)} pts · Taxa de conclusão: ${(metricas.taxaConclusao * 100).toFixed(0)}% · Impedimentos: ${metricas.impedimentos}</p>
      </div>
      <div class="card">
        <h2>Retrospectiva</h2>
        <p class="pequeno">${st.retrospectiva.fezo ? esc(st.retrospectiva.fezo) : 'Preencha a retrospectiva ao final da sprint.'}</p>
        <button class="btn" data-retrospectiva>Preencher Retrospectiva</button>
      </div>
    `;

    painel.querySelectorAll('[data-t]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.t;
        const idx = parseInt(btn.dataset.idx);
        concluirTarefa(st, id, idx);
        desenhar();
      });
    });
    painel.querySelector('[data-atualizar-burndown]')?.addEventListener('click', () => {
      const dia = parseInt(prompt('Dia atual (0-14):', String(st.sprint.diasRestantes)));
      const pts = parseInt(prompt('Pontos restantes:', '0'));
      if (!isNaN(dia) && !isNaN(pts)) { atualizarBurndown(st, dia, pts); desenhar(); }
    });
    painel.querySelector('[data-retrospectiva]')?.addEventListener('click', () => {
      const feito = prompt('O que foi feito na sprint?', st.retrospectiva.fezo);
      const melhorias = prompt('O que pode melhorar?', st.retrospectiva.melhorias);
      const acoes = prompt('Ações para próxima sprint (uma por linha):', st.retrospectiva.acoes.join('\n'));
      if (feito !== null) {
        registrarRetrospectiva(st, { feito, melhorias, acoes: acoes ? acoes.split('\n').filter(Boolean) : [] });
        desenhar();
      }
    });
  };

  desenhar();
  confirmarReinicio(el, () => { st = criarTime(); labs.salvar('scrum', st); desenhar(); });
}
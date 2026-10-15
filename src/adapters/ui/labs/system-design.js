// Laboratório de System Design (UI)
import { criarSistema, definirRequisitos, adicionarComponente, definirArquitetura, adicionarTradeoff, gerarDiagrama, avaliarSistema } from '../../../domain/lab-system-design/index.js';
import { MISSOES_SYSTEM_DESIGN } from '../../../domain/lab-system-design/misssoes.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

export default async function labSystemDesign(el, { labs }) {
  let st = labs.carregar('system-design') ?? criarSistema();
  el.innerHTML = cabecalhoLab('system-design') + `<div class="split">
      <div><div id="painel"></div></div>
      <aside class="card" id="missoes"></aside></div>`;
  const painel = el.querySelector('#painel');
  const missoesPainel = painelMissoes(el.querySelector('#missoes'), { lab: 'system-design', missoes: MISSOES_SYSTEM_DESIGN, servico: { progresso: { missoes: labs.progresso?.missoes ?? {} }, concluirMissao(lab, m) { return false; } } });

  const desenhar = () => {
    const avaliacao = avaliarSistema(st);
    painel.innerHTML = `
      <div class="card">
        <h2>1. Requisitos</h2>
        <p class="pequeno muted">Nome: ${esc(st.nome || '—')} · Escalabilidade: ${esc(st.requisitos.escalabilidade || '—')} · Confiabilidade: ${esc(st.requisitos.confiabilidade || '—')} · Custo: ${esc(st.requisitos.custo || '—')}</p>
        <button class="btn" data-definir-requisitos>Definir Requisitos</button>
      </div>
      <div class="card">
        <h2>2. Arquitetura</h2>
        <p class="pequeno">Tipo: ${esc(st.arquitetura.tipo || '—')} · Banco: ${esc(st.arquitetura.banco || '—')} · Cache: ${esc(st.arquitetura.cache || '—')} · Mensageria: ${esc(st.arquitetura.mensageria || '—')}</p>
        <button class="btn" data-definir-arquitetura>Definir Arquitetura</button>
        <button class="btn" data-adicionar-componente>Adicionar Componente</button>
      </div>
      <div class="card">
        <h2>3. Trade-offs</h2>
        <ul class="pequeno">${st.tradeoffs.length ? st.tradeoffs.map(t => `<li><strong>${esc(t.decisao)}</strong>: ganho=${esc(t.ganho)}, perda=${esc(t.perda)} — ${esc(t.justificativa)}</li>`).join('') : '<li>Nenhum trade-off registrado.</li>'}</ul>
        <button class="btn" data-adicionar-tradeoff>Adicionar Trade-off</button>
      </div>
      <div class="card">
        <h2>4. Diagrama</h2>
        <pre class="mono pequeno">${esc(gerarDiagrama(st))}</pre>
      </div>
      <div class="card">
        <h2>5. Avaliação</h2>
        <p class="pequeno">Score: <strong>${avaliacao.score}/100</strong></p>
        <ul class="pequeno">${avaliacao.feedback.map(f => `<li>${esc(f)}</li>`).join('') || '<li>Nenhum feedback.</li>'}</ul>
      </div>
    `;

    painel.querySelector('[data-definir-requisitos]')?.addEventListener('click', () => {
      const nome = prompt('Nome do sistema:', st.nome);
      const escalabilidade = prompt('Escalabilidade (alta/media/baixa):', st.requisitos.escalabilidade);
      const confiabilidade = prompt('Confiabilidade (alta/media/baixa):', st.requisitos.confiabilidade);
      const custo = prompt('Custo (alto/medio/baixo):', st.requisitos.custo);
      const funcional = prompt('Requisitos funcionais (separados por vírgula):', st.requisitos.funcional.join(','));
      if (nome !== null) {
        definirRequisitos(st, { nome, escalabilidade, confiabilidade, custo, funcional: funcional ? funcional.split(',').map(s => s.trim()) : [] });
        desenhar();
      }
    });
    painel.querySelector('[data-definir-arquitetura]')?.addEventListener('click', () => {
      const tipo = prompt('Tipo de arquitetura (monolitica/microservicos/serverless):', st.arquitetura.tipo);
      const banco = prompt('Banco de dados:', st.arquitetura.banco);
      const cache = prompt('Cache:', st.arquitetura.cache);
      const mensageria = prompt('Mensageria:', st.arquitetura.mensageria);
      const camadas = prompt('Camadas (separadas por vírgula):', st.arquitetura.camadas.join(','));
      if (tipo !== null) {
        definirArquitetura(st, { tipo, banco, cache, mensageria, camadas: camadas ? camadas.split(',').map(s => s.trim()) : [] });
        desenhar();
      }
    });
    painel.querySelector('[data-adicionar-componente]')?.addEventListener('click', () => {
      const nome = prompt('Nome do componente:');
      const tecnologia = prompt('Tecnologia:');
      const responsabilidade = prompt('Responsabilidade:');
      const escala = prompt('Escala (ex: 1, 10, 100):', '1');
      if (nome && tecnologia) {
        adicionarComponente(st, { nome, tecnologia, responsabilidade: responsabilidade || '', escala: escala || '1' });
        desenhar();
      }
    });
    painel.querySelector('[data-adicionar-tradeoff]')?.addEventListener('click', () => {
      const decisao = prompt('Decisão:');
      const ganho = prompt('Ganho:');
      const perda = prompt('Perda:');
      const justificativa = prompt('Justificativa:');
      if (decisao) {
        adicionarTradeoff(st, { decisao, ganho, perda, justificativa: justificativa || '' });
        desenhar();
      }
    });
  };

  desenhar();
  confirmarReinicio(el, () => { st = criarSistema(); labs.salvar('system-design', st); desenhar(); });
}
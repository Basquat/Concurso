// Laboratório de Time Scrum
// Simula a dinâmica de um time Scrum: cerimônias, papéis, artefatos e métricas.

export const TIME_SCRUM = {
  time: [
    { nome: 'Product Owner', tipo: 'PO', ativo: true },
    { nome: 'Scrum Master', tipo: 'SM', ativo: true },
    { nome: 'Dev Frontend', tipo: 'Dev', ativo: true },
    { nome: 'Dev Backend', tipo: 'Dev', ativo: true },
    { nome: 'Dev Fullstack', tipo: 'Dev', ativo: true },
    { nome: 'QA', tipo: 'QA', ativo: true },
    { nome: 'UX Designer', tipo: 'Design', ativo: true },
  ],
  productBacklog: [],
  sprint: { numero: 1, objetivo: '', duracao: 14, diasRestantes: 14, burndown: [], estado: 'planejamento' },
 Daily: [],
  retrospectiva: { feito: '', melhorias: '', acoes: [] },
  metricas: { velociade: 0, taxaConclusao: 0, impedimentos: 0 },
};

export function criarTime() {
  return JSON.parse(JSON.stringify(TIME_SCRUM));
}

export function adicionarBacklogItem(time, { nome, historia, pontos, prioridade }) {
  const item = {
    id: `BI-${time.productBacklog.length + 1}`,
    nome,
    historia: historia || nome,
    pontos: pontos || 1,
    prioridade: prioridade || 'media',
    estado: 'backlog',
    tarefas: [],
    aceite: false,
  };
  time.productBacklog.push(item);
  return item;
}

export function planejarSprint(time, { objetivo, itens }) {
  time.sprint.objetivo = objetivo;
  time.sprint.duracao = 14;
  time.sprint.diasRestantes = 14;
  time.sprint.burndown = [{ dia: 0, pontos: 0 }];
  let pontosTotais = 0;
  itens.forEach(id => {
    const item = time.productBacklog.find(i => i.id === id);
    if (item) {
      item.estado = 'sprint';
      pontosTotais += item.pontos;
    }
  });
  time.sprint.burndown[0].pontos = pontosTotais;
  time.sprint.estado = 'em-andamento';
  return { ok: true, msg: `Sprint planejada com ${itens.length} itens (${pontosTotais} pontos).` };
}

export function adicionarTarefa(time, itemId, tarefa) {
  const item = time.productBacklog.find(i => i.id === itemId);
  if (!item) return { ok: false, msg: 'Item não encontrado.' };
  item.tarefas.push({ nome: tarefa, concluida: false });
  return { ok: true, msg: 'Tarefa adicionada.' };
}

export function concluirTarefa(time, itemId, tarefaIdx) {
  const item = time.productBacklog.find(i => i.id === itemId);
  if (!item) return { ok: false, msg: 'Item não encontrado.' };
  if (item.tarefas[tarefaIdx]) item.tarefas[tarefaIdx].concluida = true;
  return { ok: true, msg: 'Tarefa concluída.' };
}

export function concluirItem(time, itemId) {
  const item = time.productBacklog.find(i => i.id === itemId);
  if (!item) return { ok: false, msg: 'Item não encontrado.' };
  item.estado = 'done';
  item.aceite = true;
  return { ok: true, msg: 'Item concluído.' };
}

export function registrarDaily(time, { dia, participantes, feito, impedimentos }) {
  time.Daily.push({ dia, participantes, feito, impedimentos });
  if (impedimentos && impedimentos.length > 0) time.metricas.impedimentos += impedimentos.length;
  return { ok: true, msg: `Daily do dia ${dia} registrado.` };
}

export function atualizarBurndown(time, dia, pontosRestantes) {
  time.sprint.burndown.push({ dia, pontos: pontosRestantes });
  time.sprint.diasRestantes = 14 - dia;
  return { ok: true, msg: `Burndown atualizado: ${pontosRestantes} pontos restantes.` };
}

export function registrarRetrospectiva(time, { feito, melhorias, acoes }) {
  time.retrospectiva.fezo = feito;
  time.retrospectiva.melhorias = melhorias;
  time.retrospectiva.acoes = acoes;
  return { ok: true, msg: 'Retrospectiva registrada.' };
}

export function calcularMetricas(time) {
  const concluidos = time.productBacklog.filter(i => i.estado === 'done');
  const totalPontos = concluidos.reduce((s, i) => s + i.pontos, 0);
  const sprintPontos = time.sprint.burndown.length > 0 ? time.sprint.burndown[0].pontos : 0;
  time.metricas.velociade = sprintPontos > 0 ? totalPontos / sprintPontos : 0;
  time.metricas.taxaConclusao = time.productBacklog.length > 0 ? concluidos.length / time.productBacklog.length : 0;
  return time.metricas;
}
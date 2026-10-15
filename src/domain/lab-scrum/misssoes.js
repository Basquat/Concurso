export const MISSOES_SCRUM = [
  { id: 'scrum-backlog', titulo: 'Criar product backlog', xp: 50, descricao: 'Adicione pelo menos 3 itens ao backlog.', dica: 'Use o botão "Adicionar Item" (simulado).' },
  { id: 'scrum-sprint', titulo: 'Planejar uma sprint', xp: 75, descricao: 'Planeje uma sprint com objetivo e itens.', dica: 'Defina o objetivo e selecione itens do backlog.' },
  { id: 'scrum-daily', titulo: 'Realizar uma Daily', xp: 60, descricao: 'Registre uma reunião diária.', dica: 'Preencha participantes, feito e impedimentos.' },
  { id: 'scrum-burndown', titulo: 'Atualizar burndown', xp: 55, descricao: 'Atualize o burndown da sprint.', dica: 'Regione os pontos restantes por dia.' },
  { id: 'scrum-retro', titulo: 'Realizar retrospectiva', xp: 80, descricao: 'Preencha a retrospectiva da sprint.', dica: 'Registre feito, melhorias e ações.' },
  { id: 'scrum-metricas', titulo: 'Calcular métricas', xp: 40, descricao: 'Calcule velocidade e taxa de conclusão.', dica: 'As métricas são calculadas automaticamente.' },
];
const C = { 'scrum-backlog': (t) => t.productBacklog.length >= 3, 'scrum-sprint': (t) => !!t.sprint.objetivo && t.productBacklog.some((i) => i.estado !== 'backlog'), 'scrum-daily': (t) => (t.Daily || []).length > 0, 'scrum-burndown': (t) => t.sprint.burndown.length > 1, 'scrum-retro': (t) => !!(t.retrospectiva.fezo || t.retrospectiva.feito), 'scrum-metricas': (t) => t.productBacklog.some((i) => i.estado === 'done') };
MISSOES_SCRUM.forEach((m) => { m.check = C[m.id] ?? ((t) => !!C[Object.keys(C).find((k) => m.id.startsWith(k.split('-').slice(0,2).join('-')))]?.(t)); });

export const MISSOES_SYSTEM_DESIGN = [
  { id: 'sd-requisitos', titulo: 'Definir requisitos', xp: 50, descricao: 'Defina o nome, escalabilidade, confiabilidade e custo do sistema.', dica: 'Use o botão "Definir Requisitos".' },
  { id: 'sd-arquitetura', titulo: 'Definir arquitetura', xp: 75, descricao: 'Escolha tipo, banco, cache e mensageria.', dica: 'Use o botão "Definir Arquitetura".' },
  { id: 'sd-componentes', titulo: 'Adicionar componentes', xp: 60, descricao: 'Adicione pelo menos 3 componentes.', dica: 'Use o botão "Adicionar Componente".' },
  { id: 'sd-tradeoff', titulo: 'Documentar trade-off', xp: 55, descricao: 'Registre pelo menos um trade-off.', dica: 'Use o botão "Adicionar Trade-off".' },
  { id: 'sd-diagrama', titulo: 'Gerar diagrama', xp: 40, descricao: 'Gere o diagrama do sistema.', dica: 'O diagrama é gerado automaticamente.' },
  { id: 'sd-avaliacao', titulo: 'Obter score acima de 70', xp: 80, descricao: 'Alcance pelo menos 70 pontos na avaliação.', dica: 'Siga as dicas de melhoria.' },
];
const C = { 'sd-requisitos': (s) => !!s.nome && !!s.requisitos.escalabilidade, 'sd-arquitetura': (s) => !!s.arquitetura.tipo && !!s.arquitetura.banco, 'sd-componentes': (s) => s.arquitetura.componentes.length >= 3, 'sd-tradeoff': (s) => s.tradeoffs.length >= 1, 'sd-diagrama': (s) => !!s.diagrama && s.arquitetura.componentes.length > 0, 'sd-avaliacao': (s) => s.validacao.score >= 70 };
MISSOES_SYSTEM_DESIGN.forEach((m) => { m.check = C[m.id]; });

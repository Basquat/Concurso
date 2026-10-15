import { LABS } from '../labs/registro.js';
import { esc } from '../dom.js';

// Moldura de cada laboratório inspirada na ferramenta real (apenas visual; o comportamento vem do lab).
const MOLDURA = {
  linux: ['Terminal — aluno@srv-didatico: ~', ['Arquivo', 'Editar', 'Ver', 'Pesquisar', 'Terminal', 'Ajuda']],
  servidor: ['Console do servidor — srv-didatico', ['Visão geral', 'Logs', 'Armazenamento', 'Rede', 'Contas', 'Serviços', 'Software', 'Terminal']],
  sql: ['DBeaver (simulado) — prefeitura.sqlite', ['Arquivo', 'Editar', 'Navegar', 'Pesquisar', 'Editor SQL', 'Banco de dados', 'Janela', 'Ajuda']],
  ide: ['Visual Studio Code (simulado) — concurso-lab', ['Arquivo', 'Editar', 'Seleção', 'Ver', 'Ir', 'Executar', 'Terminal', 'Ajuda']],
  aws: ['Console de Gerenciamento da AWS (simulado) — us-east-1', ['Serviços', 'EC2', 'VPC', 'S3', 'IAM', 'RDS', 'CloudWatch', 'Faturamento']],
  redes: ['Packet Tracer (simulado) — topologia.pkt', ['Arquivo', 'Editar', 'Opções', 'Visualizar', 'Ferramentas', 'Extensões', 'Ajuda']],
  bi: ['Power BI Desktop (simulado) — vendas.pbix', ['Arquivo', 'Página Inicial', 'Inserir', 'Modelagem', 'Exibir', 'Otimizar', 'Ajuda']],
  planilha: ['Excel (simulado) — almoxarifado.xlsx', ['Arquivo', 'Página Inicial', 'Inserir', 'Layout da Página', 'Fórmulas', 'Dados', 'Revisão', 'Exibir']],
  contabil: ['Sistema Contábil (simulado) — Comercial Exemplo Ltda', ['Cadastros', 'Lançamentos', 'Livros', 'Demonstrações', 'Relatórios', 'Utilitários']],
  saude: ['Prontuário Eletrônico (simulado) — Enfermaria', ['Pacientes', 'Prescrição', 'Cálculos', 'Sinais vitais', 'Relatórios']],
  educacao: ['Ambiente Virtual de Aprendizagem (simulado)', ['Painel', 'Meus cursos', 'Planejamento', 'Avaliações', 'Notas']],
  scrum: ['Jira Software (simulado) — Projeto CONCURSO', ['Seus trabalhos', 'Projetos', 'Filtros', 'Painéis', 'Equipes', 'Aplicativos']],
  'system-design': ['Diagrama de arquitetura (simulado) — sistema.drawio', ['Arquivo', 'Editar', 'Exibir', 'Organizar', 'Extras', 'Ajuda']],
};

export default async function lab(el, ctx, { args: [id] }) {
  const meta = LABS[id];
  if (!meta) { el.innerHTML = '<p>Laboratório não encontrado. <a href="#/laboratorios">Ver todos</a></p>'; return; }
  document.title = `${meta.nome} · Concurso Lab`;
  const mod = await meta.carregar();
  const limpar = await mod.default(el, ctx);
  const [titulo, menu] = MOLDURA[id] ?? [meta.nome, []];
  const janela = document.createElement('section');
  janela.className = `janela tema-${id}`;
  janela.setAttribute('aria-label', titulo);
  janela.innerHTML = `<div class="janela-titulo"><span class="janela-botoes" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(titulo)}</span></div>
    <nav class="janela-menu" aria-label="Menu da ferramenta (ilustrativo)">${menu.map((m) => `<span>${esc(m)}</span>`).join('')}</nav><div class="janela-corpo"></div>`;
  const corpo = janela.querySelector('.janela-corpo');
  const ancora = el.querySelector('details.recolhe') ?? el.querySelector('.lab-topo') ?? el.querySelector('.lab-cab');
  let n = ancora?.nextSibling;
  while (n) { const prox = n.nextSibling; corpo.append(n); n = prox; }
  if (ancora) ancora.after(janela); else el.append(janela);
  return () => { document.title = 'Concurso Lab'; if (typeof limpar === 'function') limpar(); };
}

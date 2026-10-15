// Catálogo dos laboratórios: metadados, transparência sobre o que é simulado e carregamento sob demanda.
import { esc, toast } from '../dom.js';

export const LABS = {
  linux: {
    nome: 'Terminal Linux', sigla: 'sh', trilha: 'ti',
    resumo: 'Administre um servidor: arquivos, permissões, logs, processos, serviços, firewall e SSH.',
    simulado: 'Sistema de arquivos, usuários, processos e serviços existem só na memória do navegador. O interpretador implementa um subconjunto do Bash (pipes, &&, ;, >, >>, globs, chaves) e cerca de 50 comandos com mensagens no padrão GNU/Linux em português. Não há kernel, rede nem execução real; comandos destrutivos são bloqueados.',
    carregar: () => import('./linux.js'),
  },
  sql: {
    nome: 'Banco de dados SQL', sigla: 'sql', trilha: 'ti',
    resumo: 'Consultas reais em SQLite: junções, agregações, subconsultas, índices, transações e integridade.',
    simulado: 'O mecanismo é o SQLite real compilado para WebAssembly (sql.js), executando no seu navegador. As consultas são de fato executadas. Diferenças em relação a PostgreSQL e MySQL são apontadas no painel de dialetos — recursos exclusivos deles (ex.: SERIAL, ILIKE, usuários/GRANT) não existem no SQLite.',
    carregar: () => import('./sql.js'),
  },
  ide: {
    nome: 'IDE de programação', sigla: 'ide', trilha: 'ti',
    resumo: 'Editor com abas, realce de sintaxe, problemas, formatação e testes em JavaScript, PHP e Java.',
    simulado: 'JavaScript roda de verdade num Web Worker isolado. PHP roda de verdade no interpretador oficial PHP 8 compilado para WebAssembly (download de cerca de 12 MB na primeira execução). Java NÃO é compilado: há análise estática didática com mensagens no formato do javac — o resultado não equivale a compilar.',
    carregar: () => import('./ide.js'),
  },
  aws: {
    nome: 'Arquitetura em nuvem (AWS)', sigla: 'aws', trilha: 'ti',
    resumo: 'Monte arquiteturas com VPC, sub-redes, balanceador, Auto Scaling, RDS, S3, Lambda e IAM; valide, estime custos e simule falhas.',
    simulado: 'Nenhuma chamada é feita à AWS e nenhuma credencial é pedida. As validações reproduzem regras documentadas (ALB em duas ou mais AZs, DB subnet group em duas ou mais AZs, um Internet Gateway por VPC, encadeamento de Security Groups). Custos são aproximações on-demand de us-east-1 apenas para comparação — use a AWS Pricing Calculator para valores reais.',
    carregar: () => import('./aws.js'),
  },
  redes: {
    nome: 'Redes e sub-redes', sigla: 'net', trilha: 'ti',
    resumo: 'Calcule sub-redes CIDR e diagnostique uma rede com gateway, máscara e DNS errados.',
    simulado: 'Cálculos IPv4 são exatos. A topologia (duas LANs e um roteador) é um modelo didático: o ping considera ARP na mesma sub-rede, gateway padrão, rota de volta e resolução DNS — sem TTL, VLAN, NAT ou perda de pacotes.',
    carregar: () => import('./redes.js'),
  },
  bi: {
    nome: 'Análise de dados (BI)', sigla: 'bi', trilha: 'ti',
    resumo: 'Fluxo do Power BI: limpar dados, relacionar tabelas, criar medidas DAX e montar visuais.',
    simulado: 'Inspirado no fluxo do Power BI; não é o Power BI. Os dados são processados de verdade, com contexto de filtro e propagação por relacionamentos. O DAX implementado é um subconjunto (SUM, AVERAGE, MIN, MAX, COUNTROWS, DISTINCTCOUNT, DIVIDE, CALCULATE com filtros simples, RELATED). Sem linguagem M completa, hierarquias ou inteligência de tempo.',
    carregar: () => import('./bi.js'),
  },
  planilha: {
    nome: 'Planilha eletrônica', sigla: 'xls', trilha: 'adm',
    resumo: 'Controle de estoque do almoxarifado com SOMA, SE, CONT.SE, SOMASE e PROCV, ordenação e gráfico.',
    simulado: 'Motor de fórmulas próprio, compatível com a sintaxe de Excel/Calc em português e inglês (; ou , como separador). Implementa as funções mais cobradas em concursos; não há formatação condicional, macros nem tabelas dinâmicas.',
    carregar: () => import('./planilha.js'),
  },
  contabil: {
    nome: 'Escrituração contábil', sigla: 'ctb', trilha: 'contabil',
    resumo: 'Lance fatos por partidas dobradas e acompanhe razão, balancete, DRE e balanço.',
    simulado: 'Empresa comercial fictícia com plano de contas simplificado. Regras de débito e crédito, saldos e demonstrações são calculados de verdade (valores em centavos). Não contempla tributos, encerramento formal do exercício nem o PCASP do setor público.',
    carregar: () => import('./contabil.js'),
  },
  saude: {
    nome: 'Cálculos de enfermagem', sigla: 'sau', trilha: 'saude',
    resumo: 'Gotejamento em macro e microgotas e volume de medicamento por regra de três.',
    simulado: 'Exercícios teóricos gerados aleatoriamente com as fórmulas usuais do ensino de enfermagem. Não há pacientes, prontuários ou dados reais. Não substitui protocolo institucional, prescrição, dupla checagem nem supervisão.',
    carregar: () => import('./saude.js'),
  },
educacao: {
    nome: 'Planejamento de aula', sigla: 'edu', trilha: 'educacao',
    resumo: 'Plano de aula com objetivos (Bloom), atividades, avaliação e acessibilidade, corrigido por rubrica.',
    simulado: 'A rubrica verifica critérios explícitos de alinhamento (objetivo, atividade e avaliação), tempo e inclusão. É um apoio formativo: não qualidade pedagógica de forma integral.',
    carregar: () => import('./educacao.js'),
  },
  servidor: {
    nome: 'Montagem de Servidor', sigla: 'srv', icone: '🖥️', trilha: 'ti',
    resumo: 'Monte e configure um servidor Ubuntu didático: instale pacotes, inicie serviços, crie usuários e configure a rede.',
    simulado: 'O servidor é um modelo em memória com Ubuntu 22.04 simulado. Comandos como ligar, desligar, instalar pacotes (curl, git, nginx, postgresql, docker, etc.), criar usuários, configurar rede e iniciar serviços são simulados. Não há kernel real, nem execução de binários. Serviços como nginx, postgresql e docker existem apenas como estado.',
    carregar: () => import('./servidor.js'),
  },
  scrum: {
    nome: 'Time Scrum', sigla: 'scrum', icone: '📋', trilha: 'adm',
    resumo: 'Gerencie um time Scrum: product backlog, planejamento de sprint, Daily, burndown, retrospectiva e métricas.',
    simulado: 'Modelo didático de Scrum com papéis (PO, SM, Devs, QA, UX), artefatos (backlog, sprint, burndown, retrospectiva) e cerimônias. Métricas como velocidade e taxa de conclusão são calculadas com base no estado. Não há integração com ferramentas reais (Jira, Azure DevOps).',
    carregar: () => import('./scrum.js'),
  },
  'system-design': {
    nome: 'System Design', sigla: 'sd', icone: '🏗️', trilha: 'ti',
    resumo: 'Projete sistemas escaláveis: defina requisitos, arquitetura, componentes, trade-offs e receba uma avaliação.',
    simulado: 'O validador reproduz regras gerais de arquitetura (escolha de banco, cache para alta cargal, mensageria para alta escalabilidade, custo vs tipo de arquitetura). A avaliação é heurística, não substitui revisão por um arquiteto experiente.',
    carregar: () => import('./system-design.js'),
  },
};

export function cabecalhoLab(id, extras = '') {
  const l = LABS[id];
  return `<div class="trilha-nav"><a href="#/laboratorios">Laboratórios</a></div>
  <div class="lab-topo">
    <div><span class="sobretitulo">Laboratório</span><h1>${esc(l.nome)}</h1><p class="muted" style="margin:0">${esc(l.resumo)}</p></div>
    <div class="linha">${extras}<button class="botao perigo peq" type="button" data-reiniciar>Reiniciar ambiente</button></div>
  </div>
  <details class="recolhe aviso info" style="margin-bottom:16px"><summary>O que é real e o que é simulado</summary><p style="margin:0">${esc(l.simulado)}</p></details>`;
}

// Painel de missões: verificação por estado, conclusão registrada uma única vez com XP.
export function painelMissoes(el, { lab, missoes, servico }) {
  const desenhar = () => {
    const abertas = new Set([...el.querySelectorAll('details[open]')].map((d) => d.dataset.id));
    const feitas = missoes.filter((m) => servico.progresso.missoes[`${lab}/${m.id}`]).length;
    el.innerHTML = `<div class="linha entre"><h2 style="margin:0;font-size:1rem">Missões</h2><span class="pequeno muted">${feitas} de ${missoes.length}</span></div>
      <ul class="missoes">${missoes.map((m) => {
        const feita = !!servico.progresso.missoes[`${lab}/${m.id}`];
        return `<li><div class="titulo"><span>${esc(m.titulo)}</span><span class="estado ${feita ? 'feito' : ''}">${feita ? 'Concluída' : `${m.xp} XP`}</span></div>
          <div class="pequeno">${esc(m.descricao)}</div>${m.dica ? `<details data-id="${m.id}" ${abertas.has(m.id) ? 'open' : ''}><summary>Dica</summary>${esc(m.dica)}</details>` : ''}</li>`;
      }).join('')}</ul>`;
  };
  desenhar();
  return {
    verificar(checar) {
      let nova = false;
      for (const m of missoes) {
        let ok = false;
        try { ok = checar(m); } catch { ok = false; }
        if (ok && servico.concluirMissao(lab, m)) { nova = true; toast(`Missão concluída: ${m.titulo} (+${m.xp} XP)`); }
      }
      if (nova) desenhar();
    },
  };
}

export function confirmarReinicio(el, aoConfirmar) {
  el.querySelector('[data-reiniciar]')?.addEventListener('click', () => {
    if (confirm('Reiniciar o ambiente do laboratório? O estado atual será descartado; missões concluídas e XP continuam.')) aoConfirmar();
  });
}

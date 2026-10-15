// Catálogo dos laboratórios: metadados, transparência sobre o que é simulado e carregamento sob demanda.
import { esc, toast } from '../dom.js';

export const LABS = {
  linux: {
    nome: 'Terminal Linux', icone: '🐧', trilha: 'ti',
    resumo: 'Administre um servidor: arquivos, permissões, logs, processos, serviços, firewall e SSH.',
    simulado: 'Sistema de arquivos, usuários, processos e serviços existem só na memória do navegador. O interpretador implementa um subconjunto do Bash (pipes, &&, ;, >, >>, globs, chaves) e cerca de 50 comandos com mensagens no padrão GNU/Linux em português. Não há kernel, rede nem execução real; comandos destrutivos são bloqueados.',
    carregar: () => import('./linux.js'),
  },
  sql: {
    nome: 'Banco de dados SQL', icone: '🗄️', trilha: 'ti',
    resumo: 'Consultas reais em SQLite: SELECT, JOINs, agregações, subconsultas, índices, transações e integridade.',
    simulado: 'O mecanismo é o SQLite real compilado para WebAssembly (sql.js), executando no seu navegador. As consultas são de fato executadas. Diferenças em relação a PostgreSQL e MySQL são apontadas no painel de dialetos — recursos exclusivos deles (ex.: SERIAL, ILIKE, usuários/GRANT) não existem no SQLite.',
    carregar: () => import('./sql.js'),
  },
  ide: {
    nome: 'IDE de programação', icone: '💻', trilha: 'ti',
    resumo: 'Editor com abas, realce de sintaxe, problemas, formatação e testes em JavaScript, PHP e Java.',
    simulado: 'JavaScript roda de verdade num Web Worker isolado. PHP roda de verdade no interpretador oficial PHP 8 compilado para WebAssembly (download de ~12 MB na primeira execução). Java NÃO é compilado: há análise estática didática com mensagens no formato do javac — o resultado não equivale a compilar.',
    carregar: () => import('./ide.js'),
  },
  aws: {
    nome: 'Arquitetura AWS', icone: '☁️', trilha: 'ti',
    resumo: 'Monte arquiteturas arrastando VPC, sub-redes, ALB, Auto Scaling, RDS, S3, Lambda e IAM; valide, estime custos e simule falhas.',
    simulado: 'Nenhuma chamada é feita à AWS e nenhuma credencial é pedida. As validações reproduzem regras documentadas (ALB em ≥2 AZs, DB subnet group em ≥2 AZs, um IGW por VPC, encadeamento de Security Groups). Custos são aproximações on-demand de us-east-1 apenas para comparação — use a AWS Pricing Calculator para valores reais.',
    carregar: () => import('./aws.js'),
  },
  redes: {
    nome: 'Redes e sub-redes', icone: '🌐', trilha: 'ti',
    resumo: 'Calcule sub-redes CIDR e diagnostique uma rede com gateway, máscara e DNS errados.',
    simulado: 'Cálculos IPv4 são exatos. A topologia (duas LANs e um roteador) é um modelo didático: o ping considera ARP na mesma sub-rede, gateway padrão, rota de volta e resolução DNS — sem TTL, VLAN, NAT ou perda de pacotes.',
    carregar: () => import('./redes.js'),
  },
  bi: {
    nome: 'Análise de dados (BI)', icone: '📊', trilha: 'ti',
    resumo: 'Fluxo do Power BI: limpar dados (Power Query), relacionar tabelas, criar medidas DAX e montar visuais.',
    simulado: 'Inspirado no fluxo do Power BI; não é o Power BI. Os dados são processados de verdade, com contexto de filtro e propagação por relacionamentos. O DAX implementado é um subconjunto (SUM, AVERAGE, MIN, MAX, COUNTROWS, DISTINCTCOUNT, DIVIDE, CALCULATE com filtros simples, RELATED). Sem M/Power Query completo, hierarquias ou inteligência de tempo.',
    carregar: () => import('./bi.js'),
  },
  planilha: {
    nome: 'Planilha eletrônica', icone: '📗', trilha: 'adm',
    resumo: 'Controle de estoque do almoxarifado com fórmulas (SOMA, SE, CONT.SE, SOMASE, PROCV), ordenação e gráfico.',
    simulado: 'Motor de fórmulas próprio, compatível com a sintaxe de Excel/Calc em português e inglês (; ou , como separador). Implementa as funções mais cobradas em concursos; não há formatação condicional, macros nem tabelas dinâmicas.',
    carregar: () => import('./planilha.js'),
  },
  contabil: {
    nome: 'Escrituração contábil', icone: '📒', trilha: 'contabil',
    resumo: 'Lance fatos contábeis por partidas dobradas e veja razão, balancete, DRE e balanço em tempo real.',
    simulado: 'Empresa comercial fictícia com plano de contas simplificado. Regras de débito/crédito, saldos e demonstrações são calculadas de verdade (valores em centavos). Não contempla tributos, encerramento formal do exercício nem o PCASP do setor público.',
    carregar: () => import('./contabil.js'),
  },
  saude: {
    nome: 'Cálculos de enfermagem', icone: '💉', trilha: 'saude',
    resumo: 'Gotejamento (macro e microgotas) e volume de medicamentos por regra de três.',
    simulado: 'Exercícios teóricos gerados aleatoriamente com as fórmulas usuais do ensino de enfermagem. Não há pacientes, prontuários ou dados reais. Não substitui protocolo institucional, prescrição, dupla checagem nem supervisão.',
    carregar: () => import('./saude.js'),
  },
  educacao: {
    nome: 'Planejamento de aula', icone: '🍎', trilha: 'educacao',
    resumo: 'Monte um plano de aula com objetivos (Bloom), atividades, avaliação e acessibilidade, corrigido por rubrica.',
    simulado: 'A rubrica verifica critérios explícitos de alinhamento (objetivo ↔ atividade ↔ avaliação), tempo e inclusão. É um apoio formativo: não avalia a qualidade pedagógica de forma integral.',
    carregar: () => import('./educacao.js'),
  },
};

export function cabecalhoLab(id, extras = '') {
  const l = LABS[id];
  return `<div class="lab-cab">
    <div><a class="pequeno" href="#/laboratorios">← Laboratórios</a><h1>${l.icone} ${esc(l.nome)}</h1><p class="muted">${esc(l.resumo)}</p></div>
    <div class="linha">${extras}<button class="btn perigo" data-reiniciar>Reiniciar laboratório</button></div>
  </div>
  <details class="simulacao callout" style="margin-bottom:14px"><summary>O que é real e o que é simulado aqui?</summary><p style="margin-top:8px">${esc(l.simulado)}</p></details>`;
}

// Painel de missões: verificação por estado, conclusão registrada uma única vez com XP.
export function painelMissoes(el, { lab, missoes, servico }) {
  const desenhar = () => {
    const abertas = new Set([...el.querySelectorAll('details[open]')].map((d) => d.dataset.id));
    const feitas = missoes.filter((m) => servico.progresso.missoes[`${lab}/${m.id}`]).length;
    el.innerHTML = `<div class="linha entre"><h3 style="margin:0">Missões</h3><span class="tag ${feitas === missoes.length ? 'ok' : ''}">${feitas}/${missoes.length}</span></div>
      <ul class="missoes" style="margin-top:10px">${missoes.map((m) => {
        const feita = !!servico.progresso.missoes[`${lab}/${m.id}`];
        return `<li class="${feita ? 'feita' : ''}"><div class="titulo"><span>${feita ? '✅' : '⬜'} ${esc(m.titulo)}</span><span class="tag">${m.xp} XP</span></div>
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
        if (ok && servico.concluirMissao(lab, m)) { nova = true; toast(`✅ Missão concluída: ${m.titulo} (+${m.xp} XP)`); }
      }
      if (nova) desenhar();
    },
  };
}

export function confirmarReinicio(el, aoConfirmar) {
  el.querySelector('[data-reiniciar]')?.addEventListener('click', () => {
    if (confirm('Reiniciar o laboratório? O estado atual do ambiente será descartado (missões concluídas e XP continuam).')) aoConfirmar();
  });
}

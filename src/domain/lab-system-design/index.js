// Laboratório de System Design
// Simula o processo de projetar sistemas escaláveis, com componentes, trade-offs e validação.

export const SISTEMA_INICIAL = {
  nome: '',
  requisitos: { funcional: [], naoFuncional: [], escalabilidade: '', confiabilidade: '', custo: '' },
  arquitetura: { tipo: '', camadas: [], componentes: [], servicos: [], banco: '', cache: '', mensageria: '' },
  diagrama: [],
  tradeoffs: [],
  validacao: { score: 0, feedback: [] },
};

export function criarSistema() {
  return JSON.parse(JSON.stringify(SISTEMA_INICIAL));
}

export function definirRequisitos(s, { nome, funcional, naoFuncional, escalabilidade, confiabilidade, custo }) {
  s.nome = nome;
  s.requisitos.funcional = funcional || [];
  s.requisitos.naoFuncional = naoFuncional || [];
  s.requisitos.escalabilidade = escalabilidade || '';
  s.requisitos.confiabilidade = confiabilidade || '';
  s.requisitos.custo = custo || '';
  return { ok: true, msg: `Requisitos definidos para "${nome}".` };
}

export function adicionarComponente(s, { nome, tipo, responsabilidade, tecnologia, escala }) {
  const comp = { nome, tipo, responsabilidade, tecnologia, escala: escala || '1' };
  s.arquitetura.componentes.push(comp);
  return comp;
}

export function definirArquitetura(s, { tipo, camadas, banco, cache, mensageria }) {
  s.arquitetura.tipo = tipo;
  s.arquitetura.camadas = camadas || [];
  s.arquitetura.banco = banco || '';
  s.arquitetura.cache = cache || '';
  s.arquitetura.mensageria = mensageria || '';
  return { ok: true, msg: `Arquitetura ${tipo} definida.` };
}

export function adicionarTradeoff(s, { decisao, ganho, perda, justificativa }) {
  const tradeoff = { decisao, ganho, perda, justificativa };
  s.tradeoffs.push(tradeoff);
  return tradeoff;
}

export function gerarDiagrama(s) {
  const linhas = [`# ${s.nome}`, ''];
  linhas.push('## Arquitetura');
  linhas.push(`Tipo: ${s.arquitetura.tipo}`);
  linhas.push(`Camadas: ${s.arquitetura.camadas.join(', ')}`);
  linhas.push(`Banco: ${s.arquitetura.banco}`);
  linhas.push(`Cache: ${s.arquitetura.cache}`);
  linhas.push(`Mensageria: ${s.arquitetura.mensageria}`);
  linhas.push('');
  linhas.push('## Componentes');
  s.arquitetura.componentes.forEach(c => {
    linhas.push(`- **${c.nome}** (${c.tecnologia}): ${c.responsabilidade} | Escala: ${c.escala}`);
  });
  linhas.push('');
  linhas.push('## Requisitos');
  linhas.push(`Funcionais: ${s.requisitos.funcional.join(', ')}`);
  linhas.push(`Não-funcionais: ${s.requisitos.naoFuncional.join(', ')}`);
  linhas.push(`Escalabilidade: ${s.requisitos.escalabilidade}`);
  linhas.push(`Confiabilidade: ${s.requisitos.confiabilidade}`);
  linhas.push('');
  linhas.push('## Trade-offs');
  s.tradeoffs.forEach(t => {
    linhas.push(`- Decisão: ${t.decisao} | Ganho: ${t.ganho} | Perda: ${t.perda} | Justificativa: ${t.justificativa}`);
  });
  s.diagrama = linhas.join('\n');
  return s.diagrama;
}

export function avaliarSistema(s) {
  const feedback = [];
  let score = 0;
  if (s.arquitetura.tipo) { score += 10; } else feedback.push('Defina o tipo de arquitetura (monolítica, microserviços, serverless).');
  if (s.arquitetura.banco) { score += 10; } else feedback.push('Escolha uma solução de banco de dados.');
  if (s.arquitetura.cache) { score += 5; } else feedback.push('Considere uma camada de cache para performance.');
  if (s.arquitetura.mensageria && s.requisitos.escalabilidade === 'alta') { score += 10; } else if (s.requisitos.escalabilidade === 'alta' && !s.arquitetura.mensageria) feedback.push('Para alta escalabilidade, adicione mensageria (Kafka, RabbitMQ).');
  if (s.arquitetura.componentes.length >= 3) { score += 15; } else feedback.push('Adicione mais componentes para desacoplar o sistema.');
  if (s.requisitos.confiabilidade === 'alta' && !s.arquitetura.mensageria) { score += 5; } else if (s.requisitos.confiabilidade === 'alta') { score += 10; }
  if (s.requisitos.custo === 'baixo' && s.arquitetura.tipo === 'microserviços') { score -= 5; feedback.push('Microserviços podem aumentar custo operacional; considere serverless ou monolítico modular para custo baixo.'); }
  if (s.tradeoffs.length > 0) { score += 10; } else feedback.push('Documente pelo menos um trade-off.');
  if (s.requisitos.funcional.length >= 3) { score += 10; } else feedback.push('Adicione mais requisitos funcionais.');
  score = Math.max(0, Math.min(100, score));
  s.validacao.score = score;
  s.validacao.feedback = feedback;
  return { score, feedback };
}
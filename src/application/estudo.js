// Caso de uso central: registrar o estudo (respostas, missões, simulados) e notificar a interface.
import { progressoVazio, registrarResposta, registrarMissao, registrarSimulado, nivel } from '../domain/gamification.js';
import { corrigir } from '../domain/quiz.js';

/** @param {{ repositorio: import('./ports.js').RepositorioProgresso, agora?: () => Date }} deps */
export function criarServicoEstudo({ repositorio, agora = () => new Date() }) {
  let p = { ...progressoVazio(), ...(repositorio.carregar() ?? {}) };
  const ouvintes = new Set();
  const atualizar = (novo, evento) => {
    const antes = nivel(p.xp).numero;
    p = novo;
    repositorio.salvar(p);
    const subiu = nivel(p.xp).numero > antes;
    ouvintes.forEach((fn) => fn(p, { ...evento, subiuNivel: subiu }));
  };

  return {
    get progresso() { return p; },
    ouvir(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },

    responder(questao, escolha) {
      const correta = corrigir(questao, escolha);
      atualizar(registrarResposta(p, { id: questao.id, area: questao.area, correta }, agora()), { tipo: 'resposta', correta });
      return correta;
    },

    // Devolve true se a missão foi concluída agora (primeira vez).
    concluirMissao(lab, missao) {
      const chave = `${lab}/${missao.id}`;
      if (p.missoes[chave]) return false;
      atualizar(registrarMissao(p, chave, missao.xp, agora()), { tipo: 'missao', missao, xp: missao.xp });
      return true;
    },

    concluirSimulado(resultado) {
      atualizar(registrarSimulado(p, resultado, agora()), { tipo: 'simulado' });
    },

    definirAlvo(id) { atualizar({ ...p, alvo: id }, { tipo: 'alvo' }); },

    exportar() { return JSON.stringify({ app: 'concurso-lab', versao: 1, progresso: p }, null, 2); },

    importar(texto) {
      const dados = JSON.parse(texto);
      const novo = dados?.progresso;
      if (dados?.app !== 'concurso-lab' || typeof novo?.xp !== 'number' || typeof novo.respostas !== 'object') throw new Error('Arquivo não reconhecido como progresso do Concurso Lab.');
      atualizar({ ...progressoVazio(), ...novo }, { tipo: 'importacao' });
    },

    zerar() { atualizar(progressoVazio(), { tipo: 'zerar' }); },
  };
}

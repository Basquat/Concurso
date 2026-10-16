// Caso de uso central: registrar o estudo (respostas, missões, aulas, simulados, revisões, tempo) e notificar a interface.
import { progressoVazio, registrarResposta, registrarMissao, registrarSimulado, nivel, diaLocal } from '../domain/gamification.js';
import { corrigir } from '../domain/quiz.js';
import { agendar, vencidos } from '../domain/srs.js';

export const XP_AULA = 20;

/** @param {{ repositorio: import('./ports.js').RepositorioProgresso, revisoes?: { carregar(): object|null, salvar(o: object): void }, agora?: () => Date }} deps */
export function criarServicoEstudo({ repositorio, revisoes = { carregar: () => null, salvar: () => {} }, agora = () => new Date() }) {
  let p = { ...progressoVazio(), ...(repositorio.carregar() ?? {}) };
  let srs = revisoes.carregar() ?? {};
  const ouvintes = new Set();
  const hoje = () => diaLocal(agora());
  const atualizar = (novo, evento) => {
    const antes = nivel(p.xp).numero;
    p = novo;
    repositorio.salvar(p);
    const subiu = nivel(p.xp).numero > antes;
    ouvintes.forEach((fn) => fn(p, { ...evento, subiuNivel: subiu }));
  };
  const revisar = (id, nota) => { srs = { ...srs, [id]: agendar(srs[id], nota, hoje()) }; revisoes.salvar(srs); };

  return {
    get progresso() { return p; },
    get revisoes() { return srs; },
    vencidas: () => vencidos(srs, hoje()),
    ouvir(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },

    responder(questao, escolha) {
      const correta = corrigir(questao, escolha);
      revisar(`q:${questao.id}`, correta ? 2 : 0);
      atualizar(registrarResposta(p, { id: questao.id, area: questao.area, correta }, agora()), { tipo: 'resposta', correta });
      return correta;
    },

    // Flashcards e revisões livres: nota 0..3.
    avaliarCartao(id, nota) {
      revisar(id, nota);
      atualizar({ ...p, xp: p.xp + (nota > 0 ? 3 : 1) }, { tipo: 'cartao' });
    },

    // Devolve true se a missão foi concluída agora (primeira vez).
    concluirMissao(lab, missao) {
      const chave = `${lab}/${missao.id}`;
      if (p.missoes[chave]) return false;
      atualizar(registrarMissao(p, chave, missao.xp, agora()), { tipo: 'missao', missao, xp: missao.xp });
      return true;
    },

    // Avanço nos slides; concluir a aula (ver o último slide) vale XP uma vez.
    registrarAula(id, { visto, total }) {
      const a = p.aulas?.[id] ?? { visto: 0, total };
      const novo = { visto: Math.max(a.visto, visto + 1), total, concluida: a.concluida };
      let xp = 0;
      if (!a.concluida && novo.visto >= total) { novo.concluida = hoje(); xp = XP_AULA; }
      if (novo.visto === a.visto && novo.concluida === a.concluida) return false;
      atualizar({ ...p, xp: p.xp + xp, aulas: { ...p.aulas, [id]: novo }, dias: xp ? [...new Set([...p.dias, hoje()])] : p.dias }, { tipo: 'aula', concluida: !!xp });
      return !!xp;
    },

    registrarMinuto() {
      const d = hoje();
      p = { ...p, tempo: { ...p.tempo, [d]: (p.tempo?.[d] ?? 0) + 1 } };
      repositorio.salvar(p);
    },

    concluirSimulado(resultado) {
      atualizar(registrarSimulado(p, resultado, agora()), { tipo: 'simulado' });
    },

    definirAlvo(alvo) { atualizar({ ...p, alvo }, { tipo: 'alvo' }); },
    definirMeta(meta) { atualizar({ ...p, meta: { ...p.meta, ...meta } }, { tipo: 'meta' }); },

    exportar() { return JSON.stringify({ app: 'concurso-lab', versao: 2, progresso: p, revisoes: srs }, null, 2); },

    importar(texto) {
      const dados = JSON.parse(texto);
      const novo = dados?.progresso;
      if (dados?.app !== 'concurso-lab' || typeof novo?.xp !== 'number' || typeof novo.respostas !== 'object') throw new Error('Arquivo não reconhecido como progresso do Concurso Lab.');
      if (dados.revisoes && typeof dados.revisoes === 'object') { srs = dados.revisoes; revisoes.salvar(srs); }
      atualizar({ ...progressoVazio(), ...novo }, { tipo: 'importacao' });
    },

    zerar() { srs = {}; revisoes.salvar(srs); atualizar(progressoVazio(), { tipo: 'zerar' }); },
  };
}

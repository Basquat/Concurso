// Questões e simulados. Uma questão:
// { id, area, disciplina, assunto, enunciado, alternativas: [..], correta: índice,
//   explicacao, referencia, origem: { tipo: 'autoral' } | { tipo: 'oficial', banca, concurso, ano, numero } }

export function corrigir(questao, escolha) {
  return escolha === questao.correta;
}

export function embaralhar(lista, rng = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function filtrar(questoes, { area, disciplina, somenteErros, respostas = {} } = {}) {
  return questoes.filter((q) =>
    (!area || q.area === area) &&
    (!disciplina || q.disciplina === disciplina) &&
    (!somenteErros || respostas[q.id]?.ultima === false));
}

export function montarSimulado(questoes, n, rng = Math.random) {
  return embaralhar(questoes, rng).slice(0, n);
}

// respostas: { [idQuestao]: índice escolhido | undefined }
export function apurar(questoes, respostas) {
  const porDisciplina = {};
  let acertos = 0;
  for (const q of questoes) {
    const ok = corrigir(q, respostas[q.id]);
    if (ok) acertos++;
    const d = (porDisciplina[q.disciplina] ??= { total: 0, acertos: 0 });
    d.total++;
    if (ok) d.acertos++;
  }
  return { total: questoes.length, acertos, pct: questoes.length ? Math.round((acertos / questoes.length) * 100) : 0, porDisciplina };
}

// Conteúdo servido como JSON estático (GitHub Pages). Cada concurso detalhado tem seu próprio arquivo em
// data/concursos/<id>.json, para que editais, cargos e critérios de concursos diferentes nunca se misturem.
const cache = {};
const json = (arq) => (cache[arq] ??= fetch(`data/${arq}`).then((r) => {
  if (!r.ok) throw new Error(`Falha ao carregar data/${arq} (${r.status})`);
  return r.json();
}).catch((e) => { delete cache[arq]; throw e; }));

/** @returns {import('../../application/ports.js').FonteConteudo} */
export const fonteEstatica = () => ({
  concursos: () => json('concursos.json'),
  concurso: (id) => {
    if (!/^[\w-]+$/.test(id)) return Promise.reject(new Error('Identificador de concurso inválido.'));
    return json(`concursos/${id}.json`);
  },
  trilhas: () => json('trilhas.json').then((d) => d.trilhas),
  questoes: () => json('questoes.json').then((d) => d.questoes),
});

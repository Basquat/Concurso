// Conteúdo servido como JSON estático (GitHub Pages). Para cadastrar um concurso, trilha ou questão
// basta editar os arquivos em /data — veja o README.
const cache = {};
const json = (arq) => (cache[arq] ??= fetch(`data/${arq}`).then((r) => {
  if (!r.ok) throw new Error(`Falha ao carregar data/${arq} (${r.status})`);
  return r.json();
}));

/** @returns {import('../../application/ports.js').FonteConteudo} */
export const fonteEstatica = () => ({
  concursos: () => json('concursos.json'),
  trilhas: () => json('trilhas.json').then((d) => d.trilhas),
  questoes: () => json('questoes.json').then((d) => d.questoes),
});

import { parseBanco } from '../../domain/banco.js';
// Conteúdo servido como JSON/texto estático (GitHub Pages). Cada concurso detalhado tem seu próprio arquivo em
// data/concursos/<id>.json, para que editais, cargos e critérios de concursos diferentes nunca se misturem.
const cache = {};
const baixar = (arq, tipo) => (cache[arq] ??= fetch(`data/${arq}`).then((r) => {
  if (!r.ok) throw new Error(`Falha ao carregar data/${arq} (${r.status})`);
  return tipo === 'texto' ? r.text() : r.json();
}).catch((e) => { delete cache[arq]; throw e; }));
const json = (arq) => baixar(arq, 'json');
const seguro = (id) => {
  if (!/^[\w.-]+$/.test(id)) throw new Error('Identificador inválido.');
  return id;
};

/** @returns {import('../../application/ports.js').FonteConteudo} */
export const fonteEstatica = () => ({
  concursos: () => json('concursos.json'),
  concurso: (id) => Promise.resolve().then(() => json(`concursos/${seguro(id)}.json`)),
  trilhas: () => json('trilhas.json').then((d) => d.trilhas),
  questoes: () => (cache.$questoes ??= json('indice.json')
    .then((ix) => Promise.all(ix.questoes.arquivos.map((a) => baixar(`questoes/${seguro(a)}`, 'texto').then((t) => parseBanco(t, a).questoes))))
    .then((ls) => ls.flat())
    .catch((e) => { delete cache.$questoes; throw e; })),
  indice: () => json('indice.json'),
  aula: (id) => Promise.resolve().then(() => baixar(`aulas/${seguro(id)}.md`, 'texto')),
});

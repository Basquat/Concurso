// Gera data/indice.json a partir de data/aulas/*.md e data/questoes/*.txt e valida o conteúdo.
// Uso: node tools/indice.mjs        (falha com código 1 se houver erro de conteúdo)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAula } from '../src/domain/aula.js';
import { parseBanco } from '../src/domain/banco.js';
import { AREAS } from '../src/domain/areas.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = (d) => path.join(raiz, 'data', d);
const erros = [];

const aulas = fs.readdirSync(dir('aulas')).filter((f) => f.endsWith('.md')).sort().map((arq) => {
  const { meta, slides, cartoes } = parseAula(fs.readFileSync(path.join(dir('aulas'), arq), 'utf8'));
  const id = arq.replace(/\.md$/, '');
  if (meta.id && meta.id !== id) erros.push(`aulas/${arq}: id "${meta.id}" difere do nome do arquivo`);
  if (!meta.titulo) erros.push(`aulas/${arq}: sem título`);
  if (!AREAS[meta.area]) erros.push(`aulas/${arq}: área desconhecida "${meta.area}"`);
  return {
    id, titulo: meta.titulo, area: meta.area, disciplina: meta.disciplina ?? '', cargos: meta.cargos ?? ['todos'], labs: meta.labs ?? [],
    resumo: meta.resumo ?? '', nivel: meta.nivel ?? 'basico', duracao: meta.duracao ?? Math.max(10, slides.length * 2), ordem: meta.ordem ?? 50,
    busca: meta.busca ?? meta.titulo, slides: slides.length, cartoes: cartoes.length, quizzes: slides.reduce((s, x) => s + (x.quizzes ?? 0), 0),
  };
}).sort((a, b) => a.area.localeCompare(b.area) || a.disciplina.localeCompare(b.disciplina) || a.ordem - b.ordem || a.titulo.localeCompare(b.titulo));

const ids = new Set();
const porArea = {};
const porDisciplina = {};
const arquivos = fs.readdirSync(dir('questoes')).filter((f) => f.endsWith('.txt')).sort();
let total = 0;
for (const arq of arquivos) {
  const { questoes, erros: e } = parseBanco(fs.readFileSync(path.join(dir('questoes'), arq), 'utf8'), arq);
  erros.push(...e);
  for (const q of questoes) {
    if (ids.has(q.id)) erros.push(`${arq}: id repetido ${q.id}`);
    ids.add(q.id);
    if (!AREAS[q.area]) erros.push(`${arq}: ${q.id} com área desconhecida "${q.area}"`);
    if (q.aula && !aulas.some((a) => a.id === q.aula)) erros.push(`${arq}: ${q.id} aponta para aula inexistente "${q.aula}"`);
    porArea[q.area] = (porArea[q.area] ?? 0) + 1;
    const k = `${q.area}|${q.disciplina}`;
    porDisciplina[k] = (porDisciplina[k] ?? 0) + 1;
    total++;
  }
}

const aulaIds = new Set();
for (const a of aulas) { if (aulaIds.has(a.id)) erros.push(`aula repetida ${a.id}`); aulaIds.add(a.id); }

const indice = { geradoEm: new Date().toISOString().slice(0, 10), aulas, questoes: { arquivos, total, porArea, porDisciplina } };
fs.writeFileSync(dir('indice.json'), `${JSON.stringify(indice, null, 1)}\n`);
console.log(`${aulas.length} aulas (${aulas.reduce((s, a) => s + a.slides, 0)} slides, ${aulas.reduce((s, a) => s + a.cartoes, 0)} flashcards) · ${total} questões em ${arquivos.length} arquivos`);
if (erros.length) {
  console.error(`\n${erros.length} problema(s):\n${erros.join('\n')}`);
  process.exitCode = 1;
}

// Gera data/questoes/treinos-gerados.txt a partir dos laboratórios de treino (src/domain/treinos/*.js):
// cada item de classificação vira uma questão de múltipla escolha e cada cálculo gera variações com distratores.
// O gabarito vem do próprio conteúdo validado dos treinos. Semente fixa: o arquivo só muda se os treinos mudarem.
// Uso: node tools/gerar-questoes.mjs && node tools/indice.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paraTexto } from '../src/domain/banco.js';
import { AREAS } from '../src/domain/areas.js';
import { sorteador, embaralhar, br } from '../src/domain/treinos/motor.js';

globalThis.document ??= {}; // registro.js importa helpers de DOM que não são usados aqui
const { LABS } = await import('../src/adapters/ui/labs/registro.js');
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VARIACOES = 4;

const fmt = (n, un) => {
  const v = br(n, Number.isInteger(n) ? 0 : 2);
  return un === 'R$' ? `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : un ? `${v} ${un}` : v;
};
function distratores(certo, rng) {
  const inteiro = Number.isInteger(certo);
  const brutos = [1.1, 0.9, 1.25, 0.8, 1.5, 0.5, 2, 0.75, 1.2].map((k) => certo * k).concat(inteiro ? [certo + 1, certo - 1, certo + 2, certo - 2, certo + 10] : []);
  const ok = embaralhar(brutos, rng).map((x) => (inteiro ? Math.round(x) : Math.round(x * 100) / 100)).filter((x) => x !== certo && (certo < 0 || x >= 0));
  return [...new Set(ok)].slice(0, 4);
}

const questoes = [];
for (const grupo of [...new Set(Object.values(LABS).map((l) => l.treino).filter(Boolean))].sort()) {
  const specs = (await import(`../src/domain/treinos/${grupo}.js`)).default;
  for (const [lab, spec] of Object.entries(specs)) {
    const area = LABS[lab].area;
    const base = { area, disciplina: AREAS[area].nome, referencia: `Laboratório: ${LABS[lab].nome}` };
    for (const e of spec.exercicios) {
      const rng = sorteador([...`${lab}/${e.id}`].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7));
      if (e.tipo === 'classificar') {
        e.itens.forEach(([texto, cat, expl], k) => {
          const alts = embaralhar(e.categorias.length <= 5 ? e.categorias : embaralhar(e.categorias.filter((c) => c !== cat), rng).slice(0, 4).concat(cat), rng);
          questoes.push({ ...base, id: `tr-${lab}-${e.id}-${k + 1}`, assunto: e.titulo, dificuldade: 'facil', enunciado: `${e.pergunta ?? 'Classifique'}\n\n**${texto}**`, alternativas: alts, correta: alts.indexOf(cat), explicacao: `Resposta: ${cat}.${expl ? ` ${expl}` : ''}` });
        });
      } else if (e.tipo === 'calc') {
        const vistos = new Set();
        for (let k = 0, n = 0; k < 20 && n < VARIACOES; k++) {
          const x = e.gerar(rng);
          if (typeof x.resposta !== 'number' || vistos.has(x.enunciado)) continue;
          const ds = distratores(x.resposta, rng);
          if (ds.length < 4) continue;
          vistos.add(x.enunciado);
          const alts = embaralhar([x.resposta, ...ds], rng);
          questoes.push({ ...base, id: `tr-${lab}-${e.id}-${++n}`, assunto: e.titulo, dificuldade: 'media', enunciado: x.enunciado, alternativas: alts.map((v) => fmt(v, x.unidade)), correta: alts.indexOf(x.resposta), explicacao: x.passos ?? `Fórmula: ${e.formula}.` });
        }
      }
    }
  }
}

const cab = '# Gerado por tools/gerar-questoes.mjs a partir dos laboratórios de treino. Não edite à mão: altere o treino e gere de novo.\n\n';
fs.writeFileSync(path.join(raiz, 'data', 'questoes', 'treinos-gerados.txt'), cab + paraTexto(questoes));
console.log(`${questoes.length} questões geradas de ${new Set(questoes.map((q) => q.referencia)).size} laboratórios`);

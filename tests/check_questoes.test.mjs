import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseBanco } from '../src/domain/banco.js';

const minimos = {'saude': 10, 'educacao': 8, 'gestao': 4, 'portugues': 65, 'logica': 42, 'informatica': 43, 'adm-publica': 65, 'ti': 175};

let totalErros = 0;
for (const f of fs.readdirSync('data/questoes')) {
  try {
    const content = fs.readFileSync(path.join('data/questoes', f), 'utf8');
    const { questoes, erros } = parseBanco(content, f);
    if (erros.length > 0) {
      console.log('ERROS em ' + f + ': ' + erros.join(', '));
      totalErros += erros.length;
    }
    const area = questoes[0]?.area;
    if (area && minimos[area] !== undefined) {
      const count = questoes.length;
      const status = count >= minimos[area] ? 'OK' : 'FAIL';
      console.log(area + ': ' + count + ' questoes (mínimo: ' + minimos[area] + ') - ' + status);
    }
  } catch (e) {
    console.log('Erro lendo ' + f + ': ' + e.message);
  }
}

const todasQuestoes = fs.readdirSync('data/questoes').flatMap((f) => parseBanco(fs.readFileSync(path.join('data/questoes', f), 'utf8'), f).questoes);
console.log('\nTotal questoes: ' + todasQuestoes.length);
console.log('\nVerificação por área:');
for (const [area, minimo] of [['saude', 10], ['educacao', 8], ['gestao', 4], ['portugues', 65], ['logica', 42], ['informatica', 43], ['adm-publica', 65], ['ti', 175]]) {
  const count = todasQuestoes.filter((q) => q.area === area).length;
  const status = count >= minimo ? 'OK' : 'FAIL';
  console.log('Banco da área ' + area + ': ' + count + ' questoes (mínimo: ' + minimo + ') - ' + status);
}

if (totalErros > 0) {
  console.log('\nTotal de erros de parse: ' + totalErros);
} else {
  console.log('\nNenhum erro de parse detectado.');
}
// Laboratórios de treino: todo laboratório registrado tem conteúdo válido e todo cálculo gerado confere com a própria resposta.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validar, conferir, numero, conferirOrdem, sorteador } from '../src/domain/treinos/motor.js';

assert.equal(numero('1.234,56'), 1234.56);
assert.equal(numero('0.125'), 0.125);
assert.equal(numero('R$ 90,00'), 90);
assert.ok(conferir({ resposta: 6.6667 }, '6,67'));
assert.ok(!conferir({ resposta: 6.6667 }, '6,7'));
assert.ok(conferir({ resposta: '7/12' }, ' 7/12 '));
assert.deepEqual(conferirOrdem(['a', 'b', 'c'], ['a', 'c', 'b']), [true, false, false]);
const r1 = sorteador(42);
const r2 = sorteador(42);
assert.equal(r1(), r2());

// Todo laboratório com "treino" no catálogo precisa existir no arquivo do grupo.
const reg = fs.readFileSync('src/adapters/ui/labs/registro.js', 'utf8');
const grupos = fs.readdirSync('src/domain/treinos').filter((f) => f !== 'motor.js').map((f) => f.replace(/\.js$/, ''));
let labs = 0;
let exercicios = 0;
for (const g of grupos) {
  const specs = (await import(`../src/domain/treinos/${g}.js`)).default;
  assert.match(reg, new RegExp(`\\b${g}: \\{`), `grupo ${g} não registrado no catálogo`);
  for (const [id, spec] of Object.entries(specs)) {
    for (const semente of [1, 2, 3]) assert.deepEqual(validar(id, spec, semente), [], `${g}/${id}`);
    assert.match(reg, new RegExp(`['\\s]${id.replace('-', '\\-')}'?: \\[`), `${id} não registrado no catálogo`);
    labs++;
    exercicios += spec.exercicios.length;
  }
}
console.log(`treinos: ok (${labs} laboratórios, ${exercicios} exercícios)`);

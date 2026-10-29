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

// Laboratórios com tecnologia real: RegExp e Web Crypto.
{
  const { DESAFIOS, avaliar, ocorrencias } = await import('../src/domain/regex.js');
  const r = String.raw;
  const solucoes = { cep: r`^\d{5}-\d{3}$`, cpf: r`^\d{3}\.\d{3}\.\d{3}-\d{2}$`, data: r`^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$`, placa: r`^[A-Z]{3}\d[A-Z]\d{2}$`, email: r`^[\w.]+@ufba\.br$`, nup: r`^\d{5}\.\d{6}\/\d{4}-\d{2}$`, telefone: r`^\(\d{2}\) \d{4,5}-\d{4}$`, log: 'ERROR', ipv4: r`^(\d{1,3}\.){3}\d{1,3}$`, senha: r`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` };
  for (const d of DESAFIOS) assert.ok(avaliar(solucoes[d.id], '', d).ok, `regex ${d.id}`);
  assert.ok(!avaliar(r`\d+`, '', DESAFIOS[0]).ok);
  assert.match(avaliar('(', '', DESAFIOS[0]).erro, /Invalid|Unterminated/i);
  assert.equal(ocorrencias(r`\d+`, '', 'a1 b22 c333').length, 3);
  const c = await import('../src/domain/cripto.js');
  assert.equal(c.cesar(c.SEGREDOS.cesar.texto, -c.SEGREDOS.cesar.k), 'Concurso Lab');
  assert.equal(c.deBase64(c.SEGREDOS.base64), 'Aprovado no concurso!');
  assert.equal(c.deBase64(c.paraBase64('ação')), 'ação');
  assert.equal(await c.resumo('SHA-256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await c.decifrar(await c.cifrar('segredo', 'senha'), 'senha'), 'segredo');
  await assert.rejects(c.decifrar(await c.cifrar('segredo', 'senha'), 'outra'));
  assert.ok(c.umCaractere('concurso', 'concursa') && !c.umCaractere('ab', 'ba'));
  console.log('regex e cripto: ok');
}

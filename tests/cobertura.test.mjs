import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapear, referencias, matriz, resumo } from '../src/domain/cobertura.js';

const ufba = JSON.parse(readFileSync(new URL('../data/concursos/ufba-2026.json', import.meta.url)));
assert.equal(ufba.cargos.length, 26);
assert.equal(ufba.totalVagas, 147);
for (const c of ufba.cargos) for (const p of c.programas) assert.ok(ufba.programas[p], `${c.codigo} sem programa ${p}`);

assert.deepEqual(mapear('Balanço hidroeletrolítico do paciente').labs, []); // não confunde com contabilidade
assert.ok(mapear('Shell Script; Script Bash').labs.includes('linux'));
assert.ok(mapear('linguagem SQL; procedures, triggers e views').labs.includes('sql'));
assert.deepEqual(referencias('Lei nº 14.133/2021 e ISO 27001'), ['Lei nº 14.133/2021', 'ISO 27001']);

const m = matriz(ufba, '402', (area, disc) => (area === 'ti' && disc === 'Banco de dados' ? 6 : 0));
const r = resumo(m);
assert.equal(r.total, m.length);
assert.equal(r.coberto + r.parcial + r.lacuna, r.total);
assert.ok(m.some((l) => l.estado === 'coberto' && l.labs.includes('sql')));
assert.equal(matriz(ufba, 'inexistente', () => 0).length, 0);
console.log('cobertura ok');

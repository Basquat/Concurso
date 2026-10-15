import assert from 'node:assert/strict';
import { avaliarPlanilha, deslocarFormula, ordenarLinhas, interpretar, formatar } from '../src/domain/sheet/formula.js';
import { planilhaInicial, verificar, COLUNAS } from '../src/domain/sheet/missions.js';

const v = (cel) => avaliarPlanilha(cel).valores;

// motor
assert.equal(interpretar('1.234,56'), 1234.56);
assert.equal(interpretar('24,90'), 24.9);
assert.equal(v({ A1: '2', A2: '3', A3: '=A1+A2*2' }).A3, 8);
assert.equal(v({ A1: '=1/0' }).A1.cod, '#DIV/0!');
assert.equal(v({ A1: '=A2', A2: '=A1' }).A1.cod, '#CIRC!');
assert.equal(v({ A1: '=FOO(1)' }).A1.cod, '#NOME?');
assert.equal(v({ A1: '="a"&"b"&1,5' }).A1.cod, '#NOME?'); // vírgula decimal não vale dentro de fórmula
assert.equal(v({ A1: '=SE(1>2;"x";"y")' }).A1, 'y');
assert.equal(v({ A1: '=IF(2>1,"x","y")' }).A1, 'x');
assert.equal(v({ A1: '=ARRED(2,345;2)' }).A1, 2.35);
assert.equal(v({ A1: '=ARRED(2.345;2)' }).A1, 2.35);
assert.equal(v({ A1: '=CONT.SE(A2;"x")', A2: 'x' }).A1.cod, '#VALOR!');
assert.equal(v({ A1: '5', A2: '"t"', A3: '=MÉDIA(A1:A2)' }).A3, 5);
assert.equal(deslocarFormula('=C2*$E$2+SOMA(F2:F9)&"A1"', 3), '=C5*$E$2+SOMA(F5:F12)&"A1"');
assert.equal(formatar(1234.5), '1.234,5');

// missões
let cel = planilhaInicial();
assert.ok(Object.values(verificar(cel)).every((x) => !x));
for (let l = 2; l <= 9; l++) { cel[`F${l}`] = deslocarFormula('=C2*E2', l - 2); cel[`G${l}`] = deslocarFormula('=SE(C2<D2;"Repor";"OK")', l - 2); }
cel.F10 = '=SOMA(F2:F9)';
cel.G10 = '=CONT.SE(G2:G9;"Repor")';
cel.F11 = '=SOMASE(B2:B9;"Limpeza";F2:F9)';
cel.A13 = 'Mouse USB';
cel.B13 = '=PROCV(A13;A2:E9;5;FALSO)';
const val = v(cel);
assert.ok(Math.abs(val.F10 - 3027.7) < 1e-9);
assert.equal(val.G10, 3);
assert.ok(Math.abs(val.F11 - 555.7) < 1e-9);
assert.equal(val.B13, 27.5);
cel = ordenarLinhas(cel, { de: 2, ate: 9, colunas: COLUNAS, chave: 'F', desc: true });
assert.equal(v(cel).A2, 'Papel A4 (resma)');
const r = verificar(cel, { grafico: { rotulos: 'A', valores: 'F' } });
assert.deepEqual(Object.entries(r).filter(([, ok]) => !ok), []);
console.log('planilha ok');

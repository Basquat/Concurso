import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseAula } from '../src/domain/aula.js';
import { parseBanco } from '../src/domain/banco.js';
import { markdown, inline } from '../src/domain/markdown.js';
import { agendar, vencidos } from '../src/domain/srs.js';
import { comporSimulado, apurarProva } from '../src/domain/simulado.js';
import { gerarPlano } from '../src/domain/plano.js';

// Markdown seguro: HTML do autor é escapado
assert.equal(inline('<b>x</b> **y**'), '&lt;b&gt;x&lt;/b&gt; <strong>y</strong>');
assert.match(inline('[ok](https://a.b) [js](javascript:alert(1))'), /href="https:\/\/a\.b"[^>]*>ok<\/a> \[js\]/);
assert.match(markdown('> [!dica] Título\n> texto'), /<blockquote class="dica"><span class="rot">Dica · Título<\/span><p>texto<\/p>/);
assert.match(markdown('- a\n  - b\n- c'), /<ul><li>a<ul><li>b<\/li><\/ul><\/li><li>c<\/li><\/ul>/);
assert.match(markdown('| a | b |\n|---|--:|\n| 1 | 2 |'), /<td style="text-align:right">2<\/td>/);

// Aula: capa + slides, seções, notas e cartões
const aula = parseAula('---\nid: x\ntitulo: T\narea: ti\ncargos: 1, 2\n---\n# A\ntexto\n::: notas\nnota\n:::\n---\n## Seção\n---\n::: cartoes\nf :: v\n:::\n');
assert.deepEqual(aula.meta.cargos, ['1', '2']);
assert.equal(aula.slides.length, 3);
assert.equal(aula.slides[1].notas, 'nota');
assert.equal(aula.slides[2].tipo, 'secao');
assert.deepEqual(aula.cartoes, [{ frente: 'f', verso: 'v' }]);

// Banco compacto
const { questoes, erros } = parseBanco('@area ti\n@disciplina Redes\n## r1 | OSI | facil\nPergunta?\nA) um\nB) dois *\n> porque\n@ ref\n## r2\nCerto?\n= E\n## r3\nsem gabarito\nA) a\nB) b\n');
assert.equal(questoes.length, 2);
assert.equal(questoes[0].correta, 1);
assert.equal(questoes[0].dificuldade, 'facil');
assert.equal(questoes[1].tipo, 'ce');
assert.equal(questoes[1].correta, 1);
assert.match(erros[0], /r3: sem alternativa correta/);

// Todo o conteúdo publicado é válido
for (const f of fs.readdirSync('data/questoes')) assert.deepEqual(parseBanco(fs.readFileSync(`data/questoes/${f}`, 'utf8'), f).erros, [], f);
for (const f of fs.readdirSync('data/aulas')) assert.ok(parseAula(fs.readFileSync(`data/aulas/${f}`, 'utf8')).slides.length > 1, f);

// SRS
let c = agendar(undefined, 2, '2026-10-16');
assert.equal(c.v, '2026-10-17');
c = agendar(c, 2, '2026-10-17');
assert.equal(c.i, 6);
c = agendar(c, 0, '2026-10-23');
assert.equal(c.i, 1);
assert.equal(c.l, 1);
assert.deepEqual(vencidos({ a: { v: '2026-10-16' }, b: { v: '2026-10-20' } }, '2026-10-16'), ['a']);

// Simulado ponderado e critério do edital
const qs = [...Array(10)].map((_, k) => ({ id: `p${k}`, area: k < 5 ? 'portugues' : 'ti', alternativas: ['a', 'b'], correta: 0 }));
const { itens, faltas } = comporSimulado(qs, [{ area: 'portugues', n: 3, valor: 1 }, { area: 'ti', n: 7, valor: 2 }]);
assert.equal(itens.length, 8);
assert.deepEqual(faltas, [{ area: 'ti', pedido: 7, obtido: 5 }]);
const resp = Object.fromEntries(itens.map((it) => [it.q.id, it.area === 'ti' ? 0 : 1]));
const r = apurarProva(itens, resp);
assert.equal(r.pontos, 10);
assert.equal(r.zerou, true);
assert.equal(r.aprovado, false, 'zerar uma área reprova');

// Plano de estudos
const plano = gerarPlano({ hoje: '2026-10-16', prova: '2026-10-30', minutos: [0, 60, 60, 60, 60, 60, 180], areas: [{ area: 'ti', nome: 'TI', peso: 60, dominio: 0 }, { area: 'portugues', nome: 'Português', peso: 12, dominio: 0.9 }], aulas: [{ id: 'a1', area: 'ti', titulo: 'A1', duracao: 30 }], redacao: true });
assert.equal(plano.dias.length, 14);
assert.ok(plano.dias.some((d) => d.blocos.some((b) => b.tipo === 'simulado')));
assert.ok(plano.dias.some((d) => d.blocos.some((b) => b.href === '#/aulas/a1')));
assert.equal(plano.pendentes, 0);
const minutosTi = plano.dias.flatMap((d) => d.blocos).filter((b) => b.area === 'ti').reduce((s, b) => s + b.min, 0);
const minutosPt = plano.dias.flatMap((d) => d.blocos).filter((b) => b.area === 'portugues').reduce((s, b) => s + b.min, 0);
assert.ok(minutosTi > minutosPt * 3, 'área de maior peso e menor domínio recebe mais tempo');

console.log('conteúdo: ok');

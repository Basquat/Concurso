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
const todasQuestoes = fs.readdirSync('data/questoes').flatMap((f) => parseBanco(fs.readFileSync(`data/questoes/${f}`, 'utf8'), f).questoes);
const questoesContabeis = todasQuestoes.filter((q) => q.area === 'contabil');
assert.ok(questoesContabeis.length >= 80, `Banco contábil esperado >= 80, recebeu ${questoesContabeis.length}`);
for (const [area, minimo] of [['saude', 10], ['educacao', 8], ['gestao', 4], ['portugues', 65], ['logica', 42], ['informatica', 43], ['adm-publica', 65], ['ti', 175]]) {
  assert.ok(todasQuestoes.filter((q) => q.area === area).length >= minimo, `Banco da área ${area} esperado >= ${minimo}`);
}
for (const id of ['contabil-fundamentos', 'contabil-publica', 'contabil-custos-financas', 'contabil-auditoria']) {
  const texto = fs.readFileSync(`data/aulas/${id}.md`, 'utf8');
  assert.equal(parseAula(texto).meta.area, 'contabil', `${id} precisa ser contexto contábil dedicado`);
  assert.ok(parseAula(texto).cartoes.length > 0, `${id} precisa de flashcards`);
}

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
import { tabela as tv, equivalentes as eqv } from '../src/domain/logica.js';
import { analisar as red } from '../src/adapters/ui/labs/redacao.js';
assert.equal(tv('p v ~p').tipo, 'tautologia');
assert.equal(tv('p ^ ~p').tipo, 'contradição');
assert.deepEqual(tv('p -> q').linhas.map((l) => l.r), [true, false, true, true]);
assert.ok(eqv('~(p v q)', '~p ^ ~q'));
assert.ok(!eqv('p -> q', 'q -> p'));
assert.equal(red('a\n\nb').paragrafos, 2);
console.log('lógica e redação: ok');
import { novoRepo, executar as g } from '../src/domain/git.js';
{
  const r = novoRepo();
  const x = (c) => g(r, c);
  assert.match(x('git status'), /not a git repository/);
  x('git init'); x('echo "a" > f.txt'); x('git add .'); assert.match(x('git commit -m "c1"'), /root-commit/);
  x('git switch -c feat'); x('echo "b" > f.txt'); x('git commit -am "c2"');
  x('git switch main'); assert.equal(r.arquivos['f.txt'], 'a');
  x('echo "c" > f.txt'); x('git commit -am "c3"');
  assert.match(x('git merge feat'), /CONFLICT/);
  x('echo "bc" > f.txt'); x('git add f.txt'); x('git commit -m "merge"');
  assert.equal(r.commits[r.branches.main].pais.length, 2);
  assert.match(x('git status'), /working tree clean/);
  x('git switch -c ff'); x('echo z > z'); x('git add .'); x('git commit -m z'); x('git switch main');
  assert.match(x('git merge ff'), /Fast-forward/);
  console.log('git: ok');
}
import { novoDocker, executar as dk } from '../src/domain/docker.js';
{
  const d = novoDocker();
  assert.match(dk(d, 'docker run hello-world'), /Hello from Docker/);
  dk(d, 'docker run -d -p 8080:80 --name web nginx');
  assert.match(dk(d, 'curl localhost:8080'), /nginx/);
  assert.match(dk(d, 'docker run -d -p 8080:80 nginx'), /already allocated/);
  dk(d, 'docker run -d --name db postgres:17');
  assert.match(dk(d, 'docker logs db'), /POSTGRES_PASSWORD/);
  assert.match(dk(d, 'docker rm web'), /container is running/);
  assert.match(dk(d, 'docker build -t api:1 .'), /naming to/);
  assert.match(dk(d, 'docker compose up -d'), /projeto-db-1  Started/);
  console.log('docker: ok');
}

// Escopo por cargo: cada conta só vê o conteúdo das disciplinas da prova do seu cargo
{
  const { escopoDoCargo, conteudoDoCargo } = await import('../src/application/escopo.js');
  const ti = { codigo: '206', programas: ['lp-d', 'rl-d', 'ap-d', 'ce-206'], objetiva: [{ disciplina: 'Língua Portuguesa' }, { disciplina: 'Raciocínio Lógico' }, { disciplina: 'Conhecimentos Específicos' }] };
  const adm = { codigo: '201', programas: ['lp-d', 'info-d', 'ap-d', 'ce-201'], objetiva: [{ disciplina: 'Língua Portuguesa' }, { disciplina: 'Noções de Informática' }, { disciplina: 'Conhecimentos Específicos' }] };
  const aulasIx = [{ id: 'lp', area: 'portugues', cargos: ['todos'] }, { id: 'rede', area: 'ti', cargos: ['206', '402'] }, { id: 'inf', area: 'informatica', cargos: ['todos'] }, { id: 'enf', area: 'saude', cargos: ['203'] }];
  const qs = [{ id: 'q1', area: 'portugues' }, { id: 'q2', area: 'ti', aula: 'rede' }, { id: 'q3', area: 'informatica' }, { id: 'q4', area: 'saude', aula: 'enf' }];
  const fonte = { indice: async () => ({ aulas: aulasIx }), questoes: async () => qs, aula: async (id) => id, concursos: async () => 'c' };
  const ver = async (cargo) => { const c = conteudoDoCargo(fonte, async () => cargo); return [(await c.indice()).aulas.map((a) => a.id), (await c.questoes()).map((q) => q.id)]; };
  assert.deepEqual(await ver(ti), [['lp', 'rede'], ['q1', 'q2']]);
  assert.deepEqual(await ver(adm), [['lp', 'inf'], ['q1', 'q3']]);
  assert.deepEqual(await ver(null), [[], []], 'sem cargo, nada liberado');
  await assert.rejects(conteudoDoCargo(fonte, async () => adm).aula('rede'), /fora do programa/);
  assert.equal(await conteudoDoCargo(fonte, async () => ti).aula('rede'), 'rede');
  assert.equal(await conteudoDoCargo(fonte, async () => null).concursos(), 'c');
  assert.equal(escopoDoCargo({ codigo: '410.1', programas: ['pratica-410.1'] }).areas.size, 0);
  console.log('escopo por cargo: ok');
}

// Provas fixas: estáveis e sem repetição entre provas quando o banco basta
{
  const { provaFixa } = await import('../src/domain/simulado.js');
  const qs = [...Array(20)].map((_, k) => ({ id: `t${k}`, area: 'ti' }));
  const ids = (k) => provaFixa(qs, [{ area: 'ti', n: 4 }], k).itens.map((i) => i.q.id);
  assert.deepEqual(ids(1), ids(1));
  assert.equal(new Set([0, 1, 2, 3, 4].flatMap(ids)).size, 20);
  console.log('provas fixas: ok');
}

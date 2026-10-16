import assert from 'node:assert/strict';
import * as B from '../src/domain/bi/model.js';
import { analisarJava, analisarPhp, formatar } from '../src/domain/code/analise.js';
import { EXERCICIOS } from '../src/domain/code/exercicios.js';
import { MODELOS } from '../src/domain/code/modelos.js';
import { zip, crc32 } from '../src/domain/zip.js';
import * as S from '../src/domain/saude/calculos.js';
import * as P from '../src/domain/educacao/plano.js';

// ---------- BI ----------
const bruto = B.dadosBrutos();
const s = { etapas: [], relacoes: [{ de: 'fVendas.id_produto', para: 'dProduto.id' }], medidas: [], visuais: [] };
const recalc = () => { s.modelo = B.montarModelo(bruto, s.etapas, s.relacoes); };
recalc();
const fat = B.compilarDefinicao('Faturamento = SUM(fVendas[valor])');
s.medidas.push(fat);
assert.throws(() => B.valorMedida(s.modelo, s.medidas, 'Faturamento'), /tipo Texto/);
s.etapas.push({ op: 'removerDuplicadas' }, { op: 'removerVazios', coluna: 'id_regiao' }, { op: 'tipoNumero', coluna: 'valor' });
recalc();
const m = (id) => B.MISSOES_BI.find((x) => x.id === id).check(s);
assert.ok(m('limpeza') && m('faturamento') && !m('relacao'));
s.medidas.push(B.compilarDefinicao('Ticket Médio = DIVIDE([Faturamento], COUNTROWS(fVendas))'));
assert.ok(m('ticket'));
// sem relacionamento o filtro de região não se propaga: todas as barras iguais
s.visuais.push({ tipo: 'barras', eixo: 'dRegiao[regiao]', medida: 'Faturamento' });
assert.ok(!m('visual'));
s.relacoes.push({ de: 'fVendas.id_regiao', para: 'dRegiao.id' });
recalc();
assert.ok(m('relacao') && m('visual'));
s.medidas.push(B.compilarDefinicao('Fat Sul = CALCULATE([Faturamento], dRegiao[regiao] = "Sul")'));
assert.ok(m('calculate'));
// CALCULATE substitui o filtro existente na mesma coluna
const norte = B.valorMedida(s.modelo, s.medidas, 'Fat Sul', { 'dRegiao[regiao]': ['Norte'] });
assert.equal(norte, B.valorMedida(s.modelo, s.medidas, 'Fat Sul'));
const col = B.compilarDefinicao('fVendas[categoria] = RELATED(dProduto[categoria])');
const mod2 = B.montarModelo(bruto, s.etapas, s.relacoes, [col]);
assert.ok(mod2.tabelas.fVendas.every((l) => typeof l.categoria === 'string'));
assert.throws(() => B.compilarDefinicao('X = SUM(fVendas[valor]'), /Falta/);

// ---------- análise estática ----------
const pj = analisarJava(`public class Programa {
    public static void main(String[] args) {
        System.out.println("Olá, concurso!")
    }
}
`, 'Main.java');
assert.ok(pj.some((x) => x.linha === 3 && x.msg === "';' expected"), JSON.stringify(pj));
assert.ok(pj.some((x) => /should be declared in a file named Programa\.java/.test(x.msg)));
const javaOk = 'public class Main {\n    public static void main(String[] args) {\n        String a = "x";\n        if (a.equals("x")) {\n            System.out.println("Olá, concurso!");\n        }\n    }\n}\n';
assert.deepEqual(analisarJava(javaOk).filter((x) => x.nivel !== 'info'), []);
assert.ok(analisarJava(javaOk.replace('a.equals("x")', 'a == "x"')).some((x) => x.nivel === 'aviso'));
assert.ok(analisarJava('public class Main {\n  void f() {\n').some((x) => x.msg === 'reached end of file while parsing'));
const pdo = `<?php
$pdo = new PDO('sqlite::memory:');
$cpf = $_GET['cpf'];
$stmt = $pdo->query("SELECT nome FROM candidatos WHERE cpf = '$cpf'");
`;
assert.ok(analisarPhp(pdo).some((x) => /SQL injection/.test(x.msg)));
assert.ok(analisarPhp('<?php\necho "a"\n').some((x) => x.linha === 2));
assert.equal(formatar('class A {\nvoid f() {\nx();\n}\n}', 'java'), 'class A {\n    void f() {\n        x();\n    }\n}');

// ---------- saúde e educação ----------
assert.equal(Math.round(S.gotasMin(500, 8)), 21);
assert.equal(S.microgotasMin(240, 4), 60);
assert.equal(S.doseMl(250, 500, 5), 2.5);
assert.ok(S.conferirCalculo({ tipo: 'gotas', resposta: 20.83 }, '21') && !S.conferirCalculo({ tipo: 'gotas', resposta: 20.83 }, '23'));
const plano = { tema: 'Frações', duracao: 50, objetivos: ['Identificar frações equivalentes', 'Resolver problemas com frações'], acessibilidade: 'Material concreto e ampliado para baixa visão.',
  atividades: [{ descricao: 'Sondagem', minutos: 10, objetivo: 0, avaliacao: 'diagnóstica' }, { descricao: 'Resolução em duplas', minutos: 40, objetivo: 1, avaliacao: 'formativa' }] };
assert.equal(P.avaliarPlano(plano).nota, 100);
assert.ok(P.avaliarPlano({ ...plano, objetivos: ['Entender frações'] }).nota < 100);
console.log('bi/codigo/saude/educacao ok');

// ---------- Code Studio: exercícios e modelos coerentes ----------
for (const e of EXERCICIOS) {
  const m = MODELOS.find((x) => x.id === e.modelo);
  assert.ok(m, `modelo ${e.modelo} de ${e.id}`);
  const arqs = e.arquivos ?? m.arquivos;
  assert.ok((e.entrada ?? m.entrada) in arqs, `entrada de ${e.id}`);
}
assert.equal(new Set(EXERCICIOS.map((e) => e.id)).size, EXERCICIOS.length);
for (const m of MODELOS) assert.ok(m.entrada in m.arquivos, m.id);
assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
const z = zip({ 'a.txt': 'oi' });
assert.equal(new DataView(z.buffer).getUint32(0, true), 0x04034b50);
console.log('code studio ok');

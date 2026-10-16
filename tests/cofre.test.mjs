import assert from 'node:assert/strict';
import { armazemMemoria } from '../src/adapters/storage/idb.js';
import { criarGerenciador, migrarV1, forcaSenha, normalizarCodigo, serializar, desserializar } from '../src/adapters/storage/cofre.js';

// Storage do navegador: métodos não enumeráveis, chaves como propriedades (Object.keys funciona como no real).
function storage() {
  const s = {};
  Object.defineProperties(s, {
    getItem: { value: (k) => (Object.hasOwn(s, k) ? s[k] : null) },
    setItem: { value: (k, v) => { s[k] = String(v); } },
    removeItem: { value: (k) => { delete s[k]; } },
  });
  return s;
}

const rejeita = async (p, re) => { await assert.rejects(p, (e) => { assert.match(e.message, re); return true; }); };

// força de senha
assert.equal(forcaSenha('12345678').ok, false);
assert.equal(forcaSenha('minhasenha').ok, false);
assert.equal(forcaSenha('Pedra-Azul-27').ok, true);
assert.equal(normalizarCodigo('abcd-efgh io'), 'ABCDEFGH10');
// serialização preserva bytes
const bytes = new Uint8Array([0, 1, 255]);
assert.deepEqual(desserializar(serializar({ db: bytes, n: [1] })).db, bytes);

let relogio = 1_000_000;
const armazem = armazemMemoria();
const aba = storage();
const local = storage();
const g = criarGerenciador({ armazem, aba, local, agora: () => relogio });

// criação, gravação cifrada e leitura
const { sessao, codigo } = await g.criar({ nome: 'Ana Lima', senha: 'Pedra-Azul-27' });
assert.match(codigo, /^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
sessao.gravar('progresso', { xp: 42, db: bytes });
await sessao.salvarAgora();
const bruto = await armazem.doDono(sessao.conta.id);
assert.equal(bruto.length, 1);
assert.ok(bruto[0].ct instanceof Uint8Array && !('valor' in bruto[0]), 'registro precisa estar cifrado');
assert.ok(!new TextDecoder().decode(bruto[0].ct).includes('xp'), 'texto claro não pode aparecer');
await rejeita(g.criar({ nome: 'ana lima', senha: 'Outra-Senha-9' }), /Já existe/);
await rejeita(g.criar({ nome: 'Bia', senha: '123' }), /Senha/);

// retomar na mesma aba sem senha
const ret = await g.retomar();
assert.equal(ret.ler('progresso').xp, 42);
assert.deepEqual(ret.ler('progresso').db, bytes);

// sair esquece a chave; senha errada conta tentativas e bloqueia
await g.sair(ret);
assert.equal(await g.retomar(), null);
const id = sessao.conta.id;
for (let i = 0; i < 4; i++) await rejeita(g.entrar(id, 'errada-123'), /Senha incorreta/);
await rejeita(g.entrar(id, 'errada-123'), /bloqueada/);
await rejeita(g.entrar(id, 'Pedra-Azul-27'), /Tente de novo/);
relogio += 31_000;
const { sessao: s2 } = await g.entrar(id, 'Pedra-Azul-27', { lembrar: true });
assert.equal(s2.ler('progresso').xp, 42);
assert.equal(s2.conta.acessos[0].como, 'senha');

// "manter conectado": nova aba (sessionStorage vazio) reabre pela chave lembrada
for (const k of Object.keys(aba)) aba.removeItem(k);
const s3 = await g.retomar();
assert.equal(s3?.conta.id, id);
relogio += 31 * 86_400_000;
for (const k of Object.keys(aba)) aba.removeItem(k);
assert.equal(await g.retomar(), null, 'chave lembrada expira em 30 dias');

// troca de senha e recuperação
await g.trocarSenha(s3, 'Pedra-Azul-27', 'Nova-Senha-55');
await rejeita(g.entrar(id, 'Pedra-Azul-27'), /incorreta/);
await rejeita(g.recuperar(id, 'AAAA-BBBB', 'Outra-Coisa-77'), /recuperação incorreto/);
const rec = await g.recuperar(id, codigo.toLowerCase(), 'Recuperada-88');
assert.notEqual(rec.codigo, codigo, 'código de recuperação é trocado após o uso');
assert.equal(rec.sessao.ler('progresso').xp, 42);
await rejeita(g.recuperar(id, codigo, 'Recuperada-99'), /recuperação incorreto/);

// backup cifrado: importa em outro aparelho e abre com a senha
rec.sessao.gravar('lab:sql', { consultas: 3 });
const backup = JSON.stringify(await g.exportar(rec.sessao));
assert.ok(!backup.includes('consultas'));
const outro = criarGerenciador({ armazem: armazemMemoria(), aba: storage(), local: storage(), agora: () => relogio });
const imp = await outro.importar(backup);
assert.equal(imp.tipo, 'conta');
const { sessao: noOutro } = await outro.entrar(id, 'Recuperada-88');
assert.equal(noOutro.ler('lab:sql').consultas, 3);

// visitante → conta
const vis = await g.visitante();
vis.gravar('progresso', { xp: 7 });
await vis.salvarAgora();
assert.equal(await g.temDadosVisitante(), true);
const { sessao: nova } = await g.criar({ nome: 'Caio', senha: 'Lua-Cheia-2026', levarVisitante: true });
assert.equal(nova.ler('progresso').xp, 7);
assert.equal(await g.temDadosVisitante(), false);

// migração da 1.0: visitante e conta antiga (hash PBKDF2) viram dados da 2.0
const ls = storage();
const sal = crypto.getRandomValues(new Uint8Array(16));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode('velha123'), 'PBKDF2', false, ['deriveBits']);
const hash = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: 600000 }, base, 256));
const b64 = (u) => Buffer.from(u).toString('base64');
ls.setItem('concurso-lab:contas', JSON.stringify([{ id: '11111111-2222-3333-4444-555555555555', nome: 'Antiga', sal: b64(sal), hash: b64(hash), criadaEm: '2026-10-01T00:00:00Z' }]));
ls.setItem('concurso-lab:u:11111111-2222-3333-4444-555555555555:progresso', JSON.stringify({ xp: 300 }));
ls.setItem('concurso-lab:progresso', JSON.stringify({ xp: 15 }));
ls.setItem('concurso-lab:tema', '"dark"');
const arm2 = armazemMemoria();
const mig = await migrarV1({ armazem: arm2, local: ls });
assert.equal(mig.contas, 1);
assert.equal(ls.getItem('concurso-lab:progresso'), null);
assert.equal(ls.getItem('concurso-lab:tema'), '"dark"', 'preferências de interface ficam');
const g2 = criarGerenciador({ armazem: arm2, aba: storage(), local: ls, agora: () => relogio });
assert.equal((await g2.visitante()).ler('progresso').xp, 15);
await rejeita(g2.entrar('11111111-2222-3333-4444-555555555555', 'errada'), /incorreta/);
const leg = await g2.entrar('11111111-2222-3333-4444-555555555555', 'velha123');
assert.equal(leg.migrada, true);
assert.ok(leg.codigo);
assert.equal(leg.sessao.ler('progresso').xp, 300);
assert.equal(ls.getItem('concurso-lab:u:11111111-2222-3333-4444-555555555555:progresso'), null, 'dados antigos em texto claro são apagados');
assert.equal((await migrarV1({ armazem: arm2, local: ls })).migrou, false, 'migra uma vez só');

console.log('cofre: ok');

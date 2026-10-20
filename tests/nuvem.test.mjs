// Contas na nuvem de ponta a ponta: o Worker real (nuvem/worker.js) sobre SQLite em memória no lugar do D1,
// e dois/três "aparelhos" (armazéns separados) falando com ele pelo cliente de produção.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { armazemMemoria } from '../src/adapters/storage/idb.js';
import { criarGerenciador } from '../src/adapters/storage/cofre.js';
import { criarNuvem } from '../src/adapters/storage/nuvem.js';
import worker from '../nuvem/worker.js';

function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../nuvem/schema.sql', import.meta.url), 'utf8'));
  const stmt = (sql) => {
    let args = [];
    const s = {
      bind(...a) { args = a; return s; },
      run: async () => { db.prepare(sql).run(...args); return { success: true }; },
      first: async () => db.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...args) }),
    };
    return s;
  };
  return {
    prepare: stmt,
    async batch(lista) {
      db.exec('BEGIN');
      try { for (const s of lista) await s.run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

const env = { DB: d1(), ORIGENS: '*' };
let offline = false;
const rede = async (url, init) => {
  if (offline) throw new TypeError('offline');
  return worker.fetch(new Request(url, init), env);
};
const nuvem = criarNuvem({ url: 'https://api.test', fetch: rede });

function storage() {
  const s = {};
  Object.defineProperties(s, {
    getItem: { value: (k) => (Object.hasOwn(s, k) ? s[k] : null) },
    setItem: { value: (k, v) => { s[k] = String(v); } },
    removeItem: { value: (k) => { delete s[k]; } },
  });
  return s;
}
const aparelho = () => criarGerenciador({ armazem: armazemMemoria(), aba: storage(), local: storage(), nuvem });
const rejeita = async (p, re) => { await assert.rejects(p, (e) => { assert.match(e.message, re); return true; }); };
const espera = async (cond) => { for (let i = 0; i < 100 && !(await cond()); i++) await new Promise((r) => setTimeout(r, 20)); assert.ok(await cond(), 'condição não atendida a tempo'); };

const SENHA = 'Pedra-Azul-27';
const A = aparelho();

// criar conta no aparelho A grava no servidor; os dados chegam cifrados
const { sessao: sa, codigo, avisoNuvem } = await A.criar({ nome: 'Ana Lima', senha: SENHA });
assert.equal(avisoNuvem, null);
assert.equal(sa.conta.nuvem, true);
sa.gravar('progresso', { xp: 42 });
await sa.salvarAgora();
await espera(async () => (await env.DB.prepare('SELECT COUNT(*) n FROM registros').first()).n === 1);
const linha = await env.DB.prepare('SELECT * FROM registros').first();
assert.ok(!linha.ct.includes('xp') && !atob(linha.ct).includes('xp'), 'servidor só pode ver texto cifrado');
const guardado = await env.DB.prepare('SELECT * FROM contas').first();
assert.ok(!JSON.stringify(guardado).includes(SENHA), 'a senha nunca vai ao servidor');

// nome já usado na nuvem (outro aparelho, sem cópia local)
await rejeita(aparelho().criar({ nome: 'ana lima', senha: 'Outra-Senha-91' }), /já está em uso/);

// aparelho B: login sem nenhuma cópia local
const B = aparelho();
await rejeita(B.entrarNuvem({ nome: 'Ana Lima', senha: 'Errada-123-x' }), /incorretos/);
await rejeita(B.entrarNuvem({ nome: 'Ninguém Aqui', senha: SENHA }), /incorretos/);
const { sessao: sb } = await B.entrarNuvem({ nome: 'ana lima', senha: SENHA, lembrar: true });
assert.equal(sb.conta.id, sa.conta.id);
assert.deepEqual(sb.ler('progresso'), { xp: 42 });
assert.equal((await B.listar()).length, 1);

// alteração em B chega a A
sb.gravar('progresso', { xp: 50 });
sb.gravar('lab:linux', { passo: 3 });
await sb.salvarAgora();
await espera(async () => (await env.DB.prepare('SELECT COUNT(*) n FROM registros').first()).n === 2);
const r = await sa.sincronizar();
assert.equal(r.baixados, 2);
assert.deepEqual(sa.ler('progresso'), { xp: 50 });
assert.deepEqual(sa.ler('lab:linux'), { passo: 3 });

// troca de senha em A: B passa a exigir a nova (mesmo tendo a cópia local antiga)
const NOVA = 'Lua-Vermelha-58';
await rejeita(A.trocarSenha(sa, 'Errada-123-x', NOVA), /incorreta/);
await A.trocarSenha(sa, SENHA, NOVA);
await rejeita(B.entrar(sb.conta.id, SENHA), /incorreta/);
const { sessao: sb2 } = await B.entrar(sb.conta.id, NOVA);
assert.deepEqual(sb2.ler('progresso'), { xp: 50 });
await rejeita(aparelho().entrarNuvem({ nome: 'Ana Lima', senha: SENHA }), /incorretos/);

// renomear em A muda o login na nuvem
await A.atualizarPerfil(sa, { nome: 'Ana Souza' });
const C = aparelho();
await C.entrarNuvem({ nome: 'Ana Souza', senha: NOVA });
await rejeita(C.entrarNuvem({ nome: 'Ana Lima', senha: NOVA }), /incorretos/);

// recuperação com o código: nova senha vale em qualquer aparelho
const REC = 'Rio-Seco-Forte-33';
const rec = await A.recuperar(sa.conta.id, codigo, REC);
assert.notEqual(rec.codigo, codigo);
const { sessao: sd } = await aparelho().entrarNuvem({ nome: 'Ana Souza', senha: REC });
assert.deepEqual(sd.ler('progresso'), { xp: 50 });
await rejeita(aparelho().entrarNuvem({ nome: 'Ana Souza', senha: NOVA }), /incorretos/);
await rejeita(A.recuperar(sa.conta.id, codigo, 'Qualquer-Coisa-9'), /incorreto/);

// bloqueio no servidor após 5 senhas erradas
await env.DB.prepare('UPDATE contas SET falhas = 0, bloqueada_ate = 0').run();
const E = aparelho();
for (let i = 0; i < 5; i++) await rejeita(E.entrarNuvem({ nome: 'Ana Souza', senha: 'Errada-123-x' }), /incorretos/);
await rejeita(E.entrarNuvem({ nome: 'Ana Souza', senha: REC }), /Muitas tentativas/);
await env.DB.prepare('UPDATE contas SET falhas = 0, bloqueada_ate = 0').run();

// sem internet: login local continua, escrita fica local e sobe depois
const { sessao: sl } = await A.entrar(sa.conta.id, REC);
offline = true;
sl.gravar('progresso', { xp: 99 });
await sl.salvarAgora();
await new Promise((ok) => setTimeout(ok, 50));
assert.match(sl.nuvem.erro, /Sem conexão/);
await rejeita(sl.sincronizar(), /Sem conexão/);
const { sessao: so } = await A.entrar(sa.conta.id, REC);
assert.deepEqual(so.ler('progresso'), { xp: 99 });
offline = false;
await sl.sincronizar();
await espera(async () => !sl.nuvem.erro);
const { sessao: sf } = await aparelho().entrarNuvem({ nome: 'Ana Souza', senha: REC });
assert.deepEqual(sf.ler('progresso'), { xp: 99 });

// criar sem internet fica só local e avisa
offline = true;
const L = aparelho();
const local = await L.criar({ nome: 'Bruno', senha: SENHA });
assert.match(local.avisoNuvem, /Sem conexão/);
offline = false;
const ativ = await L.ativarNuvem(local.sessao, SENHA);
assert.match(ativ.codigo, /^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
await aparelho().entrarNuvem({ nome: 'Bruno', senha: SENHA });

// excluir apaga também na nuvem
await rejeita(A.excluir(sa.conta.id, 'Errada-123-x'), /incorreta/);
await A.excluir(sa.conta.id, REC);
await rejeita(aparelho().entrarNuvem({ nome: 'Ana Souza', senha: REC }), /incorretos/);
assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM registros WHERE conta = ?').bind(sa.conta.id).first()).n, 0);

// CORS: origem não autorizada é recusada
const restrito = { ...env, ORIGENS: 'https://basquat.github.io' };
const ruim = await worker.fetch(new Request('https://api.test/salts', { method: 'POST', headers: { origin: 'https://evil.example' }, body: '{}' }), restrito);
assert.equal(ruim.status, 403);
const bom = await worker.fetch(new Request('https://api.test/', { headers: { origin: 'https://basquat.github.io' } }), restrito);
assert.equal(bom.headers.get('access-control-allow-origin'), 'https://basquat.github.io');

console.log('nuvem: ok');

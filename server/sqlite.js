// Banco SQLite (node:sqlite) com a interface D1 usada pelo servidor — testes e `npm run dev`.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function bancoSqlite(arquivo = ':memory:') {
  const db = new DatabaseSync(arquivo);
  db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
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

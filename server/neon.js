// Postgres (Neon, driver HTTP) com a interface D1 usada pelo servidor. Placeholders `?` viram `$1..$n`
// (as consultas do servidor não têm `?` dentro de literais). `batch` roda numa transação.
import { neon } from '@neondatabase/serverless';

const numerar = (texto) => { let n = 0; return texto.replace(/\?/g, () => `$${++n}`); };

export function bancoNeon(url) {
  const q = neon(url);
  const stmt = (texto) => {
    let args = [];
    const s = {
      bind(...a) { args = a; return s; },
      consulta: () => q.query(numerar(texto), args),
      run: async () => { await s.consulta(); return { success: true }; },
      first: async () => (await s.consulta())[0] ?? null,
      all: async () => ({ results: await s.consulta() }),
    };
    return s;
  };
  return {
    prepare: stmt,
    batch: (lista) => q.transaction(lista.map((s) => s.consulta())),
  };
}

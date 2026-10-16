// IndexedDB mínimo com três lojas: contas (metadados e chaves embrulhadas), registros (dados de cada conta,
// cifrados) e sessoes (chave não extraível de quem marcou "manter conectado"). Sem dependências.
const NOME = 'concurso-lab';
const VERSAO = 1;
let banco;

function abrir() {
  return (banco ??= new Promise((ok, falha) => {
    const req = indexedDB.open(NOME, VERSAO);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('contas', { keyPath: 'id' });
      d.createObjectStore('registros', { keyPath: ['dono', 'chave'] }).createIndex('dono', 'dono');
      d.createObjectStore('sessoes', { keyPath: 'id' });
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => { banco = null; falha(req.error); };
    req.onblocked = () => falha(new Error('Feche as outras abas do Concurso Lab para atualizar o banco local.'));
  }));
}

async function tx(loja, modo, fn) {
  const d = await abrir();
  return new Promise((ok, falha) => {
    const t = d.transaction(loja, modo);
    const req = fn(t.objectStore(loja));
    t.oncomplete = () => ok(req?.result);
    t.onerror = () => falha(t.error);
    t.onabort = () => falha(t.error ?? new Error('Transação cancelada (cota de armazenamento cheia?).'));
  });
}

/** Armazém persistente do navegador. */
export const armazemIdb = () => ({
  obter: (loja, chave) => tx(loja, 'readonly', (s) => s.get(chave)),
  todos: (loja) => tx(loja, 'readonly', (s) => s.getAll()),
  doDono: (dono) => tx('registros', 'readonly', (s) => s.index('dono').getAll(dono)),
  gravar: (loja, valor) => tx(loja, 'readwrite', (s) => s.put(valor)),
  gravarVarios: (loja, valores) => tx(loja, 'readwrite', (s) => { valores.forEach((v) => s.put(v)); }),
  apagar: (loja, chave) => tx(loja, 'readwrite', (s) => s.delete(chave)),
  apagarDoDono: (dono) => tx('registros', 'readwrite', (s) => {
    const cur = s.index('dono').openKeyCursor(IDBKeyRange.only(dono));
    cur.onsuccess = () => { const c = cur.result; if (c) { s.delete(c.primaryKey); c.continue(); } };
  }),
});

/** Mesmo contrato em memória: testes e navegadores sem IndexedDB (os dados somem ao fechar a aba). */
export function armazemMemoria() {
  const lojas = { contas: new Map(), registros: new Map(), sessoes: new Map() };
  const id = (loja, v) => (loja === 'registros' ? `${v.dono}\u0000${v.chave}` : v.id);
  const idChave = (loja, k) => (loja === 'registros' ? `${k[0]}\u0000${k[1]}` : k);
  return {
    obter: async (loja, k) => lojas[loja].get(idChave(loja, k)),
    todos: async (loja) => [...lojas[loja].values()],
    doDono: async (dono) => [...lojas.registros.values()].filter((r) => r.dono === dono),
    gravar: async (loja, v) => { lojas[loja].set(id(loja, v), v); },
    gravarVarios: async (loja, vs) => { vs.forEach((v) => lojas[loja].set(id(loja, v), v)); },
    apagar: async (loja, k) => { lojas[loja].delete(idChave(loja, k)); },
    apagarDoDono: async (dono) => { for (const [k, r] of lojas.registros) if (r.dono === dono) lojas.registros.delete(k); },
  };
}

export async function armazemPadrao() {
  try {
    await abrir();
    return { armazem: armazemIdb(), persistente: true };
  } catch {
    return { armazem: armazemMemoria(), persistente: false };
  }
}

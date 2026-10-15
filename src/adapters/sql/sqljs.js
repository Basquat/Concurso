// Adaptador SQL: SQLite compilado para WebAssembly (sql.js), carregado sob demanda do cdnjs.
// O banco vive na memória da aba; nada é enviado a servidor algum.
const VERSAO = '1.10.3';
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${VERSAO}/`;
let carregando;

function carregarBiblioteca() {
  return (carregando ??= new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = `${BASE}sql-wasm.js`;
    s.onload = () => globalThis.initSqlJs({ locateFile: (f) => BASE + f }).then(ok, falha);
    s.onerror = () => { carregando = null; falha(new Error('Não foi possível baixar o SQLite (sem internet?).')); };
    document.head.append(s);
  }));
}

/** @returns {import('../../application/ports.js').MotorSql} */
export const motorSqlJs = () => ({
  async abrir(dados) {
    const SQL = await carregarBiblioteca();
    const db = new SQL.Database(dados);
    const pragmas = () => db.exec('PRAGMA foreign_keys = ON;');
    pragmas();
    return {
      executar(sql) {
        const resultados = db.exec(sql).map((r) => ({ colunas: r.columns, linhas: r.values }));
        return { resultados, alteradas: db.getRowsModified() };
      },
      exportar() { const b = db.export(); pragmas(); return b; }, // export() reabre o banco e zera PRAGMAs
      fechar: () => db.close(),
    };
  },
});

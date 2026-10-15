// Portas da arquitetura hexagonal. O domínio (src/domain) não conhece navegador, rede nem
// armazenamento; a aplicação conversa com o mundo por estes contratos, implementados em src/adapters.
// Trocar localStorage por um backend, ou SQLite por outro motor, é escrever um novo adaptador.

/**
 * Persistência do progresso do estudante.
 * @typedef {object} RepositorioProgresso
 * @property {() => object|null} carregar
 * @property {(progresso: object) => void} salvar
 */

/**
 * Estado de cada laboratório (sistema de arquivos simulado, planilha, lançamentos...).
 * @typedef {object} RepositorioLab
 * @property {(lab: string) => any} carregar
 * @property {(lab: string, estado: any) => void} salvar
 * @property {(lab: string) => void} limpar
 */

/**
 * Conteúdo estático: concursos, trilhas e questões.
 * @typedef {object} FonteConteudo
 * @property {() => Promise<object>} concursos
 * @property {() => Promise<object[]>} trilhas
 * @property {() => Promise<object[]>} questoes
 */

/**
 * Banco SQL didático executado localmente.
 * @typedef {object} MotorSql
 * @property {(dadosIniciais?: Uint8Array) => Promise<object>} abrir  devolve { executar(sql), exportar(), fechar() }
 */

/**
 * Execução isolada de código do estudante.
 * @typedef {object} ExecutorCodigo
 * @property {(codigo: string, extra?: object) => Promise<{saida: string, erro?: string, testes?: object[]}>} executar
 */

export {};

// Adaptadores de persistência no navegador (localStorage). Os dados ficam só neste dispositivo;
// use Exportar/Importar progresso para levar a outro navegador.
const PREFIXO = 'concurso-lab:';

function ler(chave) {
  try { return JSON.parse(localStorage.getItem(PREFIXO + chave) ?? 'null'); } catch { return null; }
}
function gravar(chave, valor) {
  try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); } catch { /* modo privado ou cota cheia: segue sem persistir */ }
}

// Conta local ativa: cada perfil tem seu próprio espaço (progresso e laboratórios separados).
const perfil = () => { try { return sessionStorage.getItem(PREFIXO + 'sessao') || localStorage.getItem(PREFIXO + 'lembrar') || ''; } catch { return ''; } };
const ns = (k) => (perfil() ? `u:${perfil()}:${k}` : k);

/** @returns {import('../../application/ports.js').RepositorioProgresso} */
export const repositorioProgresso = () => ({ carregar: () => ler(ns('progresso')), salvar: (p) => gravar(ns('progresso'), p) });

/** @returns {import('../../application/ports.js').RepositorioLab} */
export const repositorioLab = () => ({
  carregar: (lab) => ler(ns(`lab:${lab}`)),
  salvar: (lab, estado) => gravar(ns(`lab:${lab}`), estado),
  limpar: (lab) => { try { localStorage.removeItem(PREFIXO + ns(`lab:${lab}`)); } catch { /* ignora */ } },
});

export const preferencias = { ler, gravar };
export { perfil, PREFIXO };

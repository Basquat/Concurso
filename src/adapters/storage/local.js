// Adaptadores de persistência no navegador (localStorage). Os dados ficam só neste dispositivo;
// use Exportar/Importar progresso para levar a outro navegador.
const PREFIXO = 'concurso-lab:';

function ler(chave) {
  try { return JSON.parse(localStorage.getItem(PREFIXO + chave) ?? 'null'); } catch { return null; }
}
function gravar(chave, valor) {
  try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); } catch { /* modo privado ou cota cheia: segue sem persistir */ }
}

/** @returns {import('../../application/ports.js').RepositorioProgresso} */
export const repositorioProgresso = () => ({ carregar: () => ler('progresso'), salvar: (p) => gravar('progresso', p) });

/** @returns {import('../../application/ports.js').RepositorioLab} */
export const repositorioLab = () => ({
  carregar: (lab) => ler(`lab:${lab}`),
  salvar: (lab, estado) => gravar(`lab:${lab}`, estado),
  limpar: (lab) => { try { localStorage.removeItem(`${PREFIXO}lab:${lab}`); } catch { /* ignora */ } },
});

export const preferencias = { ler, gravar };

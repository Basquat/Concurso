// O acervo completo é acessível sem cargo; ao selecionar um cargo, a opção "Meu edital" restringe o conteúdo.
import { provaPorArea } from '../domain/areas.js';

export function escopoDoCargo(cargo, { todos = false, catalogo = false } = {}) {
  const areas = new Set(provaPorArea(cargo).map((d) => d.area));
  const cod = cargo?.codigo;
  const aula = (a) => todos || (!!cargo && areas.has(a.area) && (!a.cargos?.length || a.cargos.includes('todos') || a.cargos.includes(cod)));
  const areaQuestao = (q) => q.area === 'direito' ? 'adm-publica' : q.area;
  const questaoNoCargo = (q, aulasLiberadas) => !!cargo && areas.has(areaQuestao(q)) && (!q.aula || aulasLiberadas.has(q.aula));
  return {
    areas,
    aula,
    questao: (q, aulasLiberadas) => todos || questaoNoCargo(q, aulasLiberadas),
    questaoCatalogo: (q) => {
      if (!catalogo) return false;
      const aulaId = q.aula === 'educacao-avaliacao' ? 'educacao-avaliacao' : q.aula;
      return areas.has(areaQuestao(q)) && (!q.aula || !aulasLiberadas.has(aulaId));
    },
  };
}

// Envolve a fonte de conteúdo: indice/questoes/aula passam pelo escopo do cargo atual; o resto (concursos) passa direto.
export function conteudoDoCargo(fonte, cargoAtual, modoAtual = () => 'todos') {
  const liberado = async () => {
    const [cargo, modo, ix] = await Promise.all([cargoAtual(), modoAtual(), fonte.indice()]);
    const e = escopoDoCargo(cargo, { todos: modo !== 'cargo' });
    const aulas = ix.aulas.filter(e.aula);
    return { e, ix, aulas, ids: new Set(aulas.map((a) => a.id)) };
  };
  return {
    ...fonte,
    indice: async () => { const { ix, aulas } = await liberado(); return { ...ix, aulas }; },
    questoes: async () => {
      const [{ e, ids }, qs] = await Promise.all([liberado(), fonte.questoes()]);
      return qs.filter((q) => e.questao(q, ids));
    },
    aula: async (id) => {
      const { ids } = await liberado();
      if (!ids.has(id)) throw new Error('Aula fora do programa do cargo selecionado. Mude para "Todas as áreas" ou confira o edital.');
      return fonte.aula(id);
    },
  };
}

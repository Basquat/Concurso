// Conteúdo de estudo liberado por cargo: cada conta só vê aulas, questões e flashcards das disciplinas da prova
// objetiva do seu cargo-alvo. Sem cargo definido, nada é liberado.
import { provaPorArea } from '../domain/areas.js';

export function escopoDoCargo(cargo) {
  const areas = new Set(provaPorArea(cargo).map((d) => d.area));
  const cod = cargo?.codigo;
  // ponytail: questões sem "aula" ficam liberadas pela área inteira (ex.: saúde serve enfermagem e medicina);
  // marque @aula ou crie cargos por questão se a área precisar ser separada.
  const aula = (a) => areas.has(a.area) && (!a.cargos?.length || a.cargos.includes('todos') || a.cargos.includes(cod));
  return { areas, aula, questao: (q, aulasLiberadas) => areas.has(q.area) && (!q.aula || aulasLiberadas.has(q.aula)) };
}

// Envolve a fonte de conteúdo: indice/questoes/aula passam pelo escopo do cargo atual; o resto (concursos) passa direto.
export function conteudoDoCargo(fonte, cargoAtual) {
  const liberado = async () => {
    const [cargo, ix] = await Promise.all([cargoAtual(), fonte.indice()]);
    const e = escopoDoCargo(cargo);
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
      if (!ids.has(id)) throw new Error('Aula fora do programa do seu cargo.');
      return fonte.aula(id);
    },
  };
}

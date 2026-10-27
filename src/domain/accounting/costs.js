// Análise custo-volume-lucro. Valores monetários são inteiros em centavos.
export function analisarCustos({ preco, custosVariaveis = 0, despesasVariaveis = 0, custosFixos = 0, despesasFixas = 0 }) {
  const valores = [preco, custosVariaveis, despesasVariaveis, custosFixos, despesasFixas];
  if (!valores.every(Number.isSafeInteger) || valores.some((v) => v < 0) || preco === 0) {
    throw new RangeError('Informe valores monetários não negativos em centavos e um preço positivo.');
  }

  const gastosVariaveis = custosVariaveis + despesasVariaveis;
  const gastosFixos = custosFixos + despesasFixas;
  if (!Number.isSafeInteger(gastosVariaveis) || !Number.isSafeInteger(gastosFixos)) throw new RangeError('A soma dos gastos ultrapassa o limite monetário seguro.');
  const margemUnit = preco - gastosVariaveis;
  const indiceMargem = margemUnit / preco;
  const viavel = margemUnit > 0;
  const unidadesEquilibrio = viavel ? Math.ceil(gastosFixos / margemUnit) : null;

  return {
    preco,
    gastosVariaveis,
    gastosFixos,
    margemUnit,
    indiceMargem,
    viavel,
    unidadesEquilibrio,
    receitaEquilibrio: viavel ? unidadesEquilibrio * preco : null,
    unidadesParaLucro: (lucroAlvo = 0) => {
      if (!Number.isSafeInteger(lucroAlvo) || lucroAlvo < 0) throw new RangeError('Informe um lucro-alvo inteiro e não negativo em centavos.');
      if (!viavel) return null;
      if (!Number.isSafeInteger(gastosFixos + lucroAlvo)) throw new RangeError('A meta ultrapassa o limite monetário seguro.');
      return Math.ceil((gastosFixos + lucroAlvo) / margemUnit);
    },
    lucroEm: (unidades) => {
      if (!Number.isSafeInteger(unidades) || unidades < 0) throw new RangeError('Informe unidades inteiras não negativas.');
      return unidades * margemUnit - gastosFixos;
    },
    margemSeguranca: (unidades) => {
      if (!Number.isSafeInteger(unidades) || unidades < 0) throw new RangeError('Informe unidades inteiras não negativas.');
      return viavel ? unidades - unidadesEquilibrio : null;
    },
    grauAlavancagemOperacional: (unidades) => {
      if (!Number.isSafeInteger(unidades) || unidades < 0) throw new RangeError('Informe unidades inteiras não negativas.');
      const lucro = unidades * margemUnit - gastosFixos;
      return lucro > 0 ? (unidades * margemUnit) / lucro : null;
    },
    alavancagem: viavel && unidadesEquilibrio > 0 && margemUnit < preco ? 'custos e despesas fixos amplificam a variação percentual do resultado após o ponto de equilíbrio' : 'sem margem positiva ou sem gastos fixos relevantes para interpretar alavancagem',
  };
}

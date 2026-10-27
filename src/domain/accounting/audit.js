// Ferramentas didáticas de auditoria. Valores monetários em centavos.
export function calcularMaterialidade({ valorReferencia, percentual, percentualExecucao = 75 }) {
  if (!Number.isSafeInteger(valorReferencia) || valorReferencia <= 0) {
    throw new RangeError('A base de referência deve ser um valor positivo em centavos.');
  }
  if (!Number.isFinite(percentual) || percentual <= 0 || percentual > 100) {
    throw new RangeError('O percentual de materialidade deve estar entre 0 e 100.');
  }
  if (!Number.isFinite(percentualExecucao) || percentualExecucao <= 0 || percentualExecucao > 100) {
    throw new RangeError('O percentual de execução deve estar entre 0 e 100.');
  }
  if (!Number.isSafeInteger(Math.round(valorReferencia * percentual / 100))) {
    throw new RangeError('O cálculo ultrapassa o limite monetário seguro.');
  }
  const materialidade = Math.round(valorReferencia * percentual / 100);
  const materialidadeExecucao = Math.round(materialidade * percentualExecucao / 100);
  if (!Number.isSafeInteger(materialidade) || !Number.isSafeInteger(materialidadeExecucao)) {
    throw new RangeError('O cálculo ultrapassa o limite monetário seguro.');
  }
  return { valorReferencia, percentual, percentualExecucao, materialidade, materialidadeExecucao };
}

export function classificarOpiniao({ causa = 'nenhuma', material = false, generalizada = false } = {}) {
  if (!['nenhuma', 'distorcao', 'limitacao'].includes(causa)) throw new RangeError('Causa deve ser nenhuma, distorcao ou limitacao.');
  if (causa === 'nenhuma' || !material) return 'nao-modificada';
  if (causa === 'distorcao') return generalizada ? 'adversa' : 'com-ressalva';
  return generalizada ? 'abstencao' : 'com-ressalva';
}

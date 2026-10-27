// Regras didáticas de execução da despesa pública (Lei nº 4.320/1964).
export const ESTAGIOS_DESPESA = [
  { id: 'empenho', nome: 'Empenho', detalhe: 'Reserva a dotação e formaliza a obrigação do Estado.' },
  { id: 'liquidacao', nome: 'Liquidação', detalhe: 'Verifica o direito do credor e a entrega do bem ou serviço.' },
  { id: 'pagamento', nome: 'Pagamento', detalhe: 'Quita a obrigação após a regular liquidação.' },
];

export function estagioDespesaValido(estagios) {
  return Array.isArray(estagios) && estagios.every((id, i) => id === ESTAGIOS_DESPESA[i]?.id) && estagios.length <= ESTAGIOS_DESPESA.length;
}

export function classificarRestosPagar({ empenhada = false, liquidada = false, paga = false } = {}) {
  if (!empenhada || paga) return null;
  return liquidada ? 'processado' : 'nao-processado';
}

export const ESTAGIOS_RECEITA = [
  { id: 'previsao', nome: 'Previsão', detalhe: 'Estima a arrecadação na proposta e na lei orçamentária.' },
  { id: 'lancamento', nome: 'Lançamento', detalhe: 'Constitui o crédito quando a natureza da receita exigir essa etapa.' },
  { id: 'arrecadacao', nome: 'Arrecadação', detalhe: 'O contribuinte ou devedor paga ao agente arrecadador.' },
  { id: 'recolhimento', nome: 'Recolhimento', detalhe: 'O agente transfere o produto arrecadado à conta do Tesouro.' },
];

export function estagioReceitaValido(estagios) {
  return Array.isArray(estagios) && estagios.every((id, i) => id === ESTAGIOS_RECEITA[i]?.id) && estagios.length <= ESTAGIOS_RECEITA.length;
}

export function classificarCreditoAdicional(tipo) {
  return ({
    suplementar: 'Reforça dotação orçamentária já existente.',
    especial: 'Autoriza despesa sem dotação orçamentária específica.',
    extraordinario: 'Atende despesa urgente e imprevisível, nos termos constitucionais e legais.',
  })[tipo] ?? null;
}

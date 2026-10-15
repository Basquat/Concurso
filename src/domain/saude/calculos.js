// Cálculos de enfermagem para exercício teórico. Convenções usuais no ensino brasileiro:
// 1 mL = 20 gotas (macrogotas) = 60 microgotas.
//   gotas/min      = V(mL) / (T(h) × 3)
//   microgotas/min = V(mL) / T(h)
//   dose (mL)      = dose prescrita (mg) × volume da apresentação (mL) / quantidade na apresentação (mg)
// Material educacional: não substitui protocolo institucional, prescrição nem conferência dupla.

export const gotasMin = (volumeMl, horas) => volumeMl / (horas * 3);
export const microgotasMin = (volumeMl, horas) => volumeMl / horas;
export const doseMl = (prescritoMg, apresentMg, apresentMl) => (prescritoMg * apresentMl) / apresentMg;

const escolha = (rng, lista) => lista[Math.floor(rng() * lista.length)];

export function gerarCalculo(tipo, rng = Math.random) {
  if (tipo === 'gotas') {
    const v = escolha(rng, [250, 500, 1000, 1500]);
    const h = escolha(rng, [4, 6, 8, 12, 24]);
    return { tipo, enunciado: `Prescrição: ${v} mL de soro fisiológico 0,9% em ${h} horas. Quantas gotas por minuto (equipo macrogotas)?`, resposta: gotasMin(v, h), unidade: 'gotas/min' };
  }
  if (tipo === 'microgotas') {
    const v = escolha(rng, [100, 120, 240, 250, 500]);
    const h = escolha(rng, [2, 4, 6, 8, 12]);
    return { tipo, enunciado: `Prescrição: ${v} mL de soro glicosado 5% em ${h} horas, em equipo de microgotas. Quantas microgotas por minuto?`, resposta: microgotasMin(v, h), unidade: 'microgotas/min' };
  }
  const [mg, ml] = escolha(rng, [[500, 5], [250, 5], [1000, 10], [80, 2], [40, 1]]);
  const fator = escolha(rng, [0.25, 0.5, 0.75, 1.5, 2]);
  const prescrito = mg * fator;
  return { tipo, enunciado: `Prescrição: ${prescrito} mg. Disponível: ampola com ${mg} mg em ${ml} mL. Quantos mL aspirar?`, resposta: doseMl(prescrito, mg, ml), unidade: 'mL' };
}

// Gotejamento arredonda para inteiro (não existe fração de gota); dose aceita 0,1 mL de tolerância.
export function conferirCalculo(ex, valor) {
  const n = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(n)) return false;
  return ex.tipo === 'dose' ? Math.abs(n - ex.resposta) <= 0.1 : Math.abs(n - Math.round(ex.resposta)) <= 1 && Math.abs(n - ex.resposta) < 1;
}

export const MISSOES_SAUDE = [
  { id: 'gotas', titulo: 'Gotejamento (macrogotas)', xp: 25, descricao: 'Acerte 3 cálculos de gotas por minuto.', check: (s) => (s.acertos?.gotas ?? 0) >= 3 },
  { id: 'microgotas', titulo: 'Microgotas', xp: 25, descricao: 'Acerte 3 cálculos de microgotas por minuto.', check: (s) => (s.acertos?.microgotas ?? 0) >= 3 },
  { id: 'dose', titulo: 'Dose por regra de três', xp: 30, descricao: 'Acerte 3 cálculos de volume a aspirar.', check: (s) => (s.acertos?.dose ?? 0) >= 3 },
];

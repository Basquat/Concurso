// Planilha de controle de estoque do almoxarifado (dados fictícios) e missões verificáveis.
import { avaliarPlanilha } from './formula.js';

export const COLUNAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const LINHAS = 15;

const ITENS = [
  ['Papel A4 (resma)', 'Expediente', 40, 50, '24,90'],
  ['Caneta azul (cx)', 'Expediente', 15, 10, '18,50'],
  ['Toner impressora', 'Informática', 3, 5, '189,00'],
  ['Detergente (L)', 'Limpeza', 22, 20, '4,75'],
  ['Álcool 70% (L)', 'Limpeza', 8, 15, '9,90'],
  ['Pasta suspensa (cx)', 'Expediente', 12, 6, '32,00'],
  ['Mouse USB', 'Informática', 9, 4, '27,50'],
  ['Saco de lixo (pct)', 'Limpeza', 30, 25, '12,40'],
];

export function planilhaInicial() {
  const c = { A1: 'Item', B1: 'Categoria', C1: 'Estoque', D1: 'Mínimo', E1: 'Custo unit. (R$)', F1: 'Valor total (R$)', G1: 'Situação', A10: 'TOTAL', A11: 'Total Limpeza', A13: '', A12: 'Consulta de custo:' };
  ITENS.forEach((it, i) => it.forEach((v, j) => { c[`${COLUNAS[j]}${i + 2}`] = String(v); }));
  return c;
}

const PRIMEIRA = 2;
const ULTIMA = 9;
const perto = (a, b) => typeof a === 'number' && Math.abs(a - b) < 0.005;
const formula = (cel, r) => String(cel[r] ?? '').startsWith('=');

function cadaLinha(fn) {
  for (let l = PRIMEIRA; l <= ULTIMA; l++) if (!fn(l)) return false;
  return true;
}

export const MISSOES_PLANILHA = [
  {
    id: 'valor-total', titulo: 'Valor total por item', xp: 25,
    descricao: 'Em F2:F9, calcule Estoque × Custo unitário com fórmula (escreva em F2 e use "Preencher para baixo").',
    dica: 'Em F2: =C2*E2. Selecione F2 e clique em "Preencher ↓ até a linha 9".',
    check: (cel, v) => cadaLinha((l) => formula(cel, `F${l}`) && perto(v[`F${l}`], v[`C${l}`] * v[`E${l}`])),
  },
  {
    id: 'total-geral', titulo: 'Total geral', xp: 20,
    descricao: 'Em F10, some todos os valores totais.',
    dica: '=SOMA(F2:F9)  — também funciona =SUM(F2:F9)',
    check: (cel, v) => {
      let s = 0;
      for (let l = PRIMEIRA; l <= ULTIMA; l++) s += typeof v[`F${l}`] === 'number' ? v[`F${l}`] : NaN;
      return formula(cel, 'F10') && perto(v.F10, s);
    },
  },
  {
    id: 'situacao', titulo: 'Alerta de reposição', xp: 30,
    descricao: 'Em G2:G9, mostre "Repor" quando o estoque estiver abaixo do mínimo e "OK" caso contrário.',
    dica: '=SE(C2<D2;"Repor";"OK")',
    check: (cel, v) => cadaLinha((l) => formula(cel, `G${l}`) && v[`G${l}`] === (v[`C${l}`] < v[`D${l}`] ? 'Repor' : 'OK')),
  },
  {
    id: 'conta-repor', titulo: 'Quantos repor?', xp: 25,
    descricao: 'Em G10, conte quantos itens estão com situação "Repor".',
    dica: '=CONT.SE(G2:G9;"Repor")',
    check: (cel, v) => {
      let n = 0;
      for (let l = PRIMEIRA; l <= ULTIMA; l++) if (v[`C${l}`] < v[`D${l}`]) n++;
      return formula(cel, 'G10') && v.G10 === n;
    },
  },
  {
    id: 'somase', titulo: 'Total por categoria', xp: 30,
    descricao: 'Em F11, some o valor total somente dos itens da categoria Limpeza.',
    dica: '=SOMASE(B2:B9;"Limpeza";F2:F9)',
    check: (cel, v) => {
      let s = 0;
      for (let l = PRIMEIRA; l <= ULTIMA; l++) if (v[`B${l}`] === 'Limpeza') s += v[`C${l}`] * v[`E${l}`];
      return formula(cel, 'F11') && perto(v.F11, s);
    },
  },
  {
    id: 'procv', titulo: 'Consulta com PROCV', xp: 35,
    descricao: 'Digite o nome de um item em A13 e, em B13, use PROCV para trazer o custo unitário dele.',
    dica: '=PROCV(A13;A2:E9;5;FALSO) — FALSO = correspondência exata',
    check: (cel, v) => {
      const linha = [...Array(ULTIMA - PRIMEIRA + 1)].map((_, i) => i + PRIMEIRA).find((l) => v[`A${l}`] === v.A13);
      return !!linha && /PROCV|VLOOKUP/i.test(cel.B13 ?? '') && perto(v.B13, v[`E${linha}`]);
    },
  },
  {
    id: 'ordenar', titulo: 'Curva ABC simplificada', xp: 25,
    descricao: 'Ordene os itens (linhas 2 a 9) do maior para o menor valor total.',
    dica: 'Use o botão de ordenação da coluna F (↓). As fórmulas se ajustam à nova linha.',
    check: (cel, v) => cadaLinha((l) => typeof v[`F${l}`] === 'number' && (l === ULTIMA || v[`F${l}`] >= v[`F${l + 1}`])),
  },
  {
    id: 'grafico', titulo: 'Gráfico gerencial', xp: 20,
    descricao: 'Crie um gráfico de barras com os itens (coluna A) e seus valores totais (coluna F).',
    dica: 'Painel "Gráfico": rótulos = A, valores = F.',
    check: (cel, v, extra) => extra?.grafico?.rotulos === 'A' && extra?.grafico?.valores === 'F' && cadaLinha((l) => typeof v[`F${l}`] === 'number'),
  },
];

export function verificar(celulas, extra) {
  const { valores } = avaliarPlanilha(celulas);
  return Object.fromEntries(MISSOES_PLANILHA.map((m) => [m.id, m.check(celulas, valores, extra)]));
}

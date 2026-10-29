// Treinos de exatas: matemática, álgebra, geometria, matemática financeira, estatística, contagem, lógica, economia,
// química de laboratório e eletricidade. Valores sorteados a cada exercício; respostas calculadas pela fórmula.
import { escolha, inteiro, arred, br, reais, embaralhar } from './motor.js';

const mdc = (a, b) => (b ? mdc(b, a % b) : a);
const fat = (n) => (n <= 1 ? 1 : n * fat(n - 1));
const comb = (n, k) => fat(n) / (fat(k) * fat(n - k));
const fracao = (n, d) => { const g = mdc(Math.abs(n), Math.abs(d)); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
const lista = (xs) => xs.map((x) => br(x)).join('; ');

export default {
  matematica: {
    intro: 'Porcentagem, regra de três, frações e divisibilidade: a base de quase toda prova de Matemática e Raciocínio Lógico.',
    teoria: `**Porcentagem**: x% = x/100. Aumento de i → fator (1 + i); desconto de i → fator (1 − i). Variações sucessivas **multiplicam** os fatores.

**Regra de três**: grandezas diretamente proporcionais crescem juntas (a/b = c/x); inversamente proporcionais, uma cresce e a outra cai (a·b = c·x).

**MMC e MDC**: MDC é o maior divisor comum (algoritmo de Euclides); MMC × MDC = a × b.

**Frações**: para somar, iguale os denominadores (MMC) e simplifique pelo MDC.`,
    exercicios: [
      { tipo: 'calc', id: 'porcentagem', titulo: 'Porcentagem', formula: 'x% de V = V × x ÷ 100', gerar: (r) => {
        const p = escolha(r, [5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75]); const v = escolha(r, [80, 120, 240, 360, 450, 600, 850, 1200, 2500]);
        return { enunciado: `Quanto é ${p}% de ${br(v)}?`, resposta: (v * p) / 100, passos: `${br(v)} × ${p} ÷ 100 = **${br((v * p) / 100)}**` };
      } },
      { tipo: 'calc', id: 'sucessivos', titulo: 'Aumentos e descontos sucessivos', formula: 'fator final = (1 + i₁) × (1 − i₂)', gerar: (r) => {
        const a = escolha(r, [10, 20, 25, 30, 40, 50]); const d = escolha(r, [10, 20, 25, 30, 40, 50]); const f = (1 + a / 100) * (1 - d / 100);
        return { enunciado: `Um preço sobe ${a}% e, em seguida, cai ${d}%. Qual a variação percentual final? (use sinal negativo para queda)`, resposta: arred((f - 1) * 100, 2), unidade: '%', passos: `Fator: ${br(1 + a / 100)} × ${br(1 - d / 100)} = ${br(f, 4)} → variação de **${br((f - 1) * 100)}%**. Percentuais sucessivos não se somam.` };
      } },
      { tipo: 'calc', id: 'regra3', titulo: 'Regra de três simples', formula: 'a/b = c/x', gerar: (r) => {
        const k = escolha(r, [3, 4, 5, 6, 8, 12]); const preco = escolha(r, [2.5, 3, 4.5, 7, 12]); const n = escolha(r, [7, 9, 10, 15, 18, 20]);
        return { enunciado: `Se ${k} cadernos custam ${reais(k * preco)}, quanto custam ${n} cadernos?`, resposta: n * preco, unidade: 'R$', passos: `x = ${n} × ${reais(k * preco)} ÷ ${k} = **${reais(n * preco)}** (grandezas diretamente proporcionais).` };
      } },
      { tipo: 'calc', id: 'inversa', titulo: 'Regra de três inversa', formula: 'a × b = c × x', gerar: (r) => {
        const w1 = escolha(r, [4, 6, 8, 10, 12]); const d1 = escolha(r, [6, 9, 10, 12, 15, 18]); const total = w1 * d1;
        const w2 = escolha(r, [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20].filter((w) => w !== w1 && total % w === 0));
        return { enunciado: `${w1} servidores digitalizam um arquivo em ${d1} dias. Mantido o ritmo, em quantos dias ${w2} servidores fariam o mesmo trabalho?`, resposta: total / w2, unidade: 'dias', passos: `Mais servidores, menos dias (inversa): ${w1} × ${d1} = ${w2} × x → x = **${total / w2}**.` };
      } },
      { tipo: 'calc', id: 'mmc', titulo: 'MMC e MDC', formula: 'MMC(a, b) = a × b ÷ MDC(a, b)', gerar: (r) => {
        const g = inteiro(r, 2, 12); let x = inteiro(r, 2, 9); let y = inteiro(r, 2, 9); while (x === y || mdc(x, y) !== 1) { x = inteiro(r, 2, 9); y = inteiro(r, 2, 9); }
        const a = x * g; const b = y * g; const pedeMmc = r() < 0.5;
        return { enunciado: pedeMmc ? `Dois ônibus partem juntos às 6h; um passa a cada ${a} min e o outro a cada ${b} min. Depois de quantos minutos voltam a partir juntos?` : `Qual o maior tamanho de pacote para dividir ${a} canetas e ${b} lápis em pacotes iguais, sem sobras e sem misturar?`, resposta: pedeMmc ? (a * b) / g : g, passos: `MDC(${a}, ${b}) = ${g}; MMC = ${a} × ${b} ÷ ${g} = ${(a * b) / g}. ${pedeMmc ? 'Encontros periódicos → **MMC**.' : 'Maior divisão igual → **MDC**.'}` };
      } },
      { tipo: 'calc', id: 'fracoes', titulo: 'Soma de frações', formula: 'a/b + c/d = (a·d + c·b) / (b·d), depois simplifique', gerar: (r) => {
        const b = escolha(r, [2, 3, 4, 5, 6, 8, 10, 12]); const d = escolha(r, [2, 3, 4, 5, 6, 8, 10, 12]); const a = inteiro(r, 1, b - 1); const c = inteiro(r, 1, d - 1);
        const res = fracao(a * d + c * b, b * d);
        return { enunciado: `Calcule ${a}/${b} + ${c}/${d} e responda na forma irredutível (ex.: 7/12).`, resposta: res, passos: `(${a}×${d} + ${c}×${b}) / (${b}×${d}) = ${a * d + c * b}/${b * d} = **${res}**` };
      } },
      { tipo: 'classificar', id: 'conjuntos', titulo: 'Conjuntos numéricos', pergunta: 'Qual o MENOR conjunto numérico que contém o número?', categorias: ['Naturais (ℕ)', 'Inteiros (ℤ)', 'Racionais (ℚ)', 'Irracionais (𝕀)'], itens: [
        ['12', 'Naturais (ℕ)'], ['0', 'Naturais (ℕ)', 'No Brasil, a convenção usual inclui o zero em ℕ.'], ['√9', 'Naturais (ℕ)', '√9 = 3.'], ['100/4', 'Naturais (ℕ)', '100/4 = 25.'],
        ['−7', 'Inteiros (ℤ)'], ['−√16', 'Inteiros (ℤ)', '−√16 = −4.'], ['−12/3', 'Inteiros (ℤ)', '−12/3 = −4.'],
        ['0,75', 'Racionais (ℚ)', '0,75 = 3/4.'], ['−3/4', 'Racionais (ℚ)'], ['0,333…', 'Racionais (ℚ)', 'Dízima periódica = 1/3.'], ['2,5', 'Racionais (ℚ)'],
        ['√2', 'Irracionais (𝕀)', 'Raiz não exata: decimal infinito e não periódico.'], ['π', 'Irracionais (𝕀)'], ['1,4142135… (sem período)', 'Irracionais (𝕀)'], ['e (número de Euler)', 'Irracionais (𝕀)'], ['√5 + 1', 'Irracionais (𝕀)'],
      ] },
    ],
  },

  algebra: {
    intro: 'Equações, progressões e funções: o núcleo de álgebra cobrado em Matemática e Raciocínio Lógico.',
    teoria: `**PA**: aₙ = a₁ + (n − 1)·r; Sₙ = (a₁ + aₙ)·n/2.

**PG**: aₙ = a₁·qⁿ⁻¹; Sₙ = a₁·(qⁿ − 1)/(q − 1).

**2º grau** (ax² + bx + c = 0): Δ = b² − 4ac; x = (−b ± √Δ)/2a; soma das raízes −b/a; produto c/a.`,
    exercicios: [
      { tipo: 'calc', id: 'pa-termo', titulo: 'Termo da PA', formula: 'aₙ = a₁ + (n − 1)·r', gerar: (r) => {
        const a1 = inteiro(r, -5, 20); const q = escolha(r, [-4, -3, 2, 3, 4, 5, 7]); const n = inteiro(r, 8, 40);
        return { enunciado: `Numa PA, a₁ = ${a1} e a razão é ${q}. Qual é o ${n}º termo?`, resposta: a1 + (n - 1) * q, passos: `a${n} = ${a1} + (${n} − 1)·(${q}) = **${a1 + (n - 1) * q}**` };
      } },
      { tipo: 'calc', id: 'pa-soma', titulo: 'Soma da PA', formula: 'Sₙ = (a₁ + aₙ)·n/2', gerar: (r) => {
        const a1 = inteiro(r, 1, 15); const q = inteiro(r, 2, 6); const n = inteiro(r, 10, 30); const an = a1 + (n - 1) * q;
        return { enunciado: `Some os ${n} primeiros termos da PA (${a1}, ${a1 + q}, ${a1 + 2 * q}, …).`, resposta: ((a1 + an) * n) / 2, passos: `a${n} = ${an}; S = (${a1} + ${an})·${n}/2 = **${((a1 + an) * n) / 2}**` };
      } },
      { tipo: 'calc', id: 'pg-termo', titulo: 'Termo da PG', formula: 'aₙ = a₁·qⁿ⁻¹', gerar: (r) => {
        const a1 = inteiro(r, 1, 5); const q = escolha(r, [2, 3, -2]); const n = inteiro(r, 4, 9);
        return { enunciado: `Numa PG, a₁ = ${a1} e a razão é ${q}. Qual é o ${n}º termo?`, resposta: a1 * q ** (n - 1), passos: `a${n} = ${a1}·(${q})^${n - 1} = **${a1 * q ** (n - 1)}**` };
      } },
      { tipo: 'calc', id: 'pg-soma', titulo: 'Soma da PG finita', formula: 'Sₙ = a₁·(qⁿ − 1)/(q − 1)', gerar: (r) => {
        const a1 = inteiro(r, 1, 4); const q = escolha(r, [2, 3]); const n = inteiro(r, 4, 8);
        return { enunciado: `Um boato é contado a ${a1} pessoa(s) no 1º dia e cada dia o número de novas pessoas é multiplicado por ${q}. Quantas pessoas terão ouvido em ${n} dias?`, resposta: (a1 * (q ** n - 1)) / (q - 1), passos: `S = ${a1}·(${q}^${n} − 1)/(${q} − 1) = **${(a1 * (q ** n - 1)) / (q - 1)}**` };
      } },
      { tipo: 'calc', id: 'eq1', titulo: 'Equação do 1º grau', formula: 'isole x: ax + b = c → x = (c − b)/a', gerar: (r) => {
        const a = escolha(r, [2, 3, 4, 5, 6, 7]); const x = inteiro(r, -9, 15); const b = inteiro(r, -20, 20);
        return { enunciado: `Resolva: ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * x + b}`, resposta: x, passos: `${a}x = ${a * x + b} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x} → x = **${x}**` };
      } },
      { tipo: 'calc', id: 'eq2', titulo: 'Equação do 2º grau', formula: 'x = (−b ± √Δ)/2a; soma = −b/a; produto = c/a', gerar: (r) => {
        const x1 = inteiro(r, -8, 6); let x2 = inteiro(r, -6, 9); if (x2 === x1) x2 += 2; const s = x1 + x2; const p = x1 * x2;
        const termo = (v, suf) => (v === 0 ? '' : ` ${v < 0 ? '−' : '+'} ${Math.abs(v) === 1 && suf ? '' : Math.abs(v)}${suf}`);
        return { enunciado: `Qual a MAIOR raiz de x²${termo(-s, 'x')}${termo(p, '')} = 0?`, resposta: Math.max(x1, x2), passos: `Soma das raízes = ${s} e produto = ${p} → raízes ${x1} e ${x2}; maior: **${Math.max(x1, x2)}**.` };
      } },
      { tipo: 'classificar', id: 'funcoes', titulo: 'Tipos de função', pergunta: 'Qual é o tipo da função?', categorias: ['Afim (1º grau)', 'Quadrática (2º grau)', 'Exponencial', 'Logarítmica'], itens: [
        ['f(x) = 3x − 2', 'Afim (1º grau)'], ['f(x) = −5x', 'Afim (1º grau)', 'Linear: caso particular da afim com b = 0.'], ['f(x) = x/3 + 1', 'Afim (1º grau)'],
        ['f(x) = x² − 4x + 3', 'Quadrática (2º grau)'], ['f(x) = (x − 1)(x + 2)', 'Quadrática (2º grau)', 'Desenvolvendo: x² + x − 2.'], ['f(x) = 2x²', 'Quadrática (2º grau)'],
        ['f(x) = 2ˣ', 'Exponencial'], ['f(x) = 0,5ˣ', 'Exponencial', 'Base entre 0 e 1: decrescente.'], ['y = 3·4ˣ', 'Exponencial'],
        ['f(x) = log₂ x', 'Logarítmica'], ['f(x) = ln x', 'Logarítmica'], ['y = log x + 1', 'Logarítmica'],
      ] },
    ],
  },

  geometria: {
    intro: 'Áreas, volumes, Pitágoras e polígonos — com π = 3,14 quando necessário.',
    teoria: `**Áreas**: retângulo b·h; triângulo b·h/2; trapézio (B + b)·h/2; círculo π·r².

**Pitágoras**: a² = b² + c² (a é a hipotenusa). Ternas úteis: 3-4-5, 5-12-13, 8-15-17.

**Volumes**: paralelepípedo a·b·c; cilindro π·r²·h; 1 m³ = 1.000 L.

**Polígonos**: soma dos ângulos internos (n − 2)·180°; diagonais n(n − 3)/2.`,
    exercicios: [
      { tipo: 'calc', id: 'triangulo', titulo: 'Área do triângulo', formula: 'A = b × h ÷ 2', gerar: (r) => {
        const b = inteiro(r, 3, 30); const h = inteiro(r, 2, 25);
        return { enunciado: `Um terreno triangular tem base de ${b} m e altura de ${h} m. Qual a área?`, resposta: (b * h) / 2, unidade: 'm²', passos: `${b} × ${h} ÷ 2 = **${br((b * h) / 2)} m²**` };
      } },
      { tipo: 'calc', id: 'circulo', titulo: 'Área do círculo', formula: 'A = π·r² (π = 3,14)', gerar: (r) => {
        const raio = inteiro(r, 2, 15);
        return { enunciado: `Qual a área de uma praça circular de raio ${raio} m? Use π = 3,14.`, resposta: 3.14 * raio * raio, unidade: 'm²', passos: `3,14 × ${raio}² = **${br(3.14 * raio * raio)} m²**` };
      } },
      { tipo: 'calc', id: 'pitagoras', titulo: 'Teorema de Pitágoras', formula: 'a² = b² + c²', gerar: (r) => {
        const [x, y, z] = escolha(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]); const k = inteiro(r, 1, 4);
        return { enunciado: `Uma escada está apoiada em um muro: o pé fica a ${x * k} m do muro e o topo a ${y * k} m do chão. Qual o comprimento da escada?`, resposta: z * k, unidade: 'm', passos: `√(${x * k}² + ${y * k}²) = √${(z * k) ** 2} = **${z * k} m**` };
      } },
      { tipo: 'calc', id: 'cilindro', titulo: 'Volume do cilindro', formula: 'V = π·r²·h; 1 m³ = 1.000 L', gerar: (r) => {
        const raio = escolha(r, [0.5, 1, 1.5, 2]); const h = escolha(r, [1, 2, 3, 4]);
        return { enunciado: `Uma caixa d'água cilíndrica tem raio de ${br(raio)} m e altura de ${h} m. Quantos litros cabem nela? Use π = 3,14.`, resposta: 3.14 * raio * raio * h * 1000, unidade: 'L', passos: `V = 3,14 × ${br(raio)}² × ${h} = ${br(3.14 * raio * raio * h, 3)} m³ = **${br(3.14 * raio * raio * h * 1000)} L**` };
      } },
      { tipo: 'calc', id: 'poligonos', titulo: 'Polígonos', formula: 'Sᵢ = (n − 2)·180°; d = n(n − 3)/2', gerar: (r) => {
        const n = inteiro(r, 5, 20); const pedeSoma = r() < 0.5;
        return { enunciado: pedeSoma ? `Qual a soma dos ângulos internos de um polígono convexo de ${n} lados?` : `Quantas diagonais tem um polígono convexo de ${n} lados?`, resposta: pedeSoma ? (n - 2) * 180 : (n * (n - 3)) / 2, unidade: pedeSoma ? 'graus' : 'diagonais', passos: pedeSoma ? `(${n} − 2) × 180 = **${(n - 2) * 180}°**` : `${n} × (${n} − 3) ÷ 2 = **${(n * (n - 3)) / 2}**` };
      } },
      { tipo: 'classificar', id: 'triangulos', titulo: 'Classificar triângulos', pergunta: 'Pelos ângulos internos, o triângulo é:', categorias: ['Acutângulo', 'Retângulo', 'Obtusângulo'], itens: [
        ['30°, 60° e 90°', 'Retângulo'], ['45°, 45° e 90°', 'Retângulo'], ['Lados 6, 8 e 10', 'Retângulo', '6² + 8² = 10²: vale Pitágoras.'],
        ['50°, 60° e 70°', 'Acutângulo'], ['60°, 60° e 60°', 'Acutângulo', 'Equilátero: todos os ângulos agudos.'], ['80°, 55° e 45°', 'Acutângulo'],
        ['20°, 30° e 130°', 'Obtusângulo'], ['100°, 40° e 40°', 'Obtusângulo'], ['Lados 4, 5 e 8', 'Obtusângulo', '8² = 64 > 4² + 5² = 41.'], ['Lados 5, 6 e 7', 'Acutângulo', '7² = 49 < 5² + 6² = 61.'],
      ] },
    ],
  },

  'mat-financeira': {
    intro: 'Juros simples e compostos, descontos, taxas equivalentes e sistemas de amortização SAC e Price.',
    teoria: `**Juros simples**: J = C·i·n; M = C·(1 + i·n).

**Juros compostos**: M = C·(1 + i)ⁿ. Taxa equivalente: (1 + i_a) = (1 + i_m)¹².

**Desconto comercial simples** (por fora): D = N·d·n; valor descontado = N − D.

**SAC**: amortização constante A = PV/n; juros sobre o saldo; prestações decrescentes.

**Price**: prestação constante PMT = PV·i / [1 − (1 + i)⁻ⁿ].`,
    exercicios: [
      { tipo: 'calc', id: 'simples', titulo: 'Juros simples', formula: 'J = C × i × n', gerar: (r) => {
        const c = escolha(r, [1000, 2500, 4000, 5000, 8000, 12000]); const i = escolha(r, [1, 1.5, 2, 2.5, 3]); const n = inteiro(r, 3, 18);
        return { enunciado: `Qual o juro simples de ${reais(c)} aplicados a ${br(i)}% ao mês durante ${n} meses?`, resposta: (c * i * n) / 100, unidade: 'R$', passos: `${reais(c)} × ${br(i / 100, 3)} × ${n} = **${reais((c * i * n) / 100)}**` };
      } },
      { tipo: 'calc', id: 'composto', titulo: 'Montante composto', formula: 'M = C × (1 + i)ⁿ', gerar: (r) => {
        const c = escolha(r, [1000, 2000, 5000, 10000]); const i = escolha(r, [1, 2, 5, 10]); const n = inteiro(r, 2, 6);
        const m = c * (1 + i / 100) ** n;
        return { enunciado: `Qual o montante de ${reais(c)} aplicados a juros compostos de ${i}% ao mês por ${n} meses? (2 casas)`, resposta: arred(m), unidade: 'R$', tol: 0.02, passos: `${reais(c)} × ${br(1 + i / 100)}^${n} = ${reais(c)} × ${br((1 + i / 100) ** n, 6)} = **${reais(m)}**` };
      } },
      { tipo: 'calc', id: 'desconto', titulo: 'Desconto comercial simples', formula: 'D = N × d × n; A = N − D', gerar: (r) => {
        const nom = escolha(r, [2000, 5000, 8000, 10000, 15000]); const d = escolha(r, [1, 1.5, 2, 2.5, 3]); const n = inteiro(r, 2, 6);
        const desc = (nom * d * n) / 100;
        return { enunciado: `Um título de ${reais(nom)} é descontado ${n} meses antes do vencimento, à taxa de desconto comercial simples de ${br(d)}% a.m. Qual o valor recebido?`, resposta: nom - desc, unidade: 'R$', passos: `D = ${reais(nom)} × ${br(d / 100, 3)} × ${n} = ${reais(desc)}; recebido = **${reais(nom - desc)}**` };
      } },
      { tipo: 'calc', id: 'equivalente', titulo: 'Taxa equivalente', formula: '(1 + iₐ) = (1 + iₘ)¹²', gerar: (r) => {
        const im = escolha(r, [0.5, 1, 1.5, 2, 3]); const ia = ((1 + im / 100) ** 12 - 1) * 100;
        return { enunciado: `Qual a taxa anual equivalente a ${br(im)}% ao mês, em juros compostos? (em %, 2 casas)`, resposta: arred(ia), unidade: '% a.a.', tol: 0.02, passos: `(1 + ${br(im / 100, 3)})¹² = ${br(1 + ia / 100, 4)} → **${br(ia)}% a.a.** (a taxa proporcional seria ${br(im * 12)}%).` };
      } },
      { tipo: 'calc', id: 'sac', titulo: 'Primeira prestação no SAC', formula: 'P₁ = PV/n + PV·i', gerar: (r) => {
        const pv = escolha(r, [12000, 24000, 60000, 120000, 240000]); const n = escolha(r, [12, 24, 60, 120, 240]); const i = escolha(r, [0.5, 1, 1.5, 2]);
        return { enunciado: `Financiamento de ${reais(pv)} pelo SAC em ${n} parcelas mensais, a ${br(i)}% a.m. Qual o valor da 1ª prestação?`, resposta: pv / n + (pv * i) / 100, unidade: 'R$', passos: `Amortização ${reais(pv / n)} + juros ${reais((pv * i) / 100)} = **${reais(pv / n + (pv * i) / 100)}**` };
      } },
      { tipo: 'calc', id: 'price', titulo: 'Prestação Price', formula: 'PMT = PV × i / [1 − (1 + i)⁻ⁿ]', gerar: (r) => {
        const pv = escolha(r, [1000, 5000, 10000, 20000]); const n = escolha(r, [3, 4, 5, 6, 10, 12]); const i = escolha(r, [1, 2, 3, 5]);
        const pmt = (pv * (i / 100)) / (1 - (1 + i / 100) ** -n);
        return { enunciado: `Qual a prestação mensal (Tabela Price) de ${reais(pv)} em ${n} vezes a ${i}% a.m.? (2 casas)`, resposta: arred(pmt), unidade: 'R$', tol: 0.03, passos: `${reais(pv)} × ${br(i / 100)} ÷ [1 − ${br(1 + i / 100)}^−${n}] = **${reais(pmt)}**` };
      } },
      { tipo: 'classificar', id: 'sac-price', titulo: 'SAC x Price', pergunta: 'A característica é do:', categorias: ['SAC', 'Price', 'Ambos'], itens: [
        ['Amortização constante', 'SAC'], ['Prestações decrescentes', 'SAC'], ['Primeira prestação maior (mesmas condições)', 'SAC'],
        ['Prestações constantes', 'Price'], ['Amortização crescente ao longo do tempo', 'Price'], ['Maior total de juros pagos (mesmas condições)', 'Price', 'Como amortiza mais devagar no início, o saldo fica maior por mais tempo.'],
        ['Juros calculados sobre o saldo devedor', 'Ambos'], ['Juros decrescentes a cada período', 'Ambos'], ['Saldo devedor zerado na última parcela', 'Ambos'],
      ] },
    ],
  },

  estatistica: {
    intro: 'Medidas de posição e de dispersão calculadas à mão, como na prova, e classificação de variáveis.',
    teoria: `**Média** = soma ÷ n. **Mediana**: valor central do rol ordenado (com n par, média dos dois centrais). **Moda**: valor mais frequente.

**Amplitude** = máximo − mínimo. **Variância populacional** σ² = Σ(x − x̄)²/n; amostral divide por n − 1. **Desvio padrão** = √variância. **CV** = σ/x̄.

**Variáveis**: qualitativas (nominal, ordinal) e quantitativas (discreta — contagem; contínua — medida).`,
    exercicios: [
      { tipo: 'calc', id: 'media', titulo: 'Média aritmética', formula: 'x̄ = Σx ÷ n', gerar: (r) => {
        const xs = Array.from({ length: inteiro(r, 5, 8) }, () => inteiro(r, 2, 30)); const s = xs.reduce((a, b) => a + b, 0);
        return { enunciado: `Qual a média de: ${lista(xs)}?`, resposta: s / xs.length, passos: `${s} ÷ ${xs.length} = **${br(s / xs.length)}**` };
      } },
      { tipo: 'calc', id: 'mediana', titulo: 'Mediana', formula: 'ordene; n ímpar → central; n par → média dos centrais', gerar: (r) => {
        const xs = Array.from({ length: inteiro(r, 5, 8) }, () => inteiro(r, 1, 40)); const o = [...xs].sort((a, b) => a - b); const n = o.length;
        const md = n % 2 ? o[(n - 1) / 2] : (o[n / 2 - 1] + o[n / 2]) / 2;
        return { enunciado: `Qual a mediana de: ${lista(xs)}?`, resposta: md, passos: `Rol: ${lista(o)} → **${br(md)}**` };
      } },
      { tipo: 'calc', id: 'moda', titulo: 'Moda', formula: 'valor de maior frequência', gerar: (r) => {
        const m = inteiro(r, 1, 20); const xs = [m, m, m]; while (xs.length < 8) { const v = inteiro(r, 1, 20); if (xs.filter((x) => x === v).length < 2 && v !== m) xs.push(v); }
        const emb = embaralhar(xs, r);
        return { enunciado: `Qual a moda de: ${lista(emb)}?`, resposta: m, passos: `${m} aparece 3 vezes; nenhum outro valor aparece mais de 2 → moda **${m}**.` };
      } },
      { tipo: 'calc', id: 'variancia', titulo: 'Variância e desvio padrão', formula: 'σ² = Σ(x − x̄)² ÷ n; σ = √σ²', gerar: (r) => {
        const base = escolha(r, [[2, 4, 4, 4, 5, 5, 7, 9], [1, 3, 5, 7, 9], [10, 12, 14, 16, 18], [4, 8, 6, 2], [5, 5, 5, 9, 1]]); const k = inteiro(r, 0, 10);
        const xs = base.map((x) => x + k); const med = xs.reduce((a, b) => a + b, 0) / xs.length; const v = xs.reduce((s, x) => s + (x - med) ** 2, 0) / xs.length; const pedeDp = r() < 0.5;
        return { enunciado: `Calcule ${pedeDp ? 'o desvio padrão' : 'a variância'} POPULACIONAL de: ${lista(xs)} (2 casas).`, resposta: arred(pedeDp ? Math.sqrt(v) : v), tol: 0.02, passos: `Média ${br(med)}; Σ(x − x̄)² = ${br(v * xs.length)}; σ² = ${br(v)}${pedeDp ? `; σ = √${br(v)} = **${br(Math.sqrt(v))}**` : ' → **' + br(v) + '**'}. Somar k a todos os valores não muda a dispersão.` };
      } },
      { tipo: 'calc', id: 'ponderada', titulo: 'Média ponderada', formula: 'x̄ = Σ(x·p) ÷ Σp', gerar: (r) => {
        const notas = [inteiro(r, 4, 10), inteiro(r, 3, 10), inteiro(r, 5, 10)]; const pesos = [escolha(r, [1, 2]), escolha(r, [2, 3]), escolha(r, [3, 4, 5])];
        const s = notas.reduce((a, x, i) => a + x * pesos[i], 0); const p = pesos.reduce((a, b) => a + b, 0);
        return { enunciado: `Notas ${lista(notas)} com pesos ${lista(pesos)}, respectivamente. Qual a média ponderada? (2 casas)`, resposta: arred(s / p), passos: `${notas.map((x, i) => `${x}×${pesos[i]}`).join(' + ')} = ${s}; ÷ ${p} = **${br(s / p)}**` };
      } },
      { tipo: 'classificar', id: 'variaveis', titulo: 'Tipos de variável', pergunta: 'A variável é:', categorias: ['Qualitativa nominal', 'Qualitativa ordinal', 'Quantitativa discreta', 'Quantitativa contínua'], itens: [
        ['Tipo sanguíneo', 'Qualitativa nominal'], ['Estado civil', 'Qualitativa nominal'], ['Cor dos olhos', 'Qualitativa nominal'], ['CEP de residência', 'Qualitativa nominal', 'Números usados como rótulo não são quantidades.'],
        ['Escolaridade (fundamental, médio, superior)', 'Qualitativa ordinal'], ['Patente militar', 'Qualitativa ordinal'], ['Satisfação: ruim, regular, bom, ótimo', 'Qualitativa ordinal'],
        ['Número de filhos', 'Quantitativa discreta'], ['Processos protocolados por dia', 'Quantitativa discreta'], ['Acidentes de trabalho no mês', 'Quantitativa discreta'],
        ['Altura', 'Quantitativa contínua'], ['Tempo de atendimento', 'Quantitativa contínua'], ['Temperatura corporal', 'Quantitativa contínua'], ['Peso de um paciente', 'Quantitativa contínua'],
      ] },
    ],
  },

  probabilidade: {
    intro: 'Princípio fundamental da contagem, permutações, arranjos, combinações e probabilidade clássica.',
    teoria: `**Permutação**: Pₙ = n!. Com repetição: n!/(a!·b!·…).

**Arranjo** (a ordem importa): A(n, k) = n!/(n − k)!. **Combinação** (a ordem não importa): C(n, k) = n!/[k!(n − k)!].

**Probabilidade clássica**: P = casos favoráveis ÷ casos possíveis. Eventos independentes: multiplique. Mutuamente exclusivos: some.`,
    exercicios: [
      { tipo: 'calc', id: 'anagramas', titulo: 'Anagramas', formula: 'n! ÷ (repetições!)', gerar: (r) => {
        const [p, n, info] = escolha(r, [['AMOR', 24, '4! = 24'], ['PROVA', 120, '5! = 120'], ['BANANA', 60, '6!/(3!·2!) = 60'], ['ARARA', 10, '5!/(3!·2!) = 10'], ['CASA', 12, '4!/2! = 12'], ['EDITAL', 720, '6! = 720'], ['CONCURSO', 10080, '8!/(2!·2!) = 10.080'], ['PAPEL', 60, '5!/2! = 60']]);
        return { enunciado: `Quantos anagramas tem a palavra ${p}?`, resposta: n, passos: `${info}` };
      } },
      { tipo: 'calc', id: 'arranjo', titulo: 'Arranjos', formula: 'A(n, k) = n!/(n − k)!', gerar: (r) => {
        const n = inteiro(r, 6, 12); const k = escolha(r, [2, 3]);
        return { enunciado: `De ${n} candidatos, de quantas maneiras se pode escolher ${k === 2 ? 'um presidente e um vice' : 'presidente, vice e secretário'}?`, resposta: fat(n) / fat(n - k), passos: `A(${n}, ${k}) = ${Array.from({ length: k }, (_, i) => n - i).join(' × ')} = **${fat(n) / fat(n - k)}** (a ordem importa).` };
      } },
      { tipo: 'calc', id: 'combinacao', titulo: 'Combinações', formula: 'C(n, k) = n!/[k!(n − k)!]', gerar: (r) => {
        const n = inteiro(r, 6, 15); const k = inteiro(r, 2, 4);
        return { enunciado: `De quantas maneiras se pode formar uma comissão de ${k} servidores escolhidos entre ${n}?`, resposta: comb(n, k), passos: `C(${n}, ${k}) = **${comb(n, k)}** (a ordem não importa).` };
      } },
      { tipo: 'calc', id: 'moedas', titulo: 'Probabilidade com moedas', formula: 'P = C(n, k) ÷ 2ⁿ', gerar: (r) => {
        const n = inteiro(r, 2, 6); const k = inteiro(r, 0, n); const res = fracao(comb(n, k), 2 ** n);
        return { enunciado: `Lançando uma moeda honesta ${n} vezes, qual a probabilidade de obter exatamente ${k} cara(s)? Responda em fração irredutível (ex.: 3/8).`, resposta: res, passos: `C(${n}, ${k}) = ${comb(n, k)} casos favoráveis de 2^${n} = ${2 ** n} → **${res}**` };
      } },
      { tipo: 'calc', id: 'dados', titulo: 'Soma de dois dados', formula: 'P = favoráveis ÷ 36', gerar: (r) => {
        const s = inteiro(r, 2, 12); const fav = 6 - Math.abs(7 - s); const res = fracao(fav, 36);
        return { enunciado: `Lançando dois dados honestos, qual a probabilidade de a soma ser ${s}? Responda em fração irredutível.`, resposta: res, passos: `${fav} pares de 36 somam ${s} → **${res}**` };
      } },
      { tipo: 'classificar', id: 'ordem', titulo: 'Arranjo, combinação ou permutação?', pergunta: 'Qual técnica de contagem resolve o problema?', categorias: ['Arranjo', 'Combinação', 'Permutação'], itens: [
        ['Eleger presidente e vice entre 10 pessoas', 'Arranjo', 'Cargos diferentes: a ordem importa.'], ['Senhas de 4 dígitos distintos', 'Arranjo'], ['Pódio (1º, 2º e 3º) entre 8 corredores', 'Arranjo'], ['Placas com 3 letras distintas', 'Arranjo'],
        ['Comissão de 3 pessoas entre 10', 'Combinação', 'Membros iguais: a ordem não importa.'], ['Aposta da Mega-Sena (6 números de 60)', 'Combinação'], ['Apertos de mão entre 12 pessoas', 'Combinação'], ['Escolher 4 questões entre 7 para responder', 'Combinação'],
        ['Anagramas de AMOR', 'Permutação'], ['Maneiras de 5 pessoas sentarem em fila', 'Permutação'], ['Ordenar 6 livros na estante', 'Permutação'],
      ] },
    ],
  },

  argumentos: {
    intro: 'Equivalências e negações da condicional, validade de argumentos e problemas com conjuntos.',
    teoria: `**p → q** equivale a **~q → ~p** (contrapositiva) e a **~p ∨ q**. A recíproca (q → p) e a inversa (~p → ~q) **não** são equivalentes.

**Negação de p → q**: p ∧ ~q. **De Morgan**: ~(p ∧ q) ≡ ~p ∨ ~q; ~(p ∨ q) ≡ ~p ∧ ~q.

**Argumentos válidos**: modus ponens (p → q, p ⊢ q), modus tollens (p → q, ~q ⊢ ~p), silogismo disjuntivo, silogismo hipotético. **Falácias**: afirmar o consequente, negar o antecedente.`,
    exercicios: [
      { tipo: 'classificar', id: 'condicional', titulo: 'Equivalência e negação', pergunta: 'Em relação a "Se chove, então a rua fica molhada", a frase é:', categorias: ['Equivalente', 'Negação', 'Nem equivalente nem negação'], itens: [
        ['Se a rua não fica molhada, então não chove.', 'Equivalente', 'Contrapositiva: ~q → ~p.'], ['Não chove ou a rua fica molhada.', 'Equivalente', 'p → q ≡ ~p ∨ q.'], ['Se não chove, a rua não fica molhada.', 'Nem equivalente nem negação', 'Inversa (~p → ~q).'],
        ['Se a rua fica molhada, então chove.', 'Nem equivalente nem negação', 'Recíproca (q → p).'], ['Chove e a rua não fica molhada.', 'Negação', '~(p → q) ≡ p ∧ ~q.'], ['Chove ou a rua fica molhada.', 'Nem equivalente nem negação'],
        ['Não é verdade que, se chove, a rua fica molhada.', 'Negação'], ['A rua fica molhada ou não chove.', 'Equivalente', 'Comutativa da disjunção: ~p ∨ q.'], ['Não chove e a rua fica molhada.', 'Nem equivalente nem negação'],
      ] },
      { tipo: 'classificar', id: 'validade', titulo: 'Argumento válido ou inválido?', pergunta: 'O argumento é:', categorias: ['Válido', 'Inválido'], itens: [
        ['Se estudo, passo. Estudei. Logo, passei.', 'Válido', 'Modus ponens.'], ['Se estudo, passo. Não passei. Logo, não estudei.', 'Válido', 'Modus tollens.'], ['Estudo ou trabalho. Não estudo. Logo, trabalho.', 'Válido', 'Silogismo disjuntivo.'],
        ['Se p, então q; se q, então r. Logo, se p, então r.', 'Válido', 'Silogismo hipotético (transitividade).'], ['Todo A é B. Todo B é C. Logo, todo A é C.', 'Válido'], ['Nenhum A é B. Algum C é A. Logo, algum C não é B.', 'Válido'],
        ['Se estudo, passo. Passei. Logo, estudei.', 'Inválido', 'Falácia da afirmação do consequente.'], ['Se estudo, passo. Não estudei. Logo, não passei.', 'Inválido', 'Falácia da negação do antecedente.'],
        ['Todo A é B. Algum C é B. Logo, algum C é A.', 'Inválido', 'O termo médio não está distribuído.'], ['Algum A é B. Algum B é C. Logo, algum A é C.', 'Inválido'], ['Estudo ou trabalho (ou inclusivo). Estudo. Logo, não trabalho.', 'Inválido', 'No "ou" inclusivo as duas podem ser verdadeiras.'],
      ] },
      { tipo: 'calc', id: 'conjuntos', titulo: 'Problemas com conjuntos', formula: 'n(A ∪ B) = n(A) + n(B) − n(A ∩ B)', gerar: (r) => {
        const total = escolha(r, [80, 100, 120, 150, 200]); const ab = inteiro(r, 5, 25); const a = ab + inteiro(r, 10, 35); const b = ab + inteiro(r, 10, 35); const uniao = a + b - ab;
        return { enunciado: `Numa repartição com ${total} servidores, ${a} usam Linux, ${b} usam Windows e ${ab} usam os dois. Quantos não usam nenhum dos dois?`, resposta: total - uniao, passos: `União = ${a} + ${b} − ${ab} = ${uniao}; nenhum = ${total} − ${uniao} = **${total - uniao}**` };
      } },
      { tipo: 'calc', id: 'linhas', titulo: 'Linhas da tabela-verdade', formula: 'linhas = 2ⁿ (n proposições simples)', gerar: (r) => {
        const n = inteiro(r, 2, 6); const letras = 'pqrstu'.slice(0, n).split('');
        return { enunciado: `Quantas linhas tem a tabela-verdade de uma proposição composta com as proposições simples ${letras.join(', ')}?`, resposta: 2 ** n, passos: `2^${n} = **${2 ** n}**` };
      } },
    ],
  },

  economia: {
    intro: 'Elasticidade, PIB, multiplicador, desemprego, inflação e juros reais — e os instrumentos de política econômica.',
    teoria: `**Elasticidade-preço da demanda** = Δ%Q ÷ Δ%P (em módulo: > 1 elástica; < 1 inelástica).

**PIB real** = PIB nominal ÷ deflator × 100. **Multiplicador keynesiano** = 1 ÷ (1 − PMgC).

**Taxa de desemprego** = desocupados ÷ força de trabalho. **Juro real** (Fisher): (1 + n) = (1 + r)(1 + π).

**Política monetária** (Banco Central): taxa básica, compulsório, open market, redesconto. **Fiscal** (governo): gastos e tributos. **Cambial**: taxa de câmbio e reservas.`,
    exercicios: [
      { tipo: 'calc', id: 'elasticidade', titulo: 'Elasticidade-preço', formula: 'E = Δ%Q ÷ Δ%P', gerar: (r) => {
        const dp = escolha(r, [5, 10, 20, 25]); const dq = escolha(r, [2, 5, 10, 15, 20, 30, 40]);
        return { enunciado: `O preço de um bem sobe ${dp}% e a quantidade demandada cai ${dq}%. Qual o módulo da elasticidade-preço da demanda?`, resposta: dq / dp, passos: `${dq} ÷ ${dp} = **${br(dq / dp)}** → demanda ${dq / dp > 1 ? 'elástica' : dq / dp < 1 ? 'inelástica' : 'de elasticidade unitária'}.` };
      } },
      { tipo: 'calc', id: 'pib', titulo: 'PIB real', formula: 'PIB real = PIB nominal ÷ deflator × 100', gerar: (r) => {
        const nom = escolha(r, [1100, 1200, 1500, 2400, 3300]); const def = escolha(r, [110, 120, 125, 150]);
        return { enunciado: `PIB nominal de ${br(nom)} bilhões e deflator de ${def} (base = 100). Qual o PIB real, em bilhões? (2 casas)`, resposta: arred((nom / def) * 100), passos: `${br(nom)} ÷ ${def} × 100 = **${br((nom / def) * 100)}**` };
      } },
      { tipo: 'calc', id: 'multiplicador', titulo: 'Multiplicador keynesiano', formula: 'k = 1 ÷ (1 − PMgC); ΔY = k × ΔG', gerar: (r) => {
        const c = escolha(r, [0.5, 0.6, 0.75, 0.8, 0.9]); const g = escolha(r, [10, 20, 50, 100]);
        return { enunciado: `Com propensão marginal a consumir de ${br(c)}, um aumento de ${g} bilhões nos gastos do governo eleva a renda em quantos bilhões?`, resposta: g / (1 - c), passos: `k = 1 ÷ (1 − ${br(c)}) = ${br(1 / (1 - c))}; ΔY = ${br(1 / (1 - c))} × ${g} = **${br(g / (1 - c))}**` };
      } },
      { tipo: 'calc', id: 'desemprego', titulo: 'Taxa de desemprego', formula: 'desocupados ÷ (ocupados + desocupados)', gerar: (r) => {
        const oc = escolha(r, [90, 92, 94, 95, 96]) * 1000; const de = escolha(r, [4, 5, 6, 8, 10]) * 1000; const forca = oc + de;
        return { enunciado: `Há ${br(oc)} ocupados, ${br(de)} desocupados que procuram emprego e 30.000 pessoas fora da força de trabalho. Qual a taxa de desemprego (%)? (2 casas)`, resposta: arred((de / forca) * 100), unidade: '%', passos: `Quem não procura emprego fica fora da força de trabalho: ${br(de)} ÷ ${br(forca)} = **${br((de / forca) * 100)}%**` };
      } },
      { tipo: 'calc', id: 'juro-real', titulo: 'Juro real (Fisher)', formula: '1 + r = (1 + n) ÷ (1 + π)', gerar: (r) => {
        const n = escolha(r, [8, 10, 11, 12, 13.75, 15]); const pi = escolha(r, [3, 4, 4.5, 5, 6]); const real = ((1 + n / 100) / (1 + pi / 100) - 1) * 100;
        return { enunciado: `Uma aplicação rendeu ${br(n)}% no ano e a inflação foi de ${br(pi)}%. Qual o ganho real (%)? (2 casas)`, resposta: arred(real), unidade: '%', tol: 0.02, passos: `${br(1 + n / 100, 4)} ÷ ${br(1 + pi / 100, 4)} − 1 = **${br(real)}%** (a subtração ${br(n - pi)}% é só aproximação).` };
      } },
      { tipo: 'classificar', id: 'politicas', titulo: 'Instrumentos de política econômica', pergunta: 'A medida é de política:', categorias: ['Monetária', 'Fiscal', 'Cambial'], itens: [
        ['Banco Central eleva a taxa Selic', 'Monetária'], ['Aumento do depósito compulsório dos bancos', 'Monetária'], ['Venda de títulos públicos no mercado aberto para enxugar liquidez', 'Monetária'], ['Alteração da taxa de redesconto', 'Monetária'],
        ['Redução do Imposto de Renda das pessoas físicas', 'Fiscal'], ['Aumento dos investimentos públicos em obras', 'Fiscal'], ['Corte de despesas de custeio do governo', 'Fiscal'], ['Criação de um programa de transferência de renda', 'Fiscal'],
        ['Banco Central vende dólares das reservas para conter a alta da moeda', 'Cambial'], ['Leilões de swap cambial', 'Cambial'], ['Adoção de câmbio flutuante', 'Cambial'],
      ] },
      { tipo: 'classificar', id: 'mercados', titulo: 'Estruturas de mercado', pergunta: 'A característica descreve:', categorias: ['Concorrência perfeita', 'Monopólio', 'Oligopólio', 'Concorrência monopolística'], itens: [
        ['Muitas firmas, produto homogêneo e preço dado pelo mercado', 'Concorrência perfeita'], ['Firmas tomadoras de preço, sem barreiras à entrada', 'Concorrência perfeita'], ['Lucro econômico nulo no longo prazo com produto idêntico', 'Concorrência perfeita'],
        ['Um único vendedor sem substitutos próximos', 'Monopólio'], ['Barreiras fortes, como patente exclusiva ou concessão única', 'Monopólio'],
        ['Poucas empresas grandes e interdependentes', 'Oligopólio'], ['Formação de cartel para combinar preços', 'Oligopólio'], ['Liderança de preço entre poucas firmas', 'Oligopólio'],
        ['Muitas firmas com produtos diferenciados por marca', 'Concorrência monopolística'], ['Restaurantes e salões de beleza de um bairro', 'Concorrência monopolística'],
      ] },
    ],
  },

  quimica: {
    intro: 'Cálculos de soluções para técnicos de laboratório: concentração, molaridade, massa a pesar e diluição.',
    teoria: `**Concentração comum** C = m/V (g/L). **Molaridade** M = n/V, com n = m/MM (mol/L).

**Massa a pesar** m = M × MM × V(L). **Diluição**: C₁V₁ = C₂V₂ (a quantidade de soluto se conserva).

Massas molares usadas: NaCl 58,5; NaOH 40; KCl 74,5; glicose 180; H₂SO₄ 98 g/mol.`,
    exercicios: [
      { tipo: 'calc', id: 'comum', titulo: 'Concentração comum', formula: 'C = m ÷ V (g/L)', gerar: (r) => {
        const m = escolha(r, [2, 5, 9, 10, 20, 45]); const v = escolha(r, [0.1, 0.25, 0.5, 1, 2]);
        return { enunciado: `Dissolvem-se ${m} g de soluto em água até ${br(v * 1000)} mL de solução. Qual a concentração em g/L?`, resposta: m / v, unidade: 'g/L', passos: `${m} g ÷ ${br(v)} L = **${br(m / v)} g/L**` };
      } },
      { tipo: 'calc', id: 'molaridade', titulo: 'Molaridade', formula: 'M = (m ÷ MM) ÷ V', gerar: (r) => {
        const [nome, mm] = escolha(r, [['NaCl', 58.5], ['NaOH', 40], ['KCl', 74.5], ['glicose', 180]]); const mols = escolha(r, [0.1, 0.2, 0.5, 1]); const v = escolha(r, [0.25, 0.5, 1, 2]);
        return { enunciado: `Qual a molaridade de uma solução com ${br(mols * mm)} g de ${nome} (MM = ${br(mm)} g/mol) em ${br(v * 1000)} mL de solução?`, resposta: mols / v, unidade: 'mol/L', passos: `n = ${br(mols * mm)} ÷ ${br(mm)} = ${br(mols)} mol; M = ${br(mols)} ÷ ${br(v)} = **${br(mols / v)} mol/L**` };
      } },
      { tipo: 'calc', id: 'massa', titulo: 'Massa a pesar', formula: 'm = M × MM × V(L)', gerar: (r) => {
        const [nome, mm] = escolha(r, [['NaCl', 58.5], ['NaOH', 40], ['KCl', 74.5], ['glicose', 180]]); const m = escolha(r, [0.1, 0.2, 0.5, 1, 2]); const v = escolha(r, [0.1, 0.25, 0.5, 1]);
        return { enunciado: `Quantos gramas de ${nome} (MM = ${br(mm)} g/mol) pesar para preparar ${br(v * 1000)} mL de solução ${br(m)} mol/L?`, resposta: m * mm * v, unidade: 'g', passos: `${br(m)} × ${br(mm)} × ${br(v)} = **${br(m * mm * v)} g**` };
      } },
      { tipo: 'calc', id: 'diluicao', titulo: 'Diluição', formula: 'C₁V₁ = C₂V₂', gerar: (r) => {
        const c1 = escolha(r, [1, 2, 5, 10]); const c2 = escolha(r, [0.1, 0.2, 0.5].map((x) => x * c1)); const v2 = escolha(r, [100, 250, 500, 1000]);
        return { enunciado: `Que volume (mL) de uma solução estoque ${br(c1)} mol/L é necessário para preparar ${v2} mL de solução ${br(c2)} mol/L?`, resposta: (c2 * v2) / c1, unidade: 'mL', passos: `V₁ = ${br(c2)} × ${v2} ÷ ${br(c1)} = **${br((c2 * v2) / c1)} mL**; complete com solvente até ${v2} mL.` };
      } },
      { tipo: 'ordenar', id: 'preparo', titulo: 'Preparo de solução', passos: ['Calcular a massa de soluto necessária', 'Pesar o soluto em balança analítica', 'Dissolver em béquer com parte do solvente', 'Transferir quantitativamente para o balão volumétrico', 'Completar com solvente até o menisco (aferir)', 'Tampar e homogeneizar', 'Rotular com nome, concentração, data e responsável'], explicacao: 'O balão volumétrico garante o volume exato; a dissolução prévia no béquer evita aferir com soluto ainda sólido.' },
      { tipo: 'classificar', id: 'funcoes', titulo: 'Funções inorgânicas', pergunta: 'A substância é um(a):', categorias: ['Ácido', 'Base', 'Sal', 'Óxido'], itens: [
        ['HCl', 'Ácido'], ['H₂SO₄', 'Ácido'], ['HNO₃', 'Ácido'], ['H₃PO₄', 'Ácido'], ['NaOH', 'Base'], ['Ca(OH)₂', 'Base'], ['KOH', 'Base'], ['NH₄OH', 'Base'],
        ['NaCl', 'Sal'], ['CaCO₃', 'Sal'], ['KNO₃', 'Sal'], ['Na₂SO₄', 'Sal'], ['CO₂', 'Óxido'], ['Fe₂O₃', 'Óxido'], ['MgO', 'Óxido'], ['SO₃', 'Óxido'],
      ] },
    ],
  },

  eletricidade: {
    intro: 'Lei de Ohm, potência, consumo de energia e associação de resistores, para cargos técnicos de manutenção e eletrotécnica.',
    teoria: `**Lei de Ohm**: V = R × I. **Potência**: P = V × I = R × I² = V²/R.

**Energia**: E(kWh) = P(W) × horas ÷ 1.000. Custo = kWh × tarifa.

**Resistores**: série Req = R₁ + R₂ + …; paralelo (dois) Req = R₁·R₂/(R₁ + R₂).`,
    exercicios: [
      { tipo: 'calc', id: 'ohm', titulo: 'Lei de Ohm', formula: 'I = V ÷ R', gerar: (r) => {
        const v = escolha(r, [12, 24, 110, 127, 220]); const rr = escolha(r, [2, 4, 5, 10, 11, 20, 22, 44, 55, 110]);
        return { enunciado: `Um resistor de ${rr} Ω é ligado a ${v} V. Qual a corrente? (2 casas)`, resposta: arred(v / rr), unidade: 'A', passos: `I = ${v} ÷ ${rr} = **${br(v / rr)} A**` };
      } },
      { tipo: 'calc', id: 'potencia', titulo: 'Potência elétrica', formula: 'P = V × I', gerar: (r) => {
        const v = escolha(r, [127, 220]); const i = escolha(r, [2, 5, 10, 15, 20]);
        return { enunciado: `Um chuveiro ligado em ${v} V consome ${i} A. Qual a potência?`, resposta: v * i, unidade: 'W', passos: `${v} × ${i} = **${br(v * i)} W**` };
      } },
      { tipo: 'calc', id: 'consumo', titulo: 'Consumo e custo de energia', formula: 'custo = P × h × dias ÷ 1.000 × tarifa', gerar: (r) => {
        const p = escolha(r, [100, 1000, 1500, 4500, 5500]); const h = escolha(r, [0.5, 1, 2, 4, 8]); const d = 30; const t = escolha(r, [0.75, 0.8, 0.9, 1]);
        const kwh = (p * h * d) / 1000;
        return { enunciado: `Um equipamento de ${br(p)} W fica ligado ${br(h)} h por dia durante ${d} dias. Com tarifa de ${reais(t)}/kWh, qual o custo?`, resposta: kwh * t, unidade: 'R$', passos: `${br(p)} × ${br(h)} × ${d} ÷ 1.000 = ${br(kwh)} kWh; × ${reais(t)} = **${reais(kwh * t)}**` };
      } },
      { tipo: 'calc', id: 'resistores', titulo: 'Associação de resistores', formula: 'série: R₁ + R₂; paralelo: R₁R₂ ÷ (R₁ + R₂)', gerar: (r) => {
        const [a, b] = escolha(r, [[6, 3], [12, 6], [10, 10], [20, 30], [4, 12], [60, 30], [100, 25]]); const serie = r() < 0.4;
        return { enunciado: `Qual a resistência equivalente de ${a} Ω e ${b} Ω ligados em ${serie ? 'série' : 'paralelo'}?`, resposta: serie ? a + b : (a * b) / (a + b), unidade: 'Ω', passos: serie ? `${a} + ${b} = **${a + b} Ω**` : `${a} × ${b} ÷ (${a} + ${b}) = **${br((a * b) / (a + b))} Ω** (menor que o menor resistor).` };
      } },
      { tipo: 'classificar', id: 'unidades', titulo: 'Grandezas e unidades', pergunta: 'A grandeza é medida em:', categorias: ['Volt (V)', 'Ampère (A)', 'Ohm (Ω)', 'Watt (W)'], itens: [
        ['Tensão elétrica', 'Volt (V)'], ['Diferença de potencial (ddp)', 'Volt (V)'], ['Força eletromotriz de uma bateria', 'Volt (V)'],
        ['Intensidade de corrente', 'Ampère (A)'], ['Corrente nominal de um disjuntor', 'Ampère (A)'], ['Resistência elétrica', 'Ohm (Ω)'], ['Impedância', 'Ohm (Ω)'], ['Resistência de aterramento', 'Ohm (Ω)'],
        ['Potência elétrica', 'Watt (W)'], ['Potência dissipada por efeito Joule', 'Watt (W)'], ['Potência nominal de uma lâmpada', 'Watt (W)'],
      ] },
    ],
  },
};

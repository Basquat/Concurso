---
id: rl-geometria-matrizes
titulo: Raciocínio geométrico e matricial — áreas, matrizes e sistemas
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Perímetros, áreas e volumes, teorema de Pitágoras, operações com matrizes, determinantes e noções de sistemas lineares.
ordem: 11
busca: geometria área perímetro pitágoras volume matriz determinante sistema linear
---
# Áreas e volumes

| Figura | Área |
|---|---|
| Retângulo | b × h |
| Triângulo | b × h / 2 |
| Trapézio | (B + b) × h / 2 |
| Círculo | π r² (comprimento: 2πr) |

- Volume do paralelepípedo: a × b × c · do cilindro: π r² h · 1 m³ = **1.000 L**
- Ampliar lados em k multiplica a área por **k²** e o volume por **k³**

---

# Teorema de Pitágoras

- No triângulo retângulo: **a² = b² + c²** (a = hipotenusa)
- Ternas famosas: **3-4-5**, 6-8-10, 5-12-13
- Diagonal do quadrado de lado l: **l√2**

---

# Matrizes

- Matriz m × n: m linhas, n colunas · elemento aᵢⱼ (linha i, coluna j)
- **Soma**: mesma ordem, elemento a elemento
- **Produto A·B**: existe se **colunas de A = linhas de B**; resultado tem linhas de A × colunas de B; em geral **A·B ≠ B·A**
- **Determinante 2×2**: |a b; c d| = **ad − bc** · 3×3: regra de **Sarrus**
- Matriz **inversível** ⇔ det ≠ 0

---

# Sistemas lineares

- Sistema quadrado com **det ≠ 0** → possível e determinado (solução única)
- det = 0 → impossível ou indeterminado
- Na prova, costuma bastar **somar ou subtrair equações**:
  - x + y = 10 e x − y = 4 → 2x = 14 → **x = 7, y = 3**

::: quiz
? O determinante da matriz [[2, 3], [1, 4]] é:
- [ ] 11
- [x] 5
- [ ] −5
= 2·4 − 3·1 = 8 − 3 = 5.
:::

::: cartoes
Área do triângulo :: Base × altura ÷ 2.
Pitágoras :: a² = b² + c² (a = hipotenusa).
Determinante 2×2 :: ad − bc.
Condição do produto A·B :: Colunas de A = linhas de B.
1 m³ :: 1.000 litros.
Ampliação por k :: Área × k²; volume × k³.
:::

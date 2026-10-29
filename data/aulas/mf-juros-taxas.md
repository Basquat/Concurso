---
id: mf-juros-taxas
titulo: Juros simples, compostos e taxas
area: mat-financeira
disciplina: Matemática Financeira
cargos: todos
labs: mat-financeira
resumo: Capital, juros e montante; regimes simples e composto; taxas proporcionais, equivalentes, nominais, efetivas e reais; equivalência de capitais.
ordem: 1
busca: juros simples compostos capital montante taxa proporcional equivalente nominal efetiva real fisher capitalização valor presente valor futuro equivalência de capitais
---
# Conceitos

- **Capital** (C ou VP), **juros** (J), **montante** (M ou VF = C + J), **taxa** (i) e **prazo** (n) — sempre na **mesma unidade de tempo**
- **Simples**: juros sobre o capital **inicial** → crescimento **linear** (PA)
- **Compostos**: juros sobre o **montante** do período anterior → crescimento **exponencial** (PG)

---

# Fórmulas

| Regime | Montante | Juros |
|---|---|---|
| Simples | M = C·(1 + i·n) | J = C·i·n |
| Composto | **M = C·(1 + i)ⁿ** | J = M − C |

- Para n < 1 período, os juros simples superam os compostos; para n = 1, são iguais; para n > 1, compostos superam
- Valor presente: **C = M / (1 + i)ⁿ** (descapitalizar)

---

# Taxas

- **Proporcionais** (juros simples): 1% a.m. ↔ 12% a.a.
- **Equivalentes** (compostos): **(1 + iₐ) = (1 + iₘ)¹²** → 1% a.m. ≈ **12,68% a.a.**
- **Nominal**: período da taxa ≠ período de capitalização (ex.: 12% a.a. capitalizados mensalmente) → **efetiva** de 1% a.m.
- **Real** (Fisher): **(1 + n) = (1 + r)·(1 + π)**; rendimento de 10% com inflação de 4% → real ≈ **5,77%**

---

# Equivalência de capitais

- Dois fluxos são equivalentes se tiverem o **mesmo valor numa mesma data focal**
- Em juros compostos, qualquer data focal serve; em simples, a data focal muda o resultado
- Uso típico: comparar "à vista com desconto" x "parcelado sem juros"

::: quiz
? A taxa anual equivalente a 2% ao mês, em juros compostos, é:
- [ ] 24%
- [x] aproximadamente 26,82%
- [ ] 22%
- [ ] 12,68%
= 1,02¹² ≈ 1,2682.
:::

::: cartoes
Montante composto :: M = C(1 + i)ⁿ.
Juros simples :: J = C·i·n.
Taxa proporcional :: Juros simples: divide/multiplica pelo número de períodos.
Taxa equivalente :: Juros compostos: (1 + iₐ) = (1 + iₘ)¹².
Taxa real (Fisher) :: (1 + nominal) = (1 + real)(1 + inflação).
:::

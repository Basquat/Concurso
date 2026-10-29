---
id: est-probabilidade-inferencia
titulo: Probabilidade, distribuições e noções de inferência
area: estatistica
disciplina: Estatística
cargos: todos
labs: estatistica
resumo: Probabilidade condicional e independência, teorema de Bayes, distribuições binomial e normal, amostragem, correlação e regressão linear.
ordem: 2
busca: probabilidade condicional independência teorema de bayes distribuição binomial distribuição normal curva desvio padrão 68 95 99 amostragem aleatória estratificada sistemática conglomerados correlação regressão linear
---
# Probabilidade

- P(A) = favoráveis ÷ possíveis; 0 ≤ P ≤ 1; P(não A) = 1 − P(A)
- **União**: P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
- **Condicional**: P(A|B) = P(A ∩ B) / P(B)
- **Independentes**: P(A ∩ B) = P(A)·P(B)
- **Bayes**: inverte a condição — P(A|B) = P(B|A)·P(A) / P(B)

---

# Distribuições

- **Binomial**: n tentativas independentes, sucesso com probabilidade p → P(k) = C(n, k)·pᵏ·(1 − p)ⁿ⁻ᵏ; média **n·p**; variância **n·p·(1 − p)**
- **Normal**: simétrica em torno da média (média = mediana = moda)
  - ±1σ ≈ **68%** · ±2σ ≈ **95%** · ±3σ ≈ **99,7%**
  - Padronização: **z = (x − μ)/σ**

---

# Amostragem

| Técnica | Como |
|---|---|
| **Aleatória simples** | todos têm a mesma chance (sorteio) |
| **Sistemática** | a cada k elementos de uma lista |
| **Estratificada** | divide em grupos homogêneos (estratos) e sorteia em cada um |
| **Por conglomerados** | sorteia grupos inteiros (bairros, turmas) |

- Não probabilísticas: por conveniência, por cotas, intencional

---

# Correlação e regressão

- **Coeficiente de correlação de Pearson** r ∈ [−1, 1]: forte positiva perto de 1, forte negativa perto de −1, sem relação linear perto de 0
- **Correlação não implica causalidade**
- Regressão linear simples: y = a + b·x; **R²** mede a proporção da variação explicada

::: quiz
? Numa distribuição normal, aproximadamente qual porcentagem dos dados fica a até 2 desvios padrão da média?
- [ ] 50%
- [ ] 68%
- [x] 95%
- [ ] 99,7%
= Regra empírica 68-95-99,7.
:::

::: cartoes
Probabilidade condicional :: P(A|B) = P(A ∩ B) / P(B).
Eventos independentes :: P(A ∩ B) = P(A)·P(B).
Média e variância da binomial :: n·p e n·p·(1 − p).
Regra empírica da normal :: 68%, 95% e 99,7% em ±1, ±2 e ±3 desvios.
Amostragem estratificada :: Sorteio dentro de grupos homogêneos.
:::

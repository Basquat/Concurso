---
id: rl-probabilidade
titulo: Probabilidade
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Espaço amostral e evento, probabilidade simples, complementar, união, eventos independentes e probabilidade condicional.
ordem: 8
busca: probabilidade espaço amostral evento complementar união independentes condicional dados moeda
---
# Conceitos

- **Experimento aleatório**: resultado incerto (lançar dado, sortear servidor)
- **Espaço amostral (Ω)**: todos os resultados possíveis · **Evento**: subconjunto de Ω
- **P(A) = casos favoráveis / casos possíveis** (resultados igualmente prováveis)
- 0 ≤ P(A) ≤ 1 · evento impossível: 0 · evento certo: 1

---

# Regras

| Regra | Fórmula |
|---|---|
| Complementar | P(não A) = 1 − P(A) |
| União ("ou") | P(A ∪ B) = P(A) + P(B) − P(A ∩ B) |
| Mutuamente exclusivos | P(A ∪ B) = P(A) + P(B) |
| Independentes ("e") | P(A ∩ B) = P(A) × P(B) |
| Condicional (A dado B) | P(A ∩ B) ÷ P(B) |

---

# Exemplos resolvidos

- Dois dados, soma 7: (1,6) (2,5) (3,4) (4,3) (5,2) (6,1) → 6/36 = **1/6**
- Três moedas, pelo menos uma cara: 1 − P(nenhuma) = 1 − (1/2)³ = **7/8**
- Urna com 3 bolas azuis e 2 vermelhas, duas retiradas **sem reposição**, ambas azuis: 3/5 × 2/4 = **3/10**

::: quiz
? Sorteia-se um número de 1 a 20. Qual a probabilidade de ser múltiplo de 4?
- [ ] 1/5
- [x] 1/4
- [ ] 1/2
= Múltiplos de 4: 4, 8, 12, 16, 20 → 5/20 = 1/4.
:::

::: cartoes
Probabilidade clássica :: Favoráveis ÷ possíveis.
Pelo menos um :: 1 − P(nenhum).
Eventos independentes (e) :: Multiplica as probabilidades.
Mutuamente exclusivos (ou) :: Soma as probabilidades.
Condicional :: P(A|B) = P(A ∩ B) / P(B).
:::

---
id: rl-conjuntos
titulo: Teoria dos conjuntos e problemas com diagramas
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: União, interseção, diferença e complemento, número de subconjuntos e a fórmula da união para dois e três conjuntos.
ordem: 6
busca: conjuntos união interseção diferença complemento subconjuntos diagrama de venn problemas
---
# Operações

| Operação | Símbolo | Elementos |
|---|---|---|
| União | A ∪ B | estão em A **ou** em B |
| Interseção | A ∩ B | estão em A **e** em B |
| Diferença | A − B | estão em A e **não** em B |
| Complemento | Aᶜ | estão no universo e **não** em A |

- **Subconjunto**: A ⊂ B se todo elemento de A está em B · número de subconjuntos de um conjunto com n elementos: **2ⁿ**

---

# Fórmula da união

- **n(A ∪ B) = n(A) + n(B) − n(A ∩ B)**
- Três conjuntos: n(A ∪ B ∪ C) = n(A) + n(B) + n(C) − n(A∩B) − n(A∩C) − n(B∩C) + n(A∩B∩C)
- Dica: preencha o diagrama **de dentro para fora** (comece pela interseção de todos)

---

# Exemplo resolvido

- 100 servidores: 60 sabem Python, 50 sabem Java, 20 sabem os dois
- Só Python: 60 − 20 = **40** · só Java: 50 − 20 = **30**
- Pelo menos uma: 40 + 30 + 20 = **90** (ou 60 + 50 − 20)
- Nenhuma: 100 − 90 = **10**

::: quiz
? Um conjunto com 5 elementos tem quantos subconjuntos?
- [ ] 10
- [ ] 25
- [x] 32
= 2⁵ = 32 (inclui o vazio e o próprio conjunto).
:::

::: cartoes
n(A ∪ B) :: n(A) + n(B) − n(A ∩ B).
Número de subconjuntos :: 2ⁿ.
A − B :: Elementos de A que não estão em B.
Ordem para preencher Venn :: De dentro (interseção) para fora.
:::

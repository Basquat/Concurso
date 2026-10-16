---
id: rl-equivalencias
titulo: Equivalências lógicas e leis de De Morgan
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Contrapositiva, condicional como disjunção, De Morgan, negação da condicional e da bicondicional — as transformações que mais caem.
ordem: 2
busca: equivalência lógica de morgan contrapositiva negação condicional bicondicional
---
# Equivalência lógica

- Duas proposições são **equivalentes** (≡) quando têm a **mesma tabela-verdade**
- Na prova: a banca dá uma frase e pede "uma proposição equivalente" ou "a negação"
- Treine com símbolos: p, q, ¬ (não), ∧ (e), ∨ (ou), → (se… então), ↔ (se e somente se)

---

# As equivalências da condicional

| Forma | Equivale a | Exemplo (p: chove; q: levo guarda-chuva) |
|---|---|---|
| p → q | **¬q → ¬p** (contrapositiva) | Se não levo guarda-chuva, não chove |
| p → q | **¬p ∨ q** | Não chove ou levo guarda-chuva |
| p ↔ q | (p → q) ∧ (q → p) | Chove se e somente se levo guarda-chuva |

> [!atencao] Pegadinha
> **q → p** (recíproca) e **¬p → ¬q** (inversa) **não** são equivalentes a p → q.

---

# Leis de De Morgan

- **¬(p ∧ q) ≡ ¬p ∨ ¬q** — "Não é verdade que estudo e trabalho" ≡ "Não estudo **ou** não trabalho"
- **¬(p ∨ q) ≡ ¬p ∧ ¬q** — "Não é verdade que vou à praia ou ao cinema" ≡ "Não vou à praia **e** não vou ao cinema"
- Regra prática: **nega as duas** e **troca o conectivo** (e ↔ ou)

---

# Negações que mais caem

| Proposição | Negação |
|---|---|
| p ∧ q | ¬p ∨ ¬q |
| p ∨ q | ¬p ∧ ¬q |
| p → q | **p ∧ ¬q** ("acontece p **e** não acontece q") |
| p ↔ q | p ⊻ q (ou exclusivo): "ou p ou q" |
| Todo A é B | Algum A não é B |
| Nenhum A é B | Algum A é B |

::: quiz
? A negação de "Se o servidor faltar, então será advertido" é:
- [ ] Se o servidor não faltar, não será advertido.
- [x] O servidor falta e não é advertido.
- [ ] O servidor não falta ou é advertido.
= ¬(p → q) ≡ p ∧ ¬q. A primeira é a inversa; a terceira é equivalente à própria condicional.
:::

::: cartoes
Contrapositiva de p → q :: ¬q → ¬p (equivalente).
p → q como disjunção :: ¬p ∨ q.
Negação de p → q :: p ∧ ¬q.
De Morgan (e) :: ¬(p ∧ q) ≡ ¬p ∨ ¬q.
De Morgan (ou) :: ¬(p ∨ q) ≡ ¬p ∧ ¬q.
Negação de p ↔ q :: Ou p ou q (disjunção exclusiva).
:::

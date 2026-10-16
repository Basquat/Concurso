---
id: rl-proposicoes
titulo: Proposições, conectivos e tabelas-verdade
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs:
resumo: Proposições simples e compostas, conectivos, tabela-verdade, tautologia e as negações que mais caem.
ordem: 1
---
# Proposição

- Sentença declarativa que pode ser **V ou F** (nunca os dois)
- Não são proposições: perguntas, ordens, exclamações, sentenças abertas ("x > 3")

---

# Conectivos

| Conectivo | Símbolo | É falso quando |
|---|---|---|
| Conjunção (e) | p ∧ q | algum é F |
| Disjunção (ou) | p ∨ q | ambos F |
| Condicional (se…então) | p → q | **V → F** |
| Bicondicional (se e só se) | p ↔ q | valores diferentes |
| Disjunção exclusiva | p ⊻ q | valores iguais |

> [!memorize] Condicional
> "Vera Fischer é falsa": só V → F dá falso.

---

# Negações (De Morgan)

- ~(p ∧ q) ≡ ~p ∨ ~q
- ~(p ∨ q) ≡ ~p ∧ ~q
- ~(p → q) ≡ **p ∧ ~q**
- p → q ≡ ~q → ~p (contrapositiva) ≡ ~p ∨ q

::: quiz
? A negação de "Se estudo, então passo" é:
- [ ] Se não estudo, não passo
- [x] Estudo e não passo
- [ ] Não estudo ou passo
= ~(p → q) ≡ p ∧ ~q.
:::

::: cartoes
Quando p → q é falsa? :: Só quando p é V e q é F.
Negação de p ∧ q :: ~p ∨ ~q.
Negação de p → q :: p ∧ ~q.
Equivalente a p → q :: ~q → ~p ou ~p ∨ q.
:::

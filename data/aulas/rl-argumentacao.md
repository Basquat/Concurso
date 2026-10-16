---
id: rl-argumentacao
titulo: Argumentação lógica — validade e regras de inferência
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Premissas e conclusão, argumento válido × verdadeiro, modus ponens, modus tollens, silogismos e as falácias formais mais cobradas.
ordem: 3
busca: argumentação lógica validade premissas conclusão modus ponens modus tollens silogismo falácia
---
# Argumento

- **Premissas** (P1, P2…) ⇒ **conclusão** (C)
- **Válido**: se todas as premissas forem verdadeiras, a conclusão **obrigatoriamente** é verdadeira
- Validade é questão de **forma**, não de conteúdo: um argumento pode ser válido com premissas falsas

> [!prova] Método
> Assuma todas as premissas como **verdadeiras**. Comece pela premissa simples (sem conectivo) e propague os valores.

---

# Regras de inferência válidas

| Regra | Forma |
|---|---|
| Modus ponens | p → q; p ∴ q |
| Modus tollens | p → q; ¬q ∴ ¬p |
| Silogismo hipotético | p → q; q → r ∴ p → r |
| Silogismo disjuntivo | p ∨ q; ¬p ∴ q |
| Simplificação / conjunção | p ∧ q ∴ p · p; q ∴ p ∧ q |

---

# Falácias formais (inválidas)

- **Afirmação do consequente**: p → q; q ∴ p ✗ — "Se chove, a rua molha. A rua está molhada. Logo, choveu." (pode ter sido um caminhão-pipa)
- **Negação do antecedente**: p → q; ¬p ∴ ¬q ✗ — "Se chove, a rua molha. Não choveu. Logo, a rua não está molhada."

---

# Exemplo resolvido

- P1: Se Ana estuda, passa. · P2: Se passa, toma posse. · P3: Ana não tomou posse.
- P3 é simples: "não tomou posse" = V
- P2 (passa → posse) com posse F → **passa = F** (modus tollens)
- P1 (estuda → passa) com passa F → **estuda = F**
- Conclusão válida: **Ana não estudou**

::: quiz
? "Se o sistema cair, o setor para. O setor parou." Conclui-se validamente que:
- [ ] O sistema caiu.
- [ ] O sistema não caiu.
- [x] Nada se pode concluir sobre o sistema.
= Afirmar o consequente é falácia: o setor pode ter parado por outro motivo.
:::

::: cartoes
Argumento válido :: Premissas verdadeiras garantem a conclusão verdadeira.
Modus ponens :: p → q; p; logo q.
Modus tollens :: p → q; ¬q; logo ¬p.
Silogismo disjuntivo :: p ∨ q; ¬p; logo q.
Afirmação do consequente :: p → q; q; logo p — inválido.
Negação do antecedente :: p → q; ¬p; logo ¬q — inválido.
:::

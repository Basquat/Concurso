---
id: rl-quantificadores
titulo: Lógica de primeira ordem — quantificadores e suas negações
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Quantificador universal e existencial, proposições categóricas (todo, algum, nenhum) e como negá-las sem cair nas pegadinhas.
ordem: 4
busca: lógica de primeira ordem quantificador universal existencial todo algum nenhum negação
---
# Sentença aberta e quantificadores

- "x > 3" não é proposição (não tem valor lógico) — é **sentença aberta**
- Vira proposição com **quantificador**:
  - **Universal ∀** ("para todo"): ∀x (x² ≥ 0) — verdadeira nos reais
  - **Existencial ∃** ("existe pelo menos um"): ∃x (x + 2 = 5) — verdadeira

---

# Proposições categóricas

| Tipo | Forma | Exemplo |
|---|---|---|
| A — universal afirmativa | Todo A é B | Todo servidor é concursado |
| E — universal negativa | Nenhum A é B | Nenhum estagiário é servidor |
| I — particular afirmativa | Algum A é B | Algum técnico é analista |
| O — particular negativa | Algum A não é B | Algum técnico não é analista |

---

# Negações

- ¬(**∀x** P(x)) ≡ **∃x** ¬P(x): "Não é verdade que todo servidor é pontual" ≡ "**Algum** servidor **não** é pontual"
- ¬(**∃x** P(x)) ≡ **∀x** ¬P(x): "Não existe servidor imortal" ≡ "**Nenhum** (todo… não) servidor é imortal"
- Pares contraditórios: **Todo × Algum… não** · **Nenhum × Algum**

> [!atencao] Erro clássico
> A negação de "Todo A é B" **não** é "Nenhum A é B". Basta **um** contraexemplo para derrubar o "todo".

---

# Na prova

- "Pelo menos um", "existe", "há" = **algum**
- "Qualquer", "cada" = **todo**
- "Não há quem…" = nenhum
- Para negar, troque o quantificador **e** negue o predicado

::: quiz
? A negação de "Todos os processos foram arquivados" é:
- [ ] Nenhum processo foi arquivado.
- [x] Pelo menos um processo não foi arquivado.
- [ ] Todos os processos não foram arquivados.
= ¬∀ ≡ ∃¬: basta um processo não arquivado.
:::

::: cartoes
Negação de "Todo A é B" :: Algum A não é B.
Negação de "Algum A é B" :: Nenhum A é B.
Negação de "Nenhum A é B" :: Algum A é B.
Quantificador universal :: ∀ — "para todo", "qualquer".
Quantificador existencial :: ∃ — "existe", "algum", "pelo menos um".
:::

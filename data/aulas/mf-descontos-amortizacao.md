---
id: mf-descontos-amortizacao
titulo: Descontos, séries de pagamentos e amortização
area: mat-financeira
disciplina: Matemática Financeira
cargos: todos
labs: mat-financeira
resumo: Desconto racional e comercial, rendas certas (séries uniformes), sistemas SAC e Price, VPL e TIR para decisão de investimentos.
ordem: 2
busca: desconto racional comercial por dentro por fora valor nominal valor atual série uniforme prestação sistema de amortização constante sac tabela price vpl valor presente líquido tir taxa interna de retorno payback
---
# Descontos simples

| Tipo | Base | Fórmula |
|---|---|---|
| **Comercial** (por fora, bancário) | valor **nominal** N | D = N·d·n |
| **Racional** (por dentro) | valor **atual** A | D = A·i·n, com A = N/(1 + i·n) |

- O desconto **comercial** é **maior** que o racional para as mesmas taxa e prazo
- Desconto composto racional: A = N/(1 + i)ⁿ

---

# Séries uniformes e Price

- Prestação constante (**Tabela Price**): **PMT = PV · i / [1 − (1 + i)⁻ⁿ]**
- Na Price, os **juros** de cada parcela caem e a **amortização** cresce
- No Excel/Calc: **=PGTO(taxa; nper; vp)**

---

# SAC x Price

| | SAC | Price |
|---|---|---|
| Amortização | **constante** = PV/n | crescente |
| Prestação | **decrescente** | **constante** |
| Juros | decrescentes | decrescentes |
| 1ª prestação | maior | menor |
| Total de juros | **menor** | maior |

- SAC: P₁ = PV/n + PV·i; cada prestação seguinte cai **A·i**

---

# VPL e TIR

- **VPL** = soma dos fluxos trazidos a valor presente − investimento inicial → **VPL > 0: aceitar** o projeto
- **TIR**: taxa que **zera o VPL** → aceitar se TIR > taxa mínima de atratividade (TMA)
- **Payback**: tempo para recuperar o investimento (simples ou descontado)

::: quiz
? Financiamento de R$ 12.000 pelo SAC em 12 meses a 1% a.m. A primeira prestação é:
- [ ] R$ 1.000,00
- [x] R$ 1.120,00
- [ ] R$ 1.066,19
- [ ] R$ 1.200,00
= Amortização 1.000 + juros 120 (1% de 12.000).
:::

::: cartoes
Desconto comercial :: D = N·d·n, calculado sobre o valor nominal.
Prestação Price :: PMT = PV·i / [1 − (1 + i)⁻ⁿ].
SAC :: Amortização constante e prestações decrescentes.
VPL positivo :: O projeto cria valor: aceitar.
TIR :: Taxa que torna o VPL igual a zero.
:::

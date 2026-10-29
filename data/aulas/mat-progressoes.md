---
id: mat-progressoes
titulo: Sequências e progressões aritmética e geométrica
area: matematica
disciplina: Matemática
cargos: todos
labs: algebra
resumo: Termo geral e soma da PA e da PG, propriedades, PG infinita e como reconhecer cada uma em problemas.
ordem: 4
busca: sequências progressão aritmética termo geral razão soma dos termos progressão geométrica soma pg infinita termo médio
---
# Progressão aritmética (PA)

- Cada termo = anterior **+ r** (razão constante)
- Termo geral: **aₙ = a₁ + (n − 1)·r**
- Soma: **Sₙ = (a₁ + aₙ)·n / 2**
- Termo do meio é a **média** dos vizinhos: em (a, b, c), b = (a + c)/2
- Exemplo: soma de 1 a 100 = (1 + 100) × 100 / 2 = **5.050**

---

# Progressão geométrica (PG)

- Cada termo = anterior **× q** (razão constante)
- Termo geral: **aₙ = a₁·qⁿ⁻¹**
- Soma finita: **Sₙ = a₁·(qⁿ − 1)/(q − 1)**
- PG infinita com |q| < 1: **S = a₁ / (1 − q)**
- Termo do meio é a **média geométrica**: b² = a·c

---

# Como reconhecer

| Problema | Progressão |
|---|---|
| "aumenta **R$ 50 por mês**", "fileiras com 2 cadeiras a mais" | **PA** (soma constante) |
| "**dobra** a cada hora", "cresce **10% ao ano**" | **PG** (multiplica) |
| Juros **simples** | PA |
| Juros **compostos** | PG |

::: quiz
? Uma cultura de bactérias dobra a cada hora, começando com 100. Após 5 horas haverá:
- [ ] 1.000
- [x] 3.200
- [ ] 1.600
- [ ] 500
= PG com a₁ = 100 e q = 2: após 5 horas, 100 × 2⁵ = 3.200.
:::

::: cartoes
Termo geral da PA :: aₙ = a₁ + (n − 1)r.
Soma da PA :: (a₁ + aₙ)·n/2.
Termo geral da PG :: aₙ = a₁·qⁿ⁻¹.
Soma da PG infinita :: a₁/(1 − q), com |q| < 1.
Juros compostos formam :: Uma progressão geométrica.
:::

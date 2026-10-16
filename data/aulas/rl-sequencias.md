---
id: rl-sequencias
titulo: Raciocínio sequencial, espacial e temporal
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Sequências numéricas (PA e PG), alfanuméricas e de figuras, calendários e dias da semana, relógios e orientação espacial.
ordem: 9
busca: sequência numérica progressão aritmética geométrica série alfanumérica calendário dia da semana orientação espacial
---
# Como atacar uma sequência

- Teste nesta ordem: **diferença constante** (PA) → **razão constante** (PG) → diferenças das diferenças → **duas sequências intercaladas** → posição no alfabeto
- Exemplo: 2, 5, 11, 23, … → cada termo = anterior × 2 + 1 → **47**
- Letras: A(1) C(3) F(6) J(10) → diferenças 2, 3, 4 → próxima +5 → **O(15)**

---

# Progressões

| | PA | PG |
|---|---|---|
| Termo geral | aₙ = a₁ + (n − 1)·r | aₙ = a₁ · qⁿ⁻¹ |
| Soma | Sₙ = (a₁ + aₙ)·n / 2 | Sₙ = a₁ (qⁿ − 1)/(q − 1) |
| Exemplo | 3, 7, 11… → a₁₀ = 39 | 2, 6, 18… → a₅ = 162 |

---

# Raciocínio temporal

- Dias da semana repetem a cada **7**: use o **resto da divisão por 7**
  - Hoje é segunda; daqui a **100** dias: 100 = 14×7 + 2 → **quarta-feira**
- Ano comum: 365 dias = 52 semanas + 1 dia → a mesma data cai **um dia da semana depois** no ano seguinte (dois, se houver 29/02 no meio)
- Relógio: ponteiro das horas anda **0,5° por minuto**; dos minutos, **6° por minuto**

---

# Orientação espacial

- Giros: 90° à direita a partir do norte → leste; 180° → sul
- Faces opostas de dado comum somam **7**
- Em vistas e planificações, siga uma face de referência e conte as dobras

::: quiz
? Qual é o próximo termo de 1, 4, 9, 16, 25, …?
- [ ] 30
- [x] 36
- [ ] 49
= Quadrados perfeitos: 6² = 36 (diferenças 3, 5, 7, 9, 11).
:::

::: cartoes
Termo geral da PA :: aₙ = a₁ + (n − 1)r.
Termo geral da PG :: aₙ = a₁ · qⁿ⁻¹.
Dia da semana daqui a n dias :: Use o resto de n ÷ 7.
Faces opostas de um dado :: Somam 7.
Ponteiro das horas :: 0,5° por minuto (30° por hora).
:::

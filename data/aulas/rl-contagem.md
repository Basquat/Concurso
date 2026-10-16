---
id: rl-contagem
titulo: Princípios de contagem e análise combinatória
area: logica
disciplina: Raciocínio Lógico
cargos: 206, 402
labs: logica
resumo: Princípio multiplicativo e aditivo, fatorial, permutações (simples, com repetição e circular), arranjos e combinações — quando a ordem importa.
ordem: 7
busca: análise combinatória princípio fundamental da contagem permutação arranjo combinação anagrama fatorial
---
# Princípio fundamental da contagem

- **Multiplicativo** ("e"): etapas sucessivas → multiplique. 3 camisas **e** 4 calças = 3 × 4 = **12** combinações
- **Aditivo** ("ou"): casos que se excluem → some. Ir de ônibus (3 linhas) **ou** metrô (2 linhas) = **5** opções
- **Fatorial**: n! = n × (n−1) × … × 1; **0! = 1**

---

# Permutações

- **Simples** (todos os elementos, ordem importa): **Pₙ = n!** — anagramas de BRASIL: 6! = **720**
- **Com repetição**: n! / (a! b! …) — anagramas de ARARA: 5! / (3! 2!) = **10**
- **Circular** (n pessoas em volta de uma mesa): **(n − 1)!**

---

# Arranjo × combinação

- A pergunta-chave: **trocar a ordem gera um resultado diferente?**
  - Sim → **arranjo**: A(n, p) = n! / (n − p)!
  - Não → **combinação**: C(n, p) = n! / [p! (n − p)!]
- Presidente e vice entre 7 pessoas (ordem importa): A(7, 2) = 7 × 6 = **42**
- Comissão de 3 entre 7 (ordem não importa): C(7, 3) = 35

---

# Estratégias

- **Restrição primeiro**: trate antes as posições com condição ("começar por vogal")
- **Elementos juntos**: amarre-os num bloco e permute o bloco por dentro
- **Complementar**: "pelo menos um" = total − nenhum

::: quiz
? De quantas maneiras se escolhem 2 servidores entre 6 para uma tarefa conjunta (sem distinção de funções)?
- [ ] 30
- [x] 15
- [ ] 12
= Ordem não importa: C(6,2) = 6×5/2 = 15.
:::

::: cartoes
Ordem importa :: Arranjo (ou permutação).
Ordem não importa :: Combinação.
C(n, p) :: n! / [p!(n − p)!].
Anagramas com letras repetidas :: n! dividido pelo fatorial das repetições.
Permutação circular :: (n − 1)!.
0! :: 1.
:::

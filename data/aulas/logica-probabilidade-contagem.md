---
id: logica-probabilidade-contagem
titulo: Contagem, combinações e probabilidade
area: logica
disciplina: Raciocínio Lógico
tags: contagem, combinatória, probabilidade
cargos: 206, 402
labs: logica
resumo: Use princípio multiplicativo, permutação, arranjo e combinação para contar casos e calcular probabilidades simples e condicionais.
nivel: intermediario
ordem: 13
duracao: 45
busca: análise combinatória princípio multiplicativo permutação arranjo combinação probabilidade condicional
---
# Contagem começa pela estrutura

Antes de aplicar fórmula, pergunte se a ordem importa, se há repetição e se todos os resultados são igualmente prováveis. Um diagrama de etapas pode esclarecer o problema e revelar restrições que uma fórmula isolada esconderia.

Pelo princípio multiplicativo, se uma tarefa tem etapas independentes com m e n escolhas, há m × n resultados possíveis. Se uma etapa depende da anterior, determine as opções válidas em cada ramo em vez de multiplicar indiscriminadamente.

---
# Permutações, arranjos e combinações

- **Permutação simples:** ordenar todos os n elementos distintos: n!.
- **Arranjo:** selecionar k elementos distintos e considerar a ordem: n!/(n−k)!.
- **Combinação:** selecionar k elementos sem considerar ordem: n!/[k!(n−k)!].

Anagramas com elementos repetidos exigem dividir pelo fatorial das multiplicidades. Em seleção de comissão, a ordem costuma não importar; em cargos diferentes ou pódio, ela pode ser essencial.

::: quiz
? De um grupo de 8 pessoas, quantas comissões distintas de 3 podem ser formadas, sem cargos diferentes?
- [x] 56
- [ ] 336
- [ ] 512
- [ ] 512
= A ordem não importa: C(8,3) = 8!/(3!·5!) = 56.
:::

---
# Probabilidade clássica

Quando os resultados elementares são equiprováveis, P(A) = casos favoráveis ÷ casos possíveis. A probabilidade está entre 0 e 1; evento impossível tem probabilidade 0 e evento certo tem probabilidade 1.

O complementar simplifica contagens: P(não A) = 1 − P(A). Para “pelo menos um”, muitas vezes é mais simples calcular 1 menos a probabilidade de nenhum.

---
# União, interseção e independência

P(A ∪ B) = P(A) + P(B) − P(A ∩ B). A interseção evita contar duas vezes resultados comuns. Se A e B são mutuamente exclusivos, a interseção é vazia; exclusividade não é a mesma coisa que independência.

Eventos independentes satisfazem P(A ∩ B) = P(A)P(B). A independência deve ser justificada pelo modelo; retirar cartas sem reposição, por exemplo, geralmente altera a probabilidade da próxima retirada.

---
# Probabilidade condicional

P(A|B) = P(A ∩ B)/P(B), para P(B) > 0. A condição restringe o espaço aos casos em que B ocorreu. Uma tabela de dupla entrada ajuda a separar o total da população do subconjunto condicionado.

Cuidado com a inversão: P(A|B) não é automaticamente igual a P(B|A). Em problemas de teste diagnóstico, a prevalência da condição interfere no valor preditivo de um resultado positivo.

---
# Método de resolução e checagem

- Defina o espaço amostral e verifique equiprobabilidade.
- Registre restrições e se a ordem importa.
- Conte favoráveis e possíveis com a mesma regra.
- Use complementar, união ou condição somente quando apropriado.
- Confira se o resultado está entre 0 e 1 e se combina com a intuição.

::: cartoes
Princípio multiplicativo :: Multiplique as quantidades de opções por etapa quando cada combinação entre etapas for válida.
Combinação :: Seleção em que a ordem dos elementos não importa: C(n,k) = n!/[k!(n−k)!].
Arranjo :: Seleção em que a ordem importa: A(n,k) = n!/(n−k)!.
Probabilidade complementar :: P(não A) = 1 − P(A).
União de dois eventos :: P(A∪B) = P(A)+P(B)−P(A∩B).
Probabilidade condicional :: P(A|B) = P(A∩B)/P(B), se P(B)>0.
:::

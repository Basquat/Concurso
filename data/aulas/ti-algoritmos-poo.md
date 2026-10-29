---
id: ti-algoritmos-poo
titulo: Algoritmos, estruturas de dados e orientação a objetos
area: ti
disciplina: Tecnologia da Informação
cargos: 206, 402
labs: code, eng-software
resumo: Complexidade (Big O), pilhas, filas, listas, árvores e hash, algoritmos de busca e ordenação, e os pilares da programação orientada a objetos.
ordem: 14
busca: algoritmos complexidade big o pilha lifo fila fifo lista encadeada árvore binária tabela hash busca binária ordenação bubble merge quick orientação a objetos classe objeto encapsulamento herança polimorfismo abstração interface
---
# Complexidade (Big O)

| Ordem | Exemplo |
|---|---|
| **O(1)** | acesso a posição de vetor; busca em tabela hash (média) |
| **O(log n)** | **busca binária** em vetor ordenado |
| **O(n)** | busca sequencial |
| **O(n log n)** | **merge sort**; quicksort (caso médio) |
| **O(n²)** | **bubble sort**, insertion sort, selection sort |

---

# Estruturas de dados

- **Pilha** (stack): **LIFO** — último a entrar, primeiro a sair (desfazer, chamadas de função)
- **Fila** (queue): **FIFO** — primeiro a entrar, primeiro a sair (atendimento, impressão)
- **Lista encadeada**: inserção/remoção O(1) com o ponteiro, acesso O(n)
- **Árvore binária de busca**: à esquerda os menores, à direita os maiores; busca O(log n) se balanceada
- **Tabela hash**: chave → posição por função de hash; trata colisões

---

# Orientação a objetos

- **Classe** (molde) e **objeto** (instância)
- **Encapsulamento**: esconder o estado interno e expor métodos (modificadores private/public)
- **Herança**: subclasse reaproveita e especializa a superclasse ("é um")
- **Polimorfismo**: mesma chamada, comportamentos diferentes (sobrescrita/override; sobrecarga/overload)
- **Abstração**: modelar só o essencial; **interfaces** e classes abstratas definem contratos

---

# Boas práticas

- **SOLID**: responsabilidade única, aberto/fechado, substituição de Liskov, segregação de interfaces, inversão de dependência
- Prefira **composição** a herança quando o vínculo for "tem um"
- Coesão **alta** e acoplamento **baixo**

::: quiz
? A estrutura de dados adequada para implementar a função "desfazer" de um editor é a:
- [x] pilha (LIFO)
- [ ] fila (FIFO)
- [ ] tabela hash
- [ ] árvore B
= A última ação feita é a primeira a ser desfeita.
:::

::: cartoes
Busca binária :: O(log n), exige vetor ordenado.
Pilha :: LIFO (último a entrar, primeiro a sair).
Fila :: FIFO (primeiro a entrar, primeiro a sair).
Polimorfismo :: Mesma interface, comportamentos diferentes.
Encapsulamento :: Esconder o estado interno e expor operações controladas.
:::

---
id: ti-arquitetura-logica
titulo: Arquitetura de computadores, bases numéricas, lógica digital e algoritmos
area: ti
disciplina: Fundamentos de computação
cargos: 402, 206
labs: code
resumo: Von Neumann, ciclo de instrução, RISC x CISC, multicore, hierarquia de memória e barramentos; conversão de bases, álgebra de Boole, portas lógicas, algoritmos e fluxogramas.
ordem: 6
busca: arquitetura de computadores von neumann risc cisc multicore cache barramento binário hexadecimal conversão álgebra de boole portas lógicas nand xor fluxograma algoritmo
---
# Organização do computador

- **Von Neumann**: dados e instruções na **mesma memória** · **Harvard**: memórias separadas (comum em microcontroladores e caches L1)
- Ciclo de instrução: **busca → decodificação → execução** (→ escrita)
- **RISC** (poucas instruções simples, tamanho fixo, muitos registradores — ARM) × **CISC** (instruções complexas e variáveis — x86)
- **Multicore**: vários núcleos no mesmo chip; **SMT/Hyper-Threading**: duas threads por núcleo

---

# Memória e barramentos

- Hierarquia (mais rápida e cara → mais lenta e barata): **registradores → cache L1/L2/L3 → RAM → SSD → HD**
- **Localidade** temporal e espacial explica a eficiência da cache
- Barramentos: **dados**, **endereço** (define quanto se endereça: 32 bits → 4 GiB) e **controle**
- Desempenho: frequência (GHz), IPC, núcleos, cache; **Lei de Amdahl** limita o ganho do paralelismo

---

# Bases numéricas

| Decimal | Binário | Hexadecimal |
|---|---|---|
| 10 | 1010 | A |
| 15 | 1111 | F |
| 42 | 0010 1010 | 2A |
| 255 | 1111 1111 | FF |

- Binário → decimal: some as potências de 2 dos bits 1 — 1011₂ = 8 + 2 + 1 = **11**
- Binário ↔ hexa: agrupe de **4 em 4** bits · binário ↔ octal: de **3 em 3**
- **Complemento de 2**: inverta os bits e some 1 (representa negativos)

---

# Álgebra de Boole e portas

| A | B | AND | OR | XOR | NAND | NOR |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 | 0 |
| 1 | 0 | 0 | 1 | 1 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 | 0 |

- **NAND** e **NOR** são **universais** (montam qualquer circuito) · De Morgan: (A·B)' = A' + B'
- Simplificações: A + A·B = A · A + A' = 1 · A·A' = 0

---

# Algoritmos e fluxogramas

- Estruturas: **sequência**, **decisão** (se/senão, escolha-caso) e **repetição** (enquanto, para, **repita… até** — este executa **ao menos uma vez**)
- Fluxograma: **elipse** (início/fim) · **retângulo** (processo) · **losango** (decisão) · **paralelogramo** (entrada/saída)
- Complexidade: busca linear **O(n)**, busca binária **O(log n)** (lista ordenada), ordenação por comparação eficiente **O(n log n)**
- Estruturas de dados: **pilha** (LIFO), **fila** (FIFO), lista, árvore, grafo, tabela hash

::: quiz
? O número hexadecimal 3F corresponde, em decimal, a:
- [ ] 36
- [x] 63
- [ ] 315
= 3 × 16 + 15 = 63.
:::

::: cartoes
Von Neumann :: Dados e instruções na mesma memória.
RISC × CISC :: Instruções simples e fixas × complexas e variáveis.
Hierarquia de memória :: Registradores, cache, RAM, SSD, HD.
Binário → hexa :: Agrupar de 4 em 4 bits.
Portas universais :: NAND e NOR.
XOR :: 1 quando as entradas são diferentes.
Repita… até :: Executa o bloco pelo menos uma vez.
Pilha × fila :: LIFO × FIFO.
:::

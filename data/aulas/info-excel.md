---
id: info-excel
titulo: Excel — fundamentos, referências e fórmulas
area: informatica
disciplina: Noções de Informática
cargos: todos
labs: planilha
resumo: Células e intervalos, operadores e precedência, referências relativas, absolutas e mistas, alça de preenchimento, formatação e mensagens de erro.
ordem: 9
busca: excel planilha célula intervalo referência relativa absoluta mista cifrão operadores erros div/0 n/d
---
# Estrutura

- Pasta de trabalho (.xlsx) → **planilhas** (abas) → **células** (coluna + linha: B3)
- **Intervalo**: `A1:B5` (de A1 até B5) · `A1;B5` (só as duas células)
- Toda fórmula começa com **=** (também aceita + ou −)
- Referência a outra planilha: `=Plan2!A1`

---

# Operadores e precedência

| Ordem | Operador |
|---|---|
| 1 | − (negação) |
| 2 | % (percentual) |
| 3 | ^ (potência) |
| 4 | * e / |
| 5 | + e − |
| 6 | & (concatenar texto) |
| 7 | = < > <= >= <> (comparação) |

- `=2+3*2^2` → 2 + 3 × 4 = **14** · parênteses mudam a ordem

---

# Referências

- **Relativa** (`A1`): ajusta ao copiar
- **Absoluta** (`$A$1`): fixa linha e coluna
- **Mista** (`$A1` ou `A$1`): fixa só o que tem **$**
- **F4** alterna entre os tipos
- Exemplo: `=A1*$B$1` em C1, copiada para **D2** → `=B2*$B$1` (andou 1 coluna e 1 linha; o absoluto não muda)

---

# Erros comuns

| Erro | Causa |
|---|---|
| #DIV/0! | divisão por zero |
| #N/D | valor não disponível (ex.: PROCV não encontrou) |
| #NOME? | nome de função ou texto não reconhecido |
| #REF! | referência inválida (célula excluída) |
| #VALOR! | tipo de dado errado (texto em conta) |
| ##### | coluna estreita para o número |

::: quiz
? A fórmula =$A1+B$1, digitada em C3 e copiada para D5, torna-se:
- [ ] =$A1+C$1
- [x] =$A3+C$1
- [ ] =$B3+C$1
= Desloca 1 coluna e 2 linhas: $A1 mantém A e vira linha 3; B$1 vira C e mantém linha 1.
:::

::: cartoes
$A$1 :: Referência absoluta (linha e coluna fixas).
A$1 :: Mista: fixa só a linha.
F4 :: Alterna os tipos de referência.
#DIV/0! :: Divisão por zero.
#N/D :: Valor não disponível (busca sem resultado).
Operador & :: Concatena textos.
:::

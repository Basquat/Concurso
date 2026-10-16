---
id: info-excel-funcoes
titulo: Excel — funções mais cobradas
area: informatica
disciplina: Noções de Informática
cargos: todos
labs: planilha
resumo: SOMA, MÉDIA, MÁXIMO, CONT.NÚM, CONT.VALORES, SE com E/OU, CONT.SE, SOMASE, PROCV e PROCX, datas e textos, além de classificar, filtrar e gráficos.
ordem: 10
busca: excel funções soma média se cont.se somase procv procx cont.valores cont.núm filtro gráfico
---
# Funções básicas

| Função | Faz |
|---|---|
| SOMA(A1:A10) | soma |
| MÉDIA(A1:A10) | média (ignora vazias e texto) |
| MÁXIMO / MÍNIMO | maior / menor valor |
| MAIOR(int; k) / MENOR(int; k) | k-ésimo maior / menor |
| CONT.NÚM(int) | conta células com **números** |
| CONT.VALORES(int) | conta células **não vazias** |
| CONTAR.VAZIO(int) | conta vazias |
| ARRED(x; n) | arredonda com n casas |

---

# Lógicas e condicionais

- **SE**(teste; se_verdadeiro; se_falso): `=SE(B2>=7;"Aprovado";"Reprovado")`
- **E** (todas verdadeiras) / **OU** (pelo menos uma): `=SE(E(B2>=7;C2>=75%);"Ok";"Não")`
- **CONT.SE**(intervalo; critério): `=CONT.SE(D:D;"Deferido")`
- **SOMASE**(intervalo; critério; [intervalo_soma]): `=SOMASE(A:A;"STI";C:C)`
- Versões com vários critérios: **CONT.SES**, **SOMASES**, **MÉDIASES**

---

# Busca

- **PROCV**(valor; tabela; nº_coluna; **FALSO**): procura na **1ª coluna** da tabela e devolve a coluna indicada; FALSO = correspondência **exata**
  - `=PROCV("206";A2:D30;3;FALSO)`
- **PROCH**: o mesmo, na horizontal
- **PROCX** (Microsoft 365): procura em qualquer coluna e devolve de qualquer coluna, exata por padrão — `=PROCX(F2;A:A;C:C)`

---

# Datas, textos e dados

- **HOJE()** (data) · **AGORA()** (data e hora) · datas são números (dá para subtrair)
- **CONCAT** / **&**, **ESQUERDA**, **DIREITA**, **EXT.TEXTO**, **MAIÚSCULA**, **ARRUMAR** (remove espaços extras)
- **Classificar** e **Filtrar** (guia Dados), **Formatação Condicional**, **Tabela Dinâmica**, **Gráficos** (coluna, linha, pizza)

::: quiz
? Para contar quantos processos na coluna D têm o status "Deferido", usa-se:
- [ ] =SOMASE(D:D;"Deferido")
- [x] =CONT.SE(D:D;"Deferido")
- [ ] =CONT.VALORES(D:D;"Deferido")
= CONT.SE conta as células que atendem ao critério.
:::

::: cartoes
CONT.NÚM × CONT.VALORES :: Números × qualquer célula não vazia.
PROCV com FALSO :: Busca exata na primeira coluna da tabela.
SOMASE :: Soma o que atende a um critério (intervalo; critério; intervalo_soma).
SE :: SE(teste; valor_se_verdadeiro; valor_se_falso).
E × OU :: E exige todas verdadeiras; OU, pelo menos uma.
HOJE() :: Data atual.
:::

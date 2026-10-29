---
id: ti-testes-qualidade
titulo: Testes de software, qualidade e métodos ágeis
area: ti
disciplina: Tecnologia da Informação
cargos: 206, 402
labs: eng-software, code, scrum
resumo: Níveis e tipos de teste, caixa-branca e caixa-preta, TDD e BDD, pirâmide de testes, métricas de qualidade (ISO 25010), Scrum, Kanban e XP.
ordem: 18
busca: testes de software unitário integração sistema aceitação regressão caixa branca caixa preta tdd bdd pirâmide de testes cobertura iso 25010 qualidade scrum papéis eventos artefatos kanban wip xp programação em pares integração contínua
---
# Níveis e técnicas de teste

- Níveis: **unidade** → **integração** → **sistema** → **aceitação** (homologação)
- **Regressão**: reexecutar testes após mudanças
- **Caixa-branca**: baseia-se no **código** (cobertura de comandos e desvios)
- **Caixa-preta**: baseia-se na **especificação** (partição de equivalência, valor-limite)
- **Pirâmide de testes**: muitos unitários, menos de integração, poucos de interface

---

# TDD e BDD

- **TDD**: escrever o teste **antes** do código — ciclo **vermelho → verde → refatorar**
- **BDD**: comportamento descrito em linguagem de negócio (**Dado / Quando / Então**)
- **Integração contínua**: cada mudança é integrada e testada automaticamente

---

# Qualidade de produto (ISO/IEC 25010)

- Características: **adequação funcional**, **eficiência de desempenho**, **compatibilidade**, **usabilidade**, **confiabilidade**, **segurança**, **manutenibilidade** e **portabilidade**
- Defeito x falha: o **defeito** está no código; a **falha** é o comportamento incorreto observado

---

# Ágil

- **Manifesto ágil**: indivíduos e interações, software funcionando, colaboração com o cliente, responder a mudanças
- **Scrum**: Product Owner (prioriza o backlog), Scrum Master (remove impedimentos, facilita), Desenvolvedores; sprint, planning, daily, review, retrospectiva
- **Kanban**: fluxo visual e **limite de WIP**; métricas de lead time e throughput
- **XP**: programação em **pares**, TDD, refatoração, entregas pequenas e frequentes

::: quiz
? No TDD, a ordem do ciclo de desenvolvimento é:
- [ ] código, teste, deploy
- [x] teste que falha, código mínimo para passar, refatoração
- [ ] refatoração, teste, código
- [ ] especificação, implantação, teste
= Vermelho, verde e refatorar.
:::

::: cartoes
Caixa-preta :: Testes baseados na especificação, sem olhar o código.
Valor-limite :: Testar nas bordas das faixas válidas.
TDD :: Vermelho → verde → refatorar.
Defeito x falha :: Defeito no código; falha é o comportamento incorreto observado.
Product Owner :: Responsável por priorizar o backlog do produto.
:::

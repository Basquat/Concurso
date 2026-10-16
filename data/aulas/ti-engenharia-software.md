---
id: ti-engenharia-software
titulo: Engenharia de software — processos, requisitos, UML, padrões, testes e ágeis
area: ti
disciplina: Engenharia de software
cargos: 402, 206
labs: code, scrum, system-design
resumo: Modelos de ciclo de vida, requisitos funcionais e não funcionais, diagramas UML, padrões GoF e SOLID, testes, manutenção, métricas, Scrum, Kanban, XP, REST e microsserviços.
ordem: 11
busca: engenharia de software ciclo de vida cascata espiral rup requisitos uml casos de uso padrões de projeto gof solid testes tdd manutenção pontos de função scrum kanban xp rest microsserviços
---
# Processos de software

- **Cascata**: fases sequenciais (requisitos → projeto → implementação → testes → manutenção); mudanças tardias custam caro
- **Incremental** e **iterativo**: entregas parciais que evoluem · **Prototipação**: esclarece requisitos
- **Espiral** (Boehm): ciclos guiados pela **análise de riscos**
- **RUP**: fases **concepção, elaboração, construção e transição**, iterativo e guiado por casos de uso
- Crise do software: projetos atrasados, acima do custo e com baixa qualidade — motivou a disciplina

---

# Requisitos e UML

- **Funcionais**: o que o sistema faz ("emitir certidão") · **Não funcionais**: como/qualidades (desempenho, segurança, usabilidade, disponibilidade)
- **Verificação**: "estamos construindo **certo** o produto?" · **Validação**: "estamos construindo o produto **certo**?"
- UML **estruturais**: classes, objetos, componentes, **implantação**, pacotes · **comportamentais**: **casos de uso**, atividades, **estados**, **sequência**, comunicação
- Casos de uso: **«include»** (sempre executa o incluído) × **«extend»** (comportamento opcional/condicional)

---

# Projeto: padrões e princípios

| Família GoF | Exemplos |
|---|---|
| Criacionais | **Singleton**, Factory Method, Abstract Factory, **Builder**, Prototype |
| Estruturais | **Adapter**, **Facade**, Decorator, Composite, Proxy |
| Comportamentais | **Observer**, **Strategy**, Command, Iterator, Template Method, State |

- **SOLID**: responsabilidade única, aberto/fechado, substituição de Liskov, segregação de interfaces, inversão de dependência
- **Coesão alta e acoplamento baixo** · arquitetura em camadas, MVC, **microsserviços** (serviços pequenos e independentes) × monólito

---

# Testes, manutenção e métricas

- Níveis: **unidade → integração → sistema → aceitação** · **caixa-branca** (estrutura interna) × **caixa-preta** (entradas e saídas) · **regressão** após mudanças
- **TDD**: escreve o teste → falha (vermelho) → código mínimo (verde) → refatora
- Manutenção: **corretiva** (erros), **adaptativa** (ambiente mudou), **perfectiva** (melhorias), **preventiva**
- **Gerência de configuração**: itens de configuração, **baselines**, controle de versões e de mudanças · **auditoria de código** e homologação antes da implantação
- Métricas: **pontos de função** (tamanho funcional, independente da linguagem), LOC; estimativas com **COCOMO**

---

# Ágeis e APIs

- **Scrum**: papéis **Product Owner**, **Scrum Master** e **Developers**; eventos **Sprint** (até 1 mês), Sprint Planning, **Daily** (15 min), Review e Retrospectiva; artefatos **Product Backlog**, **Sprint Backlog** e **Incremento** (com Meta do Produto, Meta da Sprint e **Definição de Pronto**)
- **Kanban**: fluxo visual, **limite de WIP**, lead time · **XP**: programação em pares, TDD, integração contínua, pequenas entregas, refatoração
- **REST**: recursos identificados por URI, verbos HTTP, **sem estado** (stateless); **GET, PUT e DELETE são idempotentes**, POST não
- Interoperabilidade: JSON/XML, OpenAPI, mensageria (filas)

::: quiz
? No diagrama de casos de uso, o relacionamento que representa um comportamento opcional, executado apenas sob certa condição, é:
- [ ] include
- [x] extend
- [ ] generalização
= «extend» é condicional; «include» é sempre executado.
:::

::: cartoes
Espiral :: Ciclos guiados por análise de riscos (Boehm).
Fases do RUP :: Concepção, elaboração, construção e transição.
Verificação × validação :: Produto certo construído certo × produto certo.
«include» × «extend» :: Obrigatório × condicional.
Singleton :: Garante uma única instância.
Observer :: Notifica dependentes quando o estado muda.
Manutenção adaptativa :: Ajusta o software a mudanças do ambiente.
Papéis do Scrum :: Product Owner, Scrum Master e Developers.
Idempotentes no REST :: GET, PUT e DELETE.
:::

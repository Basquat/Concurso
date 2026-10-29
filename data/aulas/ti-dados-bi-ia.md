---
id: ti-dados-bi-ia
titulo: Dados, BI, big data e inteligência artificial
area: ti
disciplina: Tecnologia da Informação
cargos: 206, 402
labs: bi, sql, banco-dados
resumo: OLTP x OLAP, data warehouse, modelo estrela, ETL, data lake, big data (5 Vs), NoSQL, mineração de dados, aprendizado de máquina e IA generativa com cuidados de LGPD.
ordem: 17
busca: oltp olap data warehouse data mart modelo estrela fato dimensão etl elt data lake big data volume velocidade variedade veracidade valor nosql documento chave-valor grafo colunar mineração de dados aprendizado de máquina supervisionado não supervisionado ia generativa llm
---
# OLTP x OLAP

| | OLTP | OLAP |
|---|---|---|
| Uso | operações do dia a dia | **análise** e decisão |
| Dados | atuais, normalizados | **históricos**, desnormalizados |
| Consultas | curtas, muitas escritas | complexas, agregações |

- **Data warehouse**: integrado, **orientado a assunto**, **não volátil** e **variante no tempo** (Inmon)
- **Data mart**: recorte departamental

---

# Modelagem dimensional

- **Modelo estrela**: tabela **fato** (métricas: valor, quantidade) cercada de **dimensões** (tempo, produto, cliente)
- **Floco de neve**: dimensões normalizadas
- Operações OLAP: **drill-down** (detalhar), **roll-up** (agregar), **slice/dice** (fatiar), **pivot**
- **ETL**: extrair, transformar, carregar (ELT: transforma depois de carregar, comum em nuvem)

---

# Big data e NoSQL

- 5 Vs: **volume, velocidade, variedade, veracidade e valor**
- **Data lake**: dados brutos em formato original (estruturados ou não)
- NoSQL: **chave-valor** (Redis), **documento** (MongoDB), **colunar** (Cassandra), **grafo** (Neo4j)
- Teorema **CAP**: em partição de rede, escolher entre consistência e disponibilidade

---

# Mineração e IA

- Tarefas: **classificação**, **regressão**, **agrupamento (clustering)**, **regras de associação**
- Aprendizado **supervisionado** (dados rotulados) x **não supervisionado** (sem rótulos) x por **reforço**
- **IA generativa** (LLMs): produz texto, código e imagens; pode "alucinar" — exige revisão humana
- No setor público: transparência, explicabilidade e **LGPD** (base legal, minimização, anonimização)

::: quiz
? Em um modelo estrela, a tabela que armazena as métricas numéricas do negócio é a:
- [x] tabela fato
- [ ] tabela dimensão
- [ ] tabela de auditoria
- [ ] tabela de staging
= As dimensões descrevem o contexto (quando, onde, o quê).
:::

::: cartoes
Data warehouse (Inmon) :: Orientado a assunto, integrado, não volátil e variante no tempo.
Modelo estrela :: Tabela fato cercada de dimensões.
Drill-down :: Detalhar a informação para um nível mais fino.
Banco orientado a documentos :: Ex.: MongoDB.
Aprendizado supervisionado :: Treina com dados rotulados.
:::

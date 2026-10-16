---
id: ti-banco-dados
titulo: Banco de dados — modelo relacional, normalização, SQL e transações
area: ti
disciplina: Banco de dados
cargos: 402, 206
labs: sql, bi
resumo: Arquitetura ANSI/SPARC, modelo ER, chaves e integridade, 1FN a FNBC, DDL/DML/DCL/TCL, junções e agregações, ACID e isolamento, índices, views e triggers, NoSQL e data warehouse.
ordem: 9
busca: banco de dados sgbd modelo relacional er chave primária estrangeira normalização 1fn 2fn 3fn sql ddl dml join group by having acid isolamento índice view trigger nosql data warehouse
---
# SGBD e modelagem

- Arquitetura **ANSI/SPARC** em 3 níveis: **externo** (visões), **conceitual**, **interno** (físico) → independência **lógica** e **física** dos dados
- Modelagem **conceitual** (ER: entidades, atributos, relacionamentos, cardinalidade 1:1, 1:N, N:N) → **lógica** (tabelas) → **física** (índices, tipos)
- N:N vira **tabela associativa** com as duas chaves estrangeiras
- **Chave primária** (única e não nula) · **candidata** · **estrangeira** (garante a **integridade referencial**)

---

# Normalização

| Forma | Exige |
|---|---|
| **1FN** | valores **atômicos**, sem grupos repetitivos |
| **2FN** | 1FN + **sem dependência parcial** da chave composta |
| **3FN** | 2FN + **sem dependência transitiva** (atributo não chave dependendo de outro não chave) |
| **FNBC** | todo determinante é chave candidata |

- Desnormalizar pode ser escolha consciente em **data warehouse** e relatórios

---

# SQL

- **DDL**: CREATE, ALTER, DROP, TRUNCATE · **DML**: SELECT, INSERT, UPDATE, DELETE · **DCL**: GRANT, REVOKE · **TCL**: COMMIT, ROLLBACK, SAVEPOINT

```sql
SELECT s.setor, COUNT(*) AS total, AVG(s.salario) AS media
FROM servidor s
LEFT JOIN cargo c ON c.id = s.cargo_id
WHERE s.ativo = TRUE
GROUP BY s.setor
HAVING COUNT(*) > 5
ORDER BY total DESC;
```

- **WHERE** filtra **linhas** antes de agrupar; **HAVING** filtra **grupos**
- INNER JOIN (só pares que casam) · LEFT JOIN (todos da esquerda) · FULL JOIN · CROSS JOIN (produto cartesiano)

---

# Transações e concorrência

- **ACID**: **Atomicidade** (tudo ou nada) · **Consistência** · **Isolamento** · **Durabilidade** (após o COMMIT, persiste)
- Níveis de isolamento e anomalias:

| Nível | Leitura suja | Não repetível | Fantasma |
|---|---|---|---|
| Read uncommitted | pode | pode | pode |
| Read committed | não | pode | pode |
| Repeatable read | não | não | pode |
| Serializable | não | não | não |

- **Bloqueios** (compartilhado/exclusivo), **deadlock**, **MVCC** (PostgreSQL)

---

# Objetos, tuning e além do relacional

- **Índice** (B-tree) acelera busca e piora escrita · **view** (consulta salva) · **stored procedure** · **trigger** (dispara em INSERT/UPDATE/DELETE)
- Tuning: analisar o **plano de execução** (EXPLAIN), criar índices nas colunas de filtro e junção, evitar `SELECT *`
- Backup completo, diferencial e de log; replicação primária-réplica para alta disponibilidade
- **NoSQL**: chave-valor (Redis), **documento** (MongoDB), colunar (Cassandra), **grafo** (Neo4j); **teorema CAP**
- **OLTP** (transações do dia a dia) × **OLAP** (análise); **data warehouse** com **esquema estrela** (fato + dimensões) e **ETL**; **data lake** guarda dados brutos

::: quiz
? Uma tabela cuja chave primária é (matricula, curso) tem o atributo nome_aluno, que depende apenas de matricula. Ela viola a:
- [ ] 1FN
- [x] 2FN
- [ ] 3FN
= Dependência parcial de parte da chave composta viola a 2FN.
:::

::: cartoes
Integridade referencial :: Garantida pela chave estrangeira.
1FN :: Valores atômicos, sem grupos repetitivos.
2FN :: Sem dependência parcial da chave composta.
3FN :: Sem dependência transitiva.
WHERE × HAVING :: WHERE filtra linhas; HAVING filtra grupos.
ACID :: Atomicidade, consistência, isolamento e durabilidade.
Serializable :: Nível que impede leitura suja, não repetível e fantasma.
Esquema estrela :: Tabela fato ligada a tabelas de dimensão.
:::

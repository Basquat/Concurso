// Banco didático "Prefeitura de Vila Exemplo" (dados fictícios) e missões verificadas pelo resultado.
// As missões comparam o resultado da consulta do estudante com o da consulta de referência,
// executada no MESMO banco — qualquer SQL equivalente é aceito.

export const SEED = `
CREATE TABLE secretarias (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  orcamento REAL NOT NULL
);
CREATE TABLE servidores (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  salario REAL NOT NULL CHECK (salario > 0),
  admissao TEXT NOT NULL,
  secretaria_id INTEGER NOT NULL REFERENCES secretarias(id)
);
CREATE TABLE processos (
  id INTEGER PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  assunto TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('aberto', 'em análise', 'concluído', 'arquivado')),
  abertura TEXT NOT NULL,
  responsavel_id INTEGER REFERENCES servidores(id)
);
CREATE TABLE contratos (
  id INTEGER PRIMARY KEY,
  fornecedor TEXT NOT NULL,
  objeto TEXT NOT NULL,
  valor REAL NOT NULL,
  inicio TEXT NOT NULL,
  fim TEXT NOT NULL,
  secretaria_id INTEGER NOT NULL REFERENCES secretarias(id)
);
INSERT INTO secretarias VALUES (1,'Administração',1200000),(2,'Saúde',3500000),(3,'Educação',4100000),(4,'Obras',2300000),(5,'Tecnologia',900000);
INSERT INTO servidores VALUES
 (1,'Mariana Souza','Analista Administrativo',5200,'2019-03-11',1),
 (2,'Carlos Pereira','Assistente Administrativo',3100,'2021-07-01',1),
 (3,'Juliana Rocha','Enfermeira',6800,'2018-02-05',2),
 (4,'Rafael Lima','Médico',14500,'2020-09-14',2),
 (5,'Beatriz Alves','Técnica de Enfermagem',3900,'2022-01-10',2),
 (6,'Paulo Mendes','Professor',4800,'2017-03-01',3),
 (7,'Fernanda Costa','Professora',5100,'2016-02-15',3),
 (8,'Lucas Martins','Pedagogo',5600,'2023-04-03',3),
 (9,'Aline Ribeiro','Professora',4800,'2024-02-19',3),
 (10,'Gustavo Nunes','Engenheiro Civil',9800,'2019-08-26',4),
 (11,'Patrícia Gomes','Fiscal de Obras',4200,'2021-11-08',4),
 (12,'Rodrigo Teixeira','Analista de TI',7400,'2020-05-04',5),
 (13,'Camila Duarte','Técnica de TI',4100,'2023-09-11',5),
 (14,'Eduardo Ramos','Analista de Dados',7900,'2025-01-13',5);
INSERT INTO processos VALUES
 (1,'2026.0001','Solicitação de férias','concluído','2026-01-12',2),
 (2,'2026.0002','Compra de medicamentos','em análise','2026-02-03',3),
 (3,'2026.0003','Reforma de escola','aberto','2026-02-20',10),
 (4,'2026.0004','Licença para capacitação','concluído','2026-03-02',1),
 (5,'2026.0005','Aquisição de notebooks','em análise','2026-03-15',12),
 (6,'2026.0006','Pavimentação da Rua A','aberto','2026-04-01',11),
 (7,'2026.0007','Matrícula fora de prazo','arquivado','2026-04-10',8),
 (8,'2026.0008','Contratação de software','aberto','2026-05-06',12),
 (9,'2026.0009','Denúncia de obra irregular','em análise','2026-05-22',11),
 (10,'2026.0010','Progressão funcional','aberto','2026-06-08',1),
 (11,'2026.0011','Vacinação escolar','concluído','2026-06-30',5),
 (12,'2026.0012','Pedido LAI sobre salários','em análise','2026-07-14',NULL);
INSERT INTO contratos VALUES
 (1,'Alfa Papelaria Ltda','Material de expediente',48000,'2026-01-01','2026-12-31',1),
 (2,'Saúde+ Distribuidora','Medicamentos básicos',820000,'2026-02-01','2027-01-31',2),
 (3,'Constrular Engenharia','Reforma de 3 escolas',1350000,'2026-03-01','2026-11-30',4),
 (4,'NetVila Telecom','Link de internet',96000,'2026-01-15','2027-01-14',5),
 (5,'EducaMais Editora','Livros didáticos',410000,'2026-02-10','2026-12-31',3),
 (6,'LimpaBem Serviços','Limpeza predial',360000,'2026-01-01','2026-12-31',1),
 (7,'Asfalto Forte S.A.','Pavimentação',2100000,'2026-04-01','2027-03-31',4),
 (8,'Nuvem Pública Ltda','Hospedagem de sistemas',150000,'2026-05-01','2027-04-30',5);
`;

const SALARIOS_EDUCACAO = { 6: 4800, 7: 5100, 8: 5600, 9: 4800 };

export const MISSOES_SQL = [
  {
    id: 'select', titulo: 'Consulta com junção', xp: 25, ordenado: true,
    descricao: 'Liste nome e cargo dos servidores da secretaria de Educação, em ordem alfabética de nome.',
    dica: "Una servidores e secretarias pelo secretaria_id e filtre WHERE secretarias.nome = 'Educação'.",
    referencia: "SELECT s.nome, s.cargo FROM servidores s JOIN secretarias c ON c.id = s.secretaria_id WHERE c.nome = 'Educação' ORDER BY s.nome",
  },
  {
    id: 'agregacao', titulo: 'Agregação por grupo', xp: 30, ordenado: true,
    descricao: 'Para cada secretaria: nome, quantidade de servidores e média salarial — ordenado pelo nome da secretaria.',
    dica: 'COUNT(*) e AVG(salario) com GROUP BY. Arredondar com ROUND(...,2) também é aceito.',
    referencia: 'SELECT c.nome, COUNT(*), AVG(s.salario) FROM servidores s JOIN secretarias c ON c.id = s.secretaria_id GROUP BY c.id, c.nome ORDER BY c.nome',
  },
  {
    id: 'having', titulo: 'Filtrando grupos', xp: 30,
    descricao: 'Mostre apenas o nome das secretarias cuja folha salarial (soma dos salários) passa de R$ 20.000.',
    dica: 'Filtro sobre agregação vai no HAVING, não no WHERE.',
    referencia: 'SELECT c.nome FROM servidores s JOIN secretarias c ON c.id = s.secretaria_id GROUP BY c.id, c.nome HAVING SUM(s.salario) > 20000',
  },
  {
    id: 'sem-processo', titulo: 'Quem não tem processo?', xp: 40,
    descricao: 'Liste o nome dos servidores que não são responsáveis por nenhum processo.',
    dica: 'LEFT JOIN + IS NULL, ou NOT EXISTS. Cuidado: NOT IN com uma subconsulta que contém NULL não retorna nada!',
    referencia: 'SELECT s.nome FROM servidores s WHERE NOT EXISTS (SELECT 1 FROM processos p WHERE p.responsavel_id = s.id)',
  },
  {
    id: 'subconsulta', titulo: 'Acima da média', xp: 30,
    descricao: 'Liste nome e salário dos servidores que ganham acima da média salarial geral.',
    dica: 'WHERE salario > (SELECT AVG(salario) FROM servidores)',
    referencia: 'SELECT nome, salario FROM servidores WHERE salario > (SELECT AVG(salario) FROM servidores)',
  },
  {
    id: 'insert', titulo: 'Cadastro com integridade', xp: 30,
    descricao: "Cadastre a servidora Ana Lima, cargo 'Analista de TI', salário 6500, admitida em 2026-10-01, na secretaria de Tecnologia. (Teste antes uma secretaria_id inexistente e veja a chave estrangeira barrar.)",
    dica: "INSERT INTO servidores (nome, cargo, salario, admissao, secretaria_id) VALUES (...); o id é gerado sozinho.",
    estado: "SELECT COUNT(*) = 1 FROM servidores WHERE nome = 'Ana Lima' AND cargo = 'Analista de TI' AND salario = 6500 AND admissao = '2026-10-01' AND secretaria_id = (SELECT id FROM secretarias WHERE nome = 'Tecnologia')",
  },
  {
    id: 'transacao', titulo: 'Reajuste em transação', xp: 40, exigeTransacao: true,
    descricao: 'Aplique reajuste de 10% aos servidores da Educação dentro de uma transação explícita (BEGIN … COMMIT), executada de uma vez.',
    dica: "BEGIN; UPDATE servidores SET salario = salario * 1.1 WHERE secretaria_id = 3; COMMIT;  — se errar, use ROLLBACK (ou reinicie o laboratório).",
    estado: `SELECT ${Object.entries(SALARIOS_EDUCACAO).map(([id, s]) => `(SELECT ABS(salario - ${s * 1.1}) < 0.01 FROM servidores WHERE id = ${id})`).join(' AND ')}`,
  },
  {
    id: 'indice', titulo: 'Desempenho com índice', xp: 30,
    descricao: 'Crie um índice para acelerar as buscas de processos por status e confira com EXPLAIN QUERY PLAN que ele é usado.',
    dica: "CREATE INDEX idx_processos_status ON processos(status); depois: EXPLAIN QUERY PLAN SELECT * FROM processos WHERE status = 'aberto';",
    estado: "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type = 'index' AND tbl_name = 'processos' AND sql LIKE '%status%'",
  },
];

const normal = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v === null ? null : String(v).trim());

// Compara dois conjuntos de linhas (ignora nomes de colunas; arredonda números em 2 casas).
export function mesmoResultado(a, b, ordenado) {
  if (!a || !b || a.length !== b.length || (a[0]?.length ?? 0) !== (b[0]?.length ?? 0)) return false;
  const ja = a.map((l) => JSON.stringify(l.map(normal)));
  const jb = b.map((l) => JSON.stringify(l.map(normal)));
  if (!ordenado) { ja.sort(); jb.sort(); }
  return ja.every((x, i) => x === jb[i]);
}

export const DIALETOS = [
  ['Chave com numeração automática', 'INTEGER PRIMARY KEY', 'GENERATED ALWAYS AS IDENTITY (ou SERIAL)', 'AUTO_INCREMENT'],
  ['Limitar linhas', 'LIMIT n OFFSET m', 'LIMIT n OFFSET m · FETCH FIRST n ROWS ONLY', 'LIMIT n OFFSET m · LIMIT m, n'],
  ['Concatenar texto', "a || b", "a || b · concat(a, b)", 'CONCAT(a, b) — || é OU lógico por padrão'],
  ['Busca sem diferenciar maiúsculas', 'LIKE (ASCII já é case-insensitive)', 'ILIKE', 'LIKE (depende da collation; a padrão ignora maiúsculas)'],
  ['Tipo booleano', 'inteiro 0/1', 'BOOLEAN (true/false)', 'BOOLEAN = TINYINT(1)'],
  ['Identificador com espaço', '"nome da coluna"', '"nome da coluna"', '`nome da coluna`'],
  ['Data de hoje', "date('now')", 'CURRENT_DATE', 'CURDATE()'],
  ['Tipagem', 'dinâmica (afinidade de tipo)', 'estrita', 'estrita no modo STRICT'],
  ['Usuários e permissões', 'não existem (banco é um arquivo)', 'CREATE ROLE · GRANT · REVOKE', 'CREATE USER · GRANT · REVOKE'],
  ['Plano de execução', 'EXPLAIN QUERY PLAN', 'EXPLAIN · EXPLAIN ANALYZE', 'EXPLAIN · EXPLAIN ANALYZE'],
  ['Inserir ou atualizar (upsert)', 'INSERT … ON CONFLICT DO UPDATE', 'INSERT … ON CONFLICT DO UPDATE', 'INSERT … ON DUPLICATE KEY UPDATE'],
];

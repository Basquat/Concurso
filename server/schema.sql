-- Esquema do Concurso Lab (Postgres em produção, SQLite nos testes e no `npm run dev`).
-- Instantes em milissegundos como DOUBLE PRECISION: inteiros exatos até 2^53 e lidos como número pelos dois drivers.
-- Aplicar: psql "$DATABASE_URL" -f server/schema.sql   (idempotente)

-- Identidade. O servidor nunca vê a senha nem a chave de dados: guarda o hash de um segredo derivado e as
-- chaves embrulhadas (cofre de conhecimento zero). `papel` decide permissões; assinatura fica em outra tabela.
CREATE TABLE IF NOT EXISTS contas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_lc TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  cor TEXT NOT NULL,
  criada_em DOUBLE PRECISION NOT NULL,
  auth_sal TEXT NOT NULL,
  auth_hash TEXT NOT NULL,
  rec_sal TEXT NOT NULL,
  rec_hash TEXT NOT NULL,
  kdf TEXT NOT NULL,
  dek_senha TEXT NOT NULL,
  rec TEXT NOT NULL,
  falhas INTEGER NOT NULL DEFAULT 0,
  bloqueada_ate DOUBLE PRECISION NOT NULL DEFAULT 0,
  papel TEXT NOT NULL DEFAULT 'aluno' CHECK (papel IN ('aluno', 'admin'))
);

-- Dados de estudo sincronizados (cifrados no navegador; o servidor só guarda o blob).
CREATE TABLE IF NOT EXISTS registros (
  conta TEXT NOT NULL REFERENCES contas (id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  iv TEXT NOT NULL,
  ct TEXT NOT NULL,
  em DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (conta, chave)
);

CREATE TABLE IF NOT EXISTS tokens (
  hash TEXT PRIMARY KEY,
  conta TEXT NOT NULL REFERENCES contas (id) ON DELETE CASCADE,
  expira DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS tokens_conta ON tokens (conta);

-- Espelho local da assinatura no Stripe (a fonte da verdade é o Stripe; isto é reconciliado a cada evento).
CREATE TABLE IF NOT EXISTS assinaturas (
  conta TEXT PRIMARY KEY REFERENCES contas (id) ON DELETE CASCADE,
  cliente TEXT NOT NULL UNIQUE,
  assinatura TEXT,
  status TEXT NOT NULL DEFAULT 'nenhuma',
  preco TEXT,
  periodo_fim DOUBLE PRECISION NOT NULL DEFAULT 0,
  cancela_no_fim INTEGER NOT NULL DEFAULT 0,
  atualizado_em DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- Eventos de webhook já processados (idempotência).
CREATE TABLE IF NOT EXISTS eventos_stripe (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  recebido_em DOUBLE PRECISION NOT NULL
);

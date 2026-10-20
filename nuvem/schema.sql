-- Esquema do D1. Aplicar com: npx wrangler d1 execute concurso-lab --remote --file=schema.sql
-- O servidor só guarda dados já cifrados no navegador (AES-GCM) e hashes de segredos derivados da senha.
CREATE TABLE IF NOT EXISTS contas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  nome_lc TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  cor TEXT NOT NULL,
  criada_em INTEGER NOT NULL,
  auth_sal TEXT NOT NULL,
  auth_hash TEXT NOT NULL,
  rec_sal TEXT NOT NULL,
  rec_hash TEXT NOT NULL,
  kdf TEXT NOT NULL,
  dek_senha TEXT NOT NULL,
  rec TEXT NOT NULL,
  falhas INTEGER NOT NULL DEFAULT 0,
  bloqueada_ate INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS registros (
  conta TEXT NOT NULL,
  chave TEXT NOT NULL,
  iv TEXT NOT NULL,
  ct TEXT NOT NULL,
  em INTEGER NOT NULL,
  PRIMARY KEY (conta, chave)
);
CREATE TABLE IF NOT EXISTS tokens (
  hash TEXT PRIMARY KEY,
  conta TEXT NOT NULL,
  expira INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tokens_conta ON tokens (conta);

# Contas na nuvem (login em qualquer aparelho)

Sem isto, cada conta existe só no navegador onde foi criada. Com isto, o mesmo nome e senha entram em qualquer aparelho e o progresso sincroniza.

Pedaços: `nuvem/worker.js` (API, Cloudflare Worker + banco D1, plano gratuito) e `src/adapters/storage/nuvem.js` (cliente). Nada muda para quem não configurar: `NUVEM_URL` vazio em `src/config.js` mantém o comportamento local.

## Publicar a API (uma vez)

Precisa de uma conta Cloudflare gratuita (sem cartão) e Node instalado.

```bash
cd nuvem
npx wrangler login
npx wrangler d1 create concurso-lab
```

Copie o `database_id` mostrado para `nuvem/wrangler.toml`. Em `ORIGENS`, deixe o endereço do seu GitHub Pages (só origem, sem caminho: `https://usuario.github.io`).

```bash
npx wrangler d1 execute concurso-lab --remote --file=schema.sql
npx wrangler deploy
```

O último comando imprime a URL (`https://concurso-lab-nuvem.<subdominio>.workers.dev`). Cole em `src/config.js`:

```js
export const NUVEM_URL = 'https://concurso-lab-nuvem.<subdominio>.workers.dev';
```

Publique o site (commit/push). Em **Conta e segurança → Entrar em qualquer aparelho** quem já tem conta local ativa a sincronização (gera um novo código de recuperação). Contas novas já nascem sincronizadas.

## Como funciona

- Os dados continuam cifrados no navegador (AES-GCM-256) com a chave da conta; essa chave fica embrulhada pela senha e pelo código de recuperação. O servidor só recebe esses blobs.
- Para provar a senha ao servidor, o navegador deriva um segredo **à parte** (PBKDF2, sal próprio). O servidor guarda só o SHA-256 dele: não serve para abrir o cofre e a senha nunca sai do aparelho.
- Login em aparelho novo: nome + senha → servidor devolve as chaves embrulhadas e os registros cifrados → o navegador decifra localmente.
- Sincronização: ao entrar, ao voltar para a aba (no máximo 1×/min) e a cada gravação. Compara chave + data de cada registro; vale o mais recente (por registro). Funciona offline e sobe depois.
- Servidor bloqueia após 5 senhas erradas (30 s, dobrando até 15 min). Troca de senha e recuperação encerram as sessões dos outros aparelhos, que passam a pedir a nova senha.
- Sessões da nuvem duram 30 dias e são revogadas ao sair/bloquear.

## Limites

- Registro maior que ~1,4 MB (banco SQLite exportado muito grande) fica só no aparelho; a tela de Conta avisa.
- Apagar uma chave num aparelho não apaga nos outros (sem "lápide"): na próxima sincronização ela volta.
- O nome da conta é a chave de login e é único na nuvem; criar conta é aberto a quem tiver a URL (sem confirmação de e-mail).
- Esqueceu a senha **e** perdeu o código de recuperação: não há como recuperar (os dados são cifrados e o servidor não tem a chave).
- Plano gratuito do Cloudflare: 100 mil requisições/dia e 100 mil linhas escritas/dia, mais que suficiente para uso pessoal.

## Testes

`node tests/nuvem.test.mjs` roda o Worker real com SQLite em memória no lugar do D1 e simula vários aparelhos (login, troca de senha, recuperação, bloqueio, offline, exclusão, CORS).

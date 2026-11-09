# AGENTS.md — Concurso Lab

Guia para agentes de código e colaboradores do projeto **Concurso Lab**.

## Projeto

Plataforma de preparação para concursos públicos. Front em HTML, CSS e módulos ES (sem bundler); backend em uma
Vercel Function (`api/index.js` → `server/`) com Postgres (Neon) e Stripe. Ver `docs/REENGENHARIA.md` e `docs/DEPLOY.md`.

## Comandos

- `npm run dev` — front + API + SQLite local em `http://localhost:8765`.
- `npm test` (`node tests/run.mjs`) — todos os testes (domínio, cofre, contas, assinaturas, conteúdo).
- `node tools/indice.mjs` — valida e regenera `data/indice.json` (rode após editar `data/aulas` ou `data/questoes`).
- `npm run build` — índice + `public/` (o que a Vercel publica).

## Arquitetura

```
src/domain/        regras puras (sem DOM, rede ou armazenamento)
src/application/   casos de uso
src/adapters/      storage (cofre cifrado IndexedDB, cliente da API), content, runtimes, ui (casca, telas, labs)
src/main.js        raiz de composição do front
api/index.js       Vercel Function → server/app.js (despacha /api/*)
server/            contas.js, acesso.js (papéis, direitos, admin), assinaturas.js (Stripe), conteudo.js (questões),
                   schema.sql, neon.js (produção) e sqlite.js (testes/dev), dev.mjs (servidor local)
data/              aulas/*.md, questoes/*.txt (privado: só via API), questoes-rascunho/ (não publicado), concursos/
tools/publico.mjs  lista do que é estático; tudo fora dela não é publicado
```

## Regras

- Autorização só no servidor: use `direitos`/`exigir` de `server/acesso.js`; o front apenas esconde o que a API negaria.
- Assinatura muda apenas por webhook verificado ou `reconciliar()` com o Stripe. Nunca confie em parâmetro de URL.
- Segredos só em variáveis de ambiente (`DATABASE_URL`, `STRIPE_*`). Nada de chave no front.
- Progresso do aluno é cifrado no navegador; o servidor não lê nem deve passar a ler esses dados.
- Catálogo de práticas em `src/adapters/ui/labs/registro.js`. "Laboratório" só para ambiente técnico verificável;
  rotinas profissionais são `simulador`, treinos corrigidos são `exercicio` (ver `categoria()`).
- Questão gerada automaticamente vai para `data/questoes-rascunho/` até ser revisada.
- Módulos ES, sem dependências novas sem necessidade (hoje só `@neondatabase/serverless`). `toast()` para feedback,
  `esc()` para escapar HTML.

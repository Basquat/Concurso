# Concurso Lab

Plataforma de preparação para concursos públicos: aulas em slides, banco de questões comentadas, revisão espaçada,
simulados no formato do edital, laboratórios técnicos que rodam no navegador e assinatura via Stripe.
Cada aluno escolhe concurso e cargo; o conteúdo, o plano e as recomendações seguem esse objetivo.

## Arquitetura (monólito modular)

```
index.html, assets/, src/   front (módulos ES, sem bundler), servido como estático
  src/domain/               regras puras (labs, SRS, plano, banco de questões) — sem DOM, rede ou armazenamento
  src/application/          casos de uso (estudo, escopo do cargo)
  src/adapters/             armazenamento cifrado (IndexedDB), cliente da API, runtimes, telas
api/index.js                Vercel Function única → server/app.js
server/                     backend: contas (login + sincronização cifrada), acesso (papéis/direitos/admin),
                            assinaturas (Stripe), conteudo (questões com controle de acesso), schema.sql
data/                       conteúdo versionado: aulas (.md), questões (.txt), concursos (.json)
tools/                      indice.mjs (valida e indexa o conteúdo), publico.mjs (monta public/ no build)
tests/                      node tests/run.mjs
```

Decisões, inventário e política de acesso: [`docs/REENGENHARIA.md`](docs/REENGENHARIA.md).
Publicação (Vercel, Neon, Stripe, variáveis, primeiro admin): [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Rodar localmente

```bash
npm install
npm run dev
```

`http://localhost:8765` com API e banco SQLite local (`.dev/`). Testes: `npm test`.

## Segurança em uma frase por item

- Senha nunca sai do aparelho; progresso é cifrado no navegador (AES-GCM) e o servidor guarda só blobs.
- Papel (aluno/admin) e assinatura são independentes e decididos no servidor (`server/acesso.js`).
- Assinatura só muda por webhook assinado do Stripe ou reconciliação com a API do Stripe — nunca pelo navegador.
- O banco de questões não é arquivo público: a API entrega amostra ou banco completo conforme o direito da conta.

## Conteúdo

- **Concurso:** `data/concursos/<id>.json` (+ entrada em `data/concursos.json`), com fonte e data de consulta.
- **Aula:** `data/aulas/<id>.md` (slides em Markdown com diretivas).
- **Questão:** `data/questoes/*.txt` (formato descrito em `src/domain/banco.js`). Questões autorais no estilo da banca;
  questão oficial só com direito de reprodução e referência completa. Rascunhos ficam em `data/questoes-rascunho/`.
- `npm run build` (ou `node tools/indice.mjs`) valida tudo e falha com duplicatas, áreas ou aulas inexistentes.

## Avisos

Projeto educacional independente, sem vínculo com órgãos públicos, bancas ou fabricantes citados. Laboratórios usam
dados fictícios e informam o que é real e o que é simulado. Nomes de produtos são marcas de seus titulares.

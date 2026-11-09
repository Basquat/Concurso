# Reengenharia 3.0 — diagnóstico e decisões

Auditoria feita em 09/11/2026 sobre o `main` (commit 913faa6). Documento vivo: atualize ao fechar cada item.

## 1. O que existe (inventário)

| Peça | Estado encontrado |
|---|---|
| Stack | HTML + CSS + módulos ES, sem build e sem dependências. Roteador por hash. Arquitetura hexagonal (`src/domain` puro, `src/application`, `src/adapters`). ~17 mil linhas. |
| Contas | Cofre local cifrado (AES-GCM 256, chave embrulhada por PBKDF2 600k e por código de recuperação), visitante sem cifra, migração da 1.0. Login multiaparelho em `nuvem/` (Cloudflare Worker + D1) **nunca publicado** (`NUVEM_URL` vazio). Servidor de conhecimento zero: só vê blobs cifrados. |
| Armazenamento local | IndexedDB (`registros` por conta: `progresso`, `srs`, `config`, `lab:<id>`) + `localStorage` para preferências de interface. |
| Concursos | Já multi-concurso nos dados: `data/concursos/*.json` (UFBA real + 10 concursos-modelo por área), cargo-alvo por aluno, escopo "Meu edital". Viés UFBA só na casca: menu fixo "Edital UFBA 2026", contagem regressiva da UFBA para quem não escolheu cargo, textos. |
| Questões | 3.066 publicadas, mas **1.542 (50%) geradas automaticamente** (`treinos-gerados.txt`) sem revisão; **36 duplicatas exatas** (mesmo enunciado e alternativas, quase todas em `expansao-areas.txt`); **358 sem explicação** (Direito, exatas, inglês/arquivologia). Telas mostravam 3.066 e 3.007 para o mesmo banco. |
| Laboratórios | 72 no catálogo: 15 ambientes de verdade ou simuladores fiéis, 48 "treinos" (exercícios de cálculo/classificação/ordem), 4 formulários com missões que se cumprem só preenchendo campos (`financas`, `investimentos`, `rh`, `direito`) e 1 "terminal" com comandos inventados (`servidor`). |
| Desktop virtual | Rota com placeholder "em construção" anunciada como recurso no menu e no catálogo. |
| Pagamento, papéis, admin | Inexistentes. Todos veem o mesmo menu de 19 itens. |
| Testes | `node tests/run.mjs` (domínio, cofre, nuvem com Worker real sobre SQLite, conteúdo). |

## 2. Classificação

| Manter | Reestruturar | Substituir | Remover |
|---|---|---|---|
| Cofre cifrado e visitante · motores dos labs reais (Code Studio, SQL, Linux, Git, Docker, AWS, Redes, BI, Regex, Cripto, Lógica, Planilha, Contábil, SEI, Redação, Saúde, Educação) · treinos (como exercícios) · aulas em slides · SRS · simulado · catálogo de concursos em JSON | API de contas (Cloudflare → Vercel + Postgres, mesmo protocolo) · menu (19 → 12 itens, contextual) · catálogo de labs (separar laboratório × simulador × exercício) · banco de questões (só revisado é publicado) | Hospedagem GitHub Pages → Vercel · acesso às questões (arquivo público → API com controle de assinatura) | `treinos-gerados.txt` do banco publicado (vai para `data/questoes-rascunho/`) · 36 duplicatas exatas (o build agora as recusa) · Desktop virtual · labs `servidor`, `financas`, `investimentos`, `rh`, `direito` · `nuvem/` (Worker) |

## 3. Decisões de arquitetura

1. **Monólito modular sem framework.** O frontend continua estático (sem build de bundler); o backend é uma única Vercel Function (`api/index.js`) que despacha para módulos em `server/`: `contas` (autenticação + sincronização), `acesso` (papéis, permissões, direitos, admin), `assinaturas` (Stripe), `conteudo` (questões com controle de acesso). Mesmo deploy, mesmo repositório. Next.js foi descartado: reescreveria 17 mil linhas que funcionam para ganhar SSR que o produto não usa.
2. **Postgres (Neon, via Vercel Marketplace)** com o driver `@neondatabase/serverless` — a única dependência de runtime. O código de servidor fala com uma interface mínima estilo D1 (`prepare/bind/first/all/run/batch`); há dois adaptadores: Neon (produção) e `node:sqlite` (testes e `npm run dev`). Esquema em `server/schema.sql`, válido nos dois.
3. **Conhecimento zero preservado.** Progresso, revisões, estado dos labs e cargo-alvo seguem cifrados no navegador e sincronizados como blobs (já atravessam aparelhos). O servidor guarda em claro só o que precisa decidir: identidade, papel, assinatura e eventos do Stripe. Consequência aceita: o admin não lê o progresso dos alunos.
4. **RBAC + direitos calculados no servidor** (`server/acesso.js`): `papel` (visitante, aluno, admin) é independente da `assinatura`; `direitos(papel, assinatura)` é a única fonte de verdade. Conteudista não foi criado (sem necessidade real hoje); adicionar um papel é uma linha em `PERMISSOES`.
5. **Stripe sem SDK** (`fetch` + HMAC do `node:crypto`), API fixada em `2025-03-31.basil`. Checkout hospedado, Customer Portal para cancelar/trocar cartão/ver faturas, webhook com assinatura verificada, idempotência por `event.id` e **reconciliação**: todo evento relevante faz o servidor buscar o estado atual da assinatura no Stripe, então eventos fora de ordem não corrompem o estado. Valores dos planos ficam só no Stripe (ids em variáveis de ambiente).
6. **Conteúdo como código.** Concursos, aulas e questões continuam versionados em arquivos com validação (`tools/indice.mjs` + testes) — o fluxo editorial é rascunho → revisão (PR) → publicado. Um CMS no banco só vale quando houver conteudistas que não usam git; o formato JSON dos concursos já registra fonte, data de consulta e aviso de validade, que é o ponto de entrada para importadores futuros.
7. **Questões premium não são arquivos públicos.** O build copia para `public/` só o que é estático; `data/questoes/` fica fora e é servido por `GET /api/questoes`, que entrega tudo ao assinante e uma amostra por disciplina aos demais.

## 4. Política de acesso (assinatura)

| Status no Stripe | Acesso premium |
|---|---|
| `active`, `trialing` | Sim, até o fim do período + 3 dias (janela em que o Stripe reenvia o webhook de renovação). Depois disso nega até a próxima reconciliação (webhook ou botão "Atualizar status"). |
| `active` com cancelamento agendado | Sim, até o fim do período pago. |
| `past_due` (cobrança falhou, Stripe tentando de novo) | Sim, por 7 dias após o fim do período. |
| `unpaid`, `canceled`, `incomplete`, `incomplete_expired`, `paused` | Não. |

Laboratórios e aulas continuam abertos: rodam no navegador e qualquer bloqueio no cliente seria cosmético.

## 5. Resultado desta etapa

- Banco publicado: **1.488 questões** revisadas (era 3.066 com metade gerada). Amostra grátis: até 10 por disciplina (431).
- Catálogo: **12 laboratórios** técnicos, **6 simuladores**, **49 exercícios** (era "72 laboratórios").
- Menu: 19 → 11 itens para aluno, +1 grupo para admin. Contagem regressiva só aparece com cargo-alvo.
- Testes novos: `tests/assinaturas.test.mjs` (política de acesso, HMAC do webhook, idempotência, eventos fora de ordem, checkout, portal, RBAC, amostra de questões).

## 6. Pendências (não feitas nesta etapa)

- **Repositório público:** o banco de questões pago fica legível no GitHub. Tornar o repositório privado antes de cobrar (`docs/DEPLOY.md`, passo 0).

- **Conteúdo:** escrever as 358 explicações que faltam; revisar `data/questoes-rascunho/` antes de republicar; ampliar áreas com menos de 40 questões (Finanças, Bancários, RH, Investimentos, Arquivologia).
- **Painel admin de conteúdo** (CRUD de questões/concursos no banco): adiado pela decisão 6.
- **Importação automática de concursos** de fontes externas: só a estrutura (campos de proveniência) existe.
- **Rate limit global**: há bloqueio progressivo por conta; limite por IP exige um armazenamento compartilhado (ex.: Upstash) — adicionar se houver abuso.
- **Deploy validado**: depende de conta Vercel, banco Neon e chaves Stripe de teste — passos em `docs/DEPLOY.md`.

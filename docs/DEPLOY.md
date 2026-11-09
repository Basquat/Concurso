# Deploy na Vercel (Postgres + Stripe)

Uma aplicação: front estático (`public/`, gerado no build) + uma Vercel Function (`api/index.js`) com os módulos de `server/`.

## 0. Antes de cobrar: repositório privado

O banco de questões (`data/questoes/`) é o conteúdo pago. Na Vercel ele só sai pela API, mas **num repositório público
qualquer pessoa lê os arquivos no GitHub**. Torne `Basquat/Concurso` privado (Settings → General → Danger Zone →
Change visibility) antes de ativar os pagamentos. A Vercel publica repositórios privados normalmente.

## 1. Projeto e banco

1. Em vercel.com → **Add New → Project** → importe o repositório. Framework preset: **Other**. Build, output e funções
   já vêm do `vercel.json` (`npm run build` → `public/`).
2. No projeto: **Storage → Create Database → Neon (Postgres)** e conecte ao projeto. Isso cria `DATABASE_URL` nos três
   ambientes (Production, Preview, Development).
3. Crie as tabelas: no console do Neon (**SQL Editor**) cole o conteúdo de `server/schema.sql` e execute.
   O script é idempotente (pode rodar de novo). Com `psql`: `psql "$DATABASE_URL" -f server/schema.sql`.

## 2. Stripe (comece no modo de teste)

1. **Produto:** Dashboard → Product catalog → *Concurso Lab Premium* com dois preços **recorrentes** em BRL:
   R$ 14,90 / mês e R$ 135,00 / ano. Copie os ids `price_...`. Os valores mostrados no site vêm do Stripe; para mudar o
   preço, crie um novo preço e troque a variável — nada no código.
2. **Customer Portal:** Settings → Billing → Customer portal → ative cancelar (no fim do período), atualizar forma de
   pagamento, histórico de faturas e troca de plano entre os dois preços.
3. **Webhook:** Developers → Webhooks → Add endpoint `https://SEU-DOMINIO/api/stripe/webhook`, versão da API
   `2025-03-31.basil` ou mais nova, eventos:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`,
   `invoice.paid`, `invoice.payment_failed`. Copie o *signing secret* (`whsec_...`).
4. **Recuperação de pagamento:** Settings → Billing → Revenue recovery → tentativas automáticas (ex.: 4 tentativas em
   2 semanas) e, ao final, **cancelar a assinatura**. O site mantém o acesso por 7 dias após o fim do período enquanto o
   status for `past_due` (ver `docs/REENGENHARIA.md`, política de acesso).

## 3. Variáveis de ambiente (Project → Settings → Environment Variables)

| Variável | Valor | Observação |
|---|---|---|
| `DATABASE_URL` | criada pela integração Neon | segredo |
| `STRIPE_SECRET_KEY` | `sk_test_...` (depois `sk_live_...`) | segredo; nunca vai ao navegador |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` do endpoint | segredo; um por ambiente/endpoint |
| `STRIPE_PRICE_MENSAL` | `price_...` mensal | |
| `STRIPE_PRICE_ANUAL` | `price_...` anual | |
| `APP_URL` | `https://SEU-DOMINIO` | base das URLs de retorno do Checkout/Portal (sem barra no fim) |

Depois de salvar, **Redeploy**. Sem as variáveis do Stripe o site funciona e a tela de assinatura mostra "em breve".

## 4. Primeiro administrador

Crie sua conta pelo site (ela nasce sincronizada) e, no SQL Editor do Neon:

```sql
UPDATE contas SET papel = 'admin' WHERE nome_lc = lower('Seu Nome');
```

Os demais administradores podem ser promovidos pela tela **Administração → Usuários e assinaturas**.
Ninguém altera o próprio papel (evita ficar sem admin).

## 5. Validar o deploy (checklist)

- [ ] `https://SEU-DOMINIO/api/` responde `{"ok":true,...}`.
- [ ] `https://SEU-DOMINIO/data/questoes/ti-base.txt` responde **404** (banco só pela API).
- [ ] Sem conta: Questões mostra "Amostra gratuita".
- [ ] Criar conta, sair, entrar em outra janela anônima com o mesmo nome/senha: progresso aparece.
- [ ] Conta → Assinar mensal → cartão de teste `4242 4242 4242 4242`, qualquer data futura/CVC → volta ao site com a
      assinatura **Ativa** e o banco completo liberado. Em Stripe → Webhooks o evento aparece com 200.
- [ ] Gerenciar assinatura → cancelar → status "Cancelamento agendado", acesso mantido até a data.
- [ ] Cartão `4000 0000 0000 0341` (falha na renovação) → simule pelo Dashboard → status "Pagamento pendente".

## 6. Ir para produção

Ative a conta Stripe, recrie produto/preços/webhook no modo live, troque as quatro variáveis `STRIPE_*` no ambiente
Production e faça redeploy. Mantenha as chaves de teste em Preview.

## 7. Operação

- **Logs:** Vercel → Project → Logs (a função registra só tipo/código de erro do Stripe, sem dados pessoais).
- **Backups:** o Neon mantém histórico para restauração a um instante (Branches → Restore). Para cópia própria:
  `pg_dump "$DATABASE_URL" > backup.sql`.
- **Reconciliar uma assinatura:** o aluno usa "Atualizar status" na Conta; todo webhook também reconcilia.
  Webhooks perdidos: Stripe → Webhooks → evento → *Resend*.
- **Mudança de esquema:** acrescente comandos idempotentes (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) ao fim de
  `server/schema.sql`, rode no Neon **antes** do deploy do código que depende deles.
- **Conteúdo:** edite `data/aulas/*.md`, `data/questoes/*.txt`, `data/concursos/*.json`; `npm run build` valida
  (falha com duplicatas, áreas/aulas inexistentes). Questões novas não revisadas vão para `data/questoes-rascunho/`.

## 8. Desenvolvimento local

```bash
npm install
npm run dev
```

Abre `http://localhost:8765` com API e SQLite em `.dev/banco.sqlite`. Para testar pagamentos localmente, exporte as
variáveis `STRIPE_*` de teste e encaminhe os webhooks com a Stripe CLI:

```bash
stripe listen --forward-to localhost:8765/api/stripe/webhook
```

(use o `whsec_` impresso por esse comando como `STRIPE_WEBHOOK_SECRET`). Testes: `npm test`.

## 9. Migração do GitHub Pages

Dados do navegador não atravessam domínios: o progresso salvo em `basquat.github.io` não aparece sozinho no domínio
novo. Preencha `NOVO_ENDERECO` em `src/config.js` e publique — o site antigo passa a mostrar o aviso com o caminho:
menu da conta → **Baixar backup**; no endereço novo → **Tenho um backup de outro aparelho**. Depois de um período de
transição, desligue o GitHub Pages (Settings → Pages → *None*): enquanto ligado, ele serve o banco de questões sem
controle de acesso.

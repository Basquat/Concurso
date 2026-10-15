# Laboratórios do Concurso Lab — Guia Completo

Este guia descreve os laboratórios criados para o remake do frontend do Concurso Lab. Cada laboratório segue a arquitetura hexagonal do projeto.

## Estrutura de cada laboratório

```
src/
  domain/
    lab-<nome>/
      index.js          # Regras puras (funções de estado, ações)
      misssoes.js       # Catálogo de missões com XP
  adapters/ui/
    labs/
      <nome>.js         # Componente UI (carrega estado, desenha interface)
      registro.js       # Catálogo global de laboratórios (metadados)
```

## Laboratório: Montagem de Servidor (`servidor`)

**Arquivos:**
- `src/domain/lab-servidor/index.js` — Estado do servidor Ubuntu simulado, comandos de configuração.
- `src/domain/lab-servidor/misssoes.js` — 6 missões (ligar, instalar nginx, instalar PostgreSQL, criar usuário, configurar rede, status).
- `src/adapters/ui/labs/servidor.js` — Terminal interativo com comandos.

**Funcionalidades:**
- Estado inicial: Ubuntu 22.04, 4 vCPU, 8 GB RAM, 100 GB SSD.
- Comandos: `ligar`, `desligar`, `status`, `instalar <pacote>`, `add-usuario <nome> <tipo> <sudo>`, `config-rede <ip>/<mascara>`, `instalar-servico <servico>`, `reboot`.
- Pacotes disponíveis: curl, git, vim, nano, openssh-server, nginx, postgresql, docker, python3, nodejs, ufw, fail2ban.
- Serviços: ssh, nginx, postgresql, docker.

## Laboratório: Time Scrum (`scrum`)

**Arquivos:**
- `src/domain/lab-scrum/index.js` — Estado do time Scrum com papéis, backlog, sprint, burndown, retrospectiva.
- `src/domain/lab-scrum/misssoes.js` — 6 missões (criar backlog, planejar sprint, registrar daily, atualizar burndown, registrar retrospectiva, calcular métricas).
- `src/adapters/ui/labs/scrum.js` — Interface visual com cards, burndown e métricas.

**Funcionalidades:**
- Time: Product Owner, Scrum Master, Dev Frontend, Dev Backend, Dev Fullstack, QA, UX Designer.
- Operações: adicionar backlog item, planejar sprint, adicionar/concluir tarefas, concluir item, registrar daily, atualizar burndown, registrar retrospectiva.
- Métricas: velocidade, taxa de conclusão, impedimentos.

## Laboratório: System Design (`system-design`)

**Arquivos:**
- `src/domain/lab-system-design/index.js` — Estado do sistema com requisitos, arquitetura, componentes, trade-offs, validação.
- `src/domain/lab-system-design/misssoes.js` — 6 missões (definir requisitos, definir arquitetura, adicionar componentes, documentar trade-off, gerar diagrama, obter score acima de 70).
- `src/adapters/ui/labs/system-design.js` — Interface de 5 etapas (Requisitos → Arquitetura → Trade-offs → Diagrama → Avaliação).

**Funcionalidades:**
- Requisitos: nome, escalabilidade, confiabilidade, custo, funcionais, não-funcionais.
- Arquitetura: tipo (monolítica/microserviços/serverless), camadas, banco, cache, mensageria.
- Componentes: nome, tecnologia, responsabilidade, escala.
- Trade-offs: decisão, ganho, perda, justificativa.
- Avaliação: score de 0 a 100 com feedback automático (ex.: "Para alta escalabilidade, adicione mensageria").

## Rotação

As rotas dos novos laboratórios estão em `src/adapters/ui/router.js`:
- `/lab/servidor` → `src/adapters/ui/labs/servidor.js`
- `/lab/scrum` → `src/adapters/ui/labs/scrum.js`
- `/lab/system-design` → `src/adapters/ui/labs/system-design.js`

O catálogo está em `src/adapters/ui/labs/registro.js` (objeto `LABS`).

## Dados

As trilhas em `data/trilhas.json` foram atualizadas:
- Trilha `ti` (Tecnologia da Informação): adicionados `servidor` e `system-design`.
- Trilha `adm` (Administração): adicionados `scrum`.

## Testes

Os testes do domínio estão em `tests/`. Para adicionar testes para os novos laboratórios, crie arquivos em `tests/` seguindo o padrão existente (ex.: `tests/linux.test.mjs`) e adicione a importação em `tests/run.mjs`.

## Rodar localmente

```bash
python -m http.server 8000
# Depois acesse http://localhost:8000
```

## Publicar no GitHub Pages

1. No repositório: **Settings → Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. O site fica em `https://<usuario>.github.io/Concurso/`.
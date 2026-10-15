# AGENTS.md — Concurso Lab

Guia de uso do Claude Code para o projeto **Concurso Lab**.

## Projeto

Plataforma educacional de estudos para concursos públicos com HTML, CSS e JS (módulos ES). Roda no navegador, publicado no GitHub Pages.

## Comandos

- `python -m http.server 8000` — inicia servidor de desenvolvimento em `http://localhost:8000`.
- `node tests/run.mjs` — roda todos os testes do domínio.

## Arquitetura (hexagonal)

```
src/
  domain/          regras puras (sem navegador)
  application/     portas e casos de uso
  adapters/
    storage/      localStorage
    content/      dados estáticos (/data)
    sql/          sql.js (SQLite WebAssembly)
    code/         execução isolada (Web Worker, PHP WASM)
    ui/           roteador, telas, laboratórios
  main.js          raiz de composição
data/              concursos.json, trilhas.json, questoes.json
tests/             testes Node do domínio
```

## Laboratórios

Ver `src/adapters/ui/labs/registro.js` para o catálogo completo. Cada laboratório tem:
- Implementação em `src/domain/lab-<nome>/index.js` (regras puras).
- Missões em `src/domain/lab-<nome>/misssoes.js`.
- UI em `src/adapters/ui/labs/<nome>.js`.

Laboratórios existentes:
- `linux`, `sql`, `ide`, `aws`, `redes`, `bi`, `planilha`, `contabil`, `saude`, `educacao`.
- `servidor` — Montagem de Servidor (Ubuntu simulado).
- `scrum` — Time Scrum (product backlog, sprint, burndown, retrospectiva).
- `system-design` — System Design (requisitos, arquitetura, componentes, trade-offs, avaliação).

## Padrões

- Módulos ES (`import`/`export`), sem dependências externas.
- O domínio não conhece DOM, rede nem armazenamento.
- Laboratórios persistem estado via `labs.carregar(id)` / `labs.salvar(id, estado)`.
- Use `toast()` para feedback, `esc()` para escapar HTML.
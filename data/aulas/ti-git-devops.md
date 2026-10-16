---
id: ti-git-devops
titulo: Git, CI/CD e DevOps
area: ti
disciplina: Engenharia de software
cargos: 402, 206
labs: git, docker, code
resumo: Controle de versão distribuído, branches e merge, integração e entrega contínuas, contêineres e cultura DevOps.
ordem: 10
---
# Git em três áreas

- **Diretório de trabalho** → `git add` → **index (stage)** → `git commit` → **repositório**
- Distribuído: cada clone tem o histórico completo
- `fetch` baixa sem integrar; `pull` = fetch + merge; `push` envia commits

---

# Branches e integração

- **Fast-forward**: só avança o ponteiro (sem commit de merge)
- **3-way merge**: cria commit com dois pais; conflito quando os dois lados mudam a mesma parte
- `rebase` reescreve commits sobre outra base (histórico linear); `revert` cria commit que desfaz; `reset` move o ponteiro

---

# CI/CD e DevOps

- **Integração contínua**: cada push dispara build + testes automatizados
- **Entrega contínua**: artefato sempre pronto para produção (deploy com aprovação)
- **Implantação contínua**: deploy automático em produção
- Estratégias: blue-green, canário, rolling update
- DevOps: cultura de colaboração dev + ops, automação e feedback rápido (métricas DORA)

---

# Contêiner × máquina virtual

| | Contêiner | VM |
|---|---|---|
| Isolamento | namespaces/cgroups | hipervisor |
| SO | compartilha o kernel | SO completo |
| Inicialização | segundos | minutos |
| Exemplo | Docker, Kubernetes | VMware, KVM |

::: cartoes
git pull equivale a… :: git fetch + git merge.
Merge fast-forward :: Só move o ponteiro da branch, sem commit de merge.
Diferença entre entrega e implantação contínua :: Na entrega o deploy em produção é manual/aprovado; na implantação é automático.
Contêiner compartilha… :: O kernel do sistema hospedeiro.
:::

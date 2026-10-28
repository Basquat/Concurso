---
id: ti-seguranca-continuidade
titulo: Segurança da informação e continuidade de serviços
area: ti
disciplina: Segurança da informação
cargos: 402, 206
labs: linux, system-design
resumo: Organize gestão de riscos, controles, resposta a incidentes, recuperação e continuidade sem confundir prevenção com disponibilidade garantida.
nivel: avancado
ordem: 13
duracao: 45
busca: segurança informação continuidade incidente risco RTO RPO recuperação backup disponibilidade gestão
---
# Segurança como gestão de risco

Segurança protege confidencialidade, integridade e disponibilidade da informação e dos serviços, considerando autenticidade, responsabilização e requisitos de negócio. O controle deve responder a risco identificado; acumular ferramentas sem processo, responsáveis ou evidência não garante segurança.

A gestão de risco identifica ativos, ameaças, vulnerabilidades, impacto e probabilidade; avalia opções de tratamento (mitigar, evitar, transferir ou aceitar dentro da governança) e revisa o risco residual. A classificação depende do contexto e precisa ser atualizada quando sistemas ou ameaças mudam.

---
# Controles e defesa em profundidade

Controles administrativos, técnicos e físicos se complementam: políticas e treinamento, MFA e menor privilégio, segmentação, firewall, monitoramento, proteção física e processos de resposta. IDS detecta eventos suspeitos; IPS pode atuar para bloquear tráfego conforme regras configuradas; falsos positivos e negativos devem ser tratados.

Registro centralizado apoia investigação quando há sincronização temporal, retenção, integridade e controle de acesso adequados. Monitore o necessário e respeite privacidade, legislação e finalidade institucional.

::: quiz
? Qual distinção descreve melhor IDS e IPS em termos gerais?
- [ ] IDS cifra dados; IPS substitui autenticação
- [x] IDS detecta e alerta; IPS pode prevenir/bloquear automaticamente conforme configuração
- [ ] IDS e IPS são sinônimos de backup
- [ ] IPS apenas armazena registros sem atuar
= A capacidade de resposta automática do IPS depende de implementação e configuração; ambos exigem monitoramento e ajuste.
:::

---
# Incidentes: preparar, detectar, conter, recuperar

Um plano de resposta atribui papéis, canais e critérios de escalonamento. Ao suspeitar de incidente, preserve evidências, contenha o risco de forma proporcional e acione responsáveis; mudanças apressadas podem destruir dados ou ampliar o impacto.

Após contenção e erradicação, recupere serviços a partir de fontes confiáveis, valide integridade e monitore sinais de retorno. Registre decisões, escopo, impacto e comunicação requerida. A revisão pós-incidente identifica causas e melhorias sem reduzir análise a culpabilização individual.

---
# Continuidade e recuperação

Análise de impacto identifica processos críticos, dependências e tolerância a interrupções. O **RTO** representa o tempo-alvo para restabelecimento; o **RPO** indica a perda de dados tolerável em termos de tempo. São objetivos de planejamento, não garantias automáticas.

Redundância ajuda contra algumas falhas, mas pode replicar corrupção ou ataque. Backups precisam de cópias protegidas e testes de restauração; exercícios simulam cenários, verificam contatos, dependências e capacidade real de cumprir objetivos.

---
# Resiliência e revisão

Continuidade exige coordenação entre tecnologia, equipes, fornecedores e comunicação. Um serviço crítico deve ter responsáveis, procedimentos de contingência e critérios de retorno ao funcionamento normal.

Reavalie riscos após mudanças, incidentes e exercícios. Medidas devem ser verificáveis: evidência de restauração testada vale mais que a simples existência de uma tarefa automática sem confirmação.

::: cartoes
RTO :: Tempo-alvo para restabelecer um serviço após interrupção.
RPO :: Perda de dados tolerável definida em termos de tempo de recuperação.
IDS :: Sistema de detecção e alerta de atividades suspeitas.
IPS :: Sistema que pode prevenir ou bloquear tráfego/atividade conforme a configuração.
Defesa em profundidade :: Controles complementares em camadas; nenhum controle isolado elimina todo risco.
Backup testado :: Cópia cuja recuperação e integridade foram verificadas em ensaio controlado.
:::

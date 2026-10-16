---
id: ti-infra-virtualizacao
titulo: Infraestrutura — virtualização, contêineres, alta disponibilidade, armazenamento e nuvem
area: ti
disciplina: Computação em nuvem
cargos: 402, 206
labs: docker, aws
resumo: Hipervisores tipo 1 e 2, paravirtualização, Docker e Kubernetes, cluster e balanceamento, RAID, SAN x NAS, backup e deduplicação, servidores web e de aplicação, IaaS/PaaS/SaaS.
ordem: 5
busca: virtualização hipervisor vmware kvm hyper-v paravirtualização docker kubernetes cluster failover balanceamento raid san nas iscsi backup deduplicação tomcat jboss nginx apache iaas paas saas
---
# Virtualização

- **Hipervisor tipo 1** (bare metal, direto no hardware): VMware **ESXi**, **Hyper-V**, **KVM**, Xen
- **Tipo 2** (hospedado sobre um SO): VirtualBox, VMware Workstation
- **Virtualização total** (SO convidado sem alteração) × **paravirtualização** (SO convidado modificado, cooperando com o hipervisor) × **emulação** (simula outra arquitetura de CPU — mais lenta)
- **Contêiner** (Docker) compartilha o **kernel** do host: mais leve, sobe em segundos; VM tem SO completo e isolamento mais forte

---

# Kubernetes e DevOps de infraestrutura

- **Pod** (menor unidade, um ou mais contêineres) · **Deployment** (réplicas e atualização gradual) · **Service** (endereço estável e balanceamento) · **Namespace**
- **Infraestrutura como código** (Terraform, Ansible): ambientes versionados e reproduzíveis
- **Observabilidade**: **métricas**, **logs** e **traces** (Prometheus, Grafana, ELK)

---

# Alta disponibilidade

- **Cluster** ativo-ativo (todos atendem) × ativo-passivo (reserva assume no **failover**)
- **Balanceamento de carga**: round robin, menos conexões, hash de IP; **health check** retira nós com falha
- **Replicação de estado**: sessões compartilhadas (Redis) ou **sticky session**
- **Escalabilidade vertical** (máquina maior) × **horizontal** (mais máquinas)
- **Grid**: recursos distribuídos e heterogêneos cooperando em tarefas de grande porte

---

# RAID e armazenamento

| RAID | Técnica | Mín. discos | Tolera |
|---|---|---|---|
| 0 | distribuição (striping) | 2 | **nenhuma** falha |
| 1 | espelhamento | 2 | 1 disco (50% de capacidade útil) |
| 5 | striping + **paridade distribuída** | **3** | **1** disco |
| 6 | paridade **dupla** | 4 | **2** discos |
| 10 | espelhamento + striping | 4 | 1 por par espelhado |

- **SAN**: rede dedicada com acesso em **blocos** (Fibre Channel, **iSCSI**) · **NAS**: acesso a **arquivos** pela rede (NFS, SMB) · **DAS**: disco ligado direto ao servidor
- **Multipathing** (ex.: EMC PowerPath): vários caminhos ao storage, com failover e balanceamento
- **Deduplicação**: guarda uma só cópia de blocos repetidos · **RPO** (quanto dado posso perder) × **RTO** (em quanto tempo volto)

---

# Servidores web, de aplicação e nuvem

- **Apache httpd** (módulos, .htaccess) · **Nginx** (orientado a eventos, ótimo como **proxy reverso**) · **IIS** (Windows)
- **Tomcat**: contêiner de **Servlets/JSP** (não implementa o Jakarta EE completo) · **JBoss/WildFly**: servidor **Jakarta EE completo** (EJB, JMS para mensageria, clustering)
- Nuvem: **IaaS** (VMs, redes — EC2) · **PaaS** (plataforma gerenciada — App Engine, RDS) · **SaaS** (software pronto) · modelos pública, privada, híbrida; **edge computing** processa perto da origem dos dados

::: quiz
? Um arranjo RAID com 4 discos que continua funcionando após a falha de quaisquer 2 discos é o:
- [ ] RAID 5
- [x] RAID 6
- [ ] RAID 0
= RAID 6 usa paridade dupla e tolera duas falhas; RAID 5 tolera uma; RAID 0 nenhuma.
:::

::: cartoes
Hipervisor tipo 1 :: Roda direto no hardware (ESXi, Hyper-V, KVM).
Paravirtualização :: SO convidado modificado para cooperar com o hipervisor.
Contêiner × VM :: Contêiner compartilha o kernel do host; VM tem SO próprio.
RAID 5 :: Mínimo de 3 discos; tolera 1 falha.
RAID 1 :: Espelhamento.
SAN × NAS :: SAN entrega blocos; NAS entrega arquivos.
RPO × RTO :: Perda de dados tolerada × tempo de recuperação.
Tomcat × WildFly :: Contêiner de servlets × servidor Jakarta EE completo.
:::

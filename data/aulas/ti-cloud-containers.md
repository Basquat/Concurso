---
id: ti-cloud-containers
titulo: Computação em nuvem, contêineres e Kubernetes
area: ti
disciplina: Tecnologia da Informação
cargos: 206, 402
labs: docker, aws, governanca-ti
resumo: Características da nuvem (NIST), modelos de serviço e de implantação, contêiner x máquina virtual, Docker, orquestração com Kubernetes, microsserviços e infraestrutura como código.
ordem: 16
busca: computação em nuvem nist autoatendimento elasticidade serviço medido iaas paas saas nuvem pública privada híbrida comunitária contêiner máquina virtual docker imagem dockerfile kubernetes pod deployment service microsserviços infraestrutura como código terraform serverless
---
# Nuvem (NIST)

- Características: **autoatendimento sob demanda**, amplo acesso à rede, **pool de recursos**, **elasticidade rápida** e **serviço medido** (pague pelo uso)
- Modelos de serviço: **IaaS** (VMs, redes), **PaaS** (plataforma para executar código), **SaaS** (software pronto)
- Implantação: **pública**, **privada**, **comunitária** e **híbrida**
- **Responsabilidade compartilhada**: quanto mais "aaS", mais responsabilidade do provedor

---

# Contêiner x máquina virtual

| | Máquina virtual | Contêiner |
|---|---|---|
| Isola | o **sistema operacional inteiro** (hypervisor) | **processos**, compartilhando o kernel |
| Tamanho | GBs | MBs |
| Início | minutos | segundos |

- **Docker**: **imagem** (modelo imutável, em camadas, definida no **Dockerfile**) → **contêiner** (instância em execução); registros como Docker Hub

---

# Kubernetes

- Orquestra contêineres em **cluster**: escalonamento, autorrecuperação, atualizações graduais
- Objetos: **Pod** (menor unidade, um ou mais contêineres), **Deployment** (réplicas e versões), **Service** (endereço estável e balanceamento), **Ingress**, **ConfigMap/Secret**
- **HPA**: escala automática por métricas

---

# Arquitetura moderna

- **Microsserviços**: serviços pequenos, independentes, com deploy próprio, comunicando-se por APIs ou mensageria — mais escalável, mais complexo de operar
- **Serverless** (funções sob demanda, ex.: AWS Lambda): paga por execução
- **Infraestrutura como código** (Terraform, Ansible, CloudFormation): ambientes reproduzíveis e versionados
- **DevOps**: integração e entrega contínuas (CI/CD), observabilidade

::: quiz
? A menor unidade implantável no Kubernetes é o:
- [ ] Deployment
- [ ] Service
- [x] Pod
- [ ] Node
= O Pod agrupa um ou mais contêineres que compartilham rede e armazenamento.
:::

::: cartoes
Elasticidade :: Aumentar e reduzir recursos rapidamente conforme a demanda.
Contêiner x VM :: Contêiner compartilha o kernel; VM virtualiza o SO inteiro.
Imagem Docker :: Modelo imutável em camadas, definido no Dockerfile.
Pod :: Menor unidade implantável no Kubernetes.
Infraestrutura como código :: Ambientes descritos em arquivos versionados (ex.: Terraform).
:::

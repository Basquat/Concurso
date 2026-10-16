---
id: ti-ip-roteamento
titulo: Endereçamento IP, sub-redes, VLAN e roteamento
area: ti
disciplina: Redes de computadores
cargos: 402, 206
labs: redes
resumo: IPv4 e sub-redes (CIDR), endereços privados, NAT, IPv6, VLAN 802.1Q, RIP, OSPF e BGP, MPLS, QoS e SDN.
ordem: 2
busca: ipv4 ipv6 subnetting cidr máscara nat vlan 802.1q roteamento rip ospf bgp mpls qos sdn
---
# IPv4 e CIDR

- 32 bits em 4 octetos; **máscara** separa rede e host: /24 = 255.255.255.0
- Hosts por sub-rede: **2^(32 − n) − 2** (rede e broadcast) — /24: 254 · /26: 62 · /30: 2
- **Privados** (RFC 1918): **10.0.0.0/8**, **172.16.0.0/12**, **192.168.0.0/16** · loopback 127.0.0.0/8 · APIPA 169.254.0.0/16
- Exemplo: 192.168.10.0/26 → sub-redes **.0, .64, .128, .192**; a primeira vai de .1 a .62, broadcast **.63**

---

# NAT e IPv6

- **NAT/PAT**: muitos IPs privados saem por um IP público, diferenciados por **porta**
- **IPv6**: **128 bits**, 8 grupos hexadecimais de 16 bits; zeros à esquerda podem sumir e **::** substitui uma única sequência de grupos zerados
  - `2001:0db8:0000:0000:0000:0000:0000:0001` → `2001:db8::1`
- Sem **broadcast** (usa multicast e anycast); **NDP** substitui o ARP; loopback **::1**; link-local **fe80::/10**; cabeçalho simplificado

---

# VLAN e comutação

- **VLAN**: segmenta logicamente um switch em domínios de broadcast separados
- **802.1Q**: insere a **tag** da VLAN no quadro; porta **trunk** carrega várias VLANs; porta **access**, uma só
- Comunicação entre VLANs exige **roteamento** (roteador ou switch camada 3)
- **STP** (802.1D) evita loops em topologias redundantes

---

# Protocolos de roteamento

| Protocolo | Tipo | Destaques |
|---|---|---|
| **RIP** | vetor de distância (IGP) | métrica = **saltos**, máximo **15** (16 = inalcançável) |
| **OSPF** | estado de enlace (IGP) | algoritmo de **Dijkstra**, **áreas** (área 0 = backbone), métrica = custo |
| **BGP** | vetor de caminho (**EGP**) | roteamento **entre sistemas autônomos** da internet; TCP **179** |

---

# MPLS, QoS e SDN

- **MPLS**: encaminha por **rótulos** (labels) — "camada 2,5"; roteadores LER (borda) e LSR (núcleo); base de VPNs de operadoras
- **QoS**: priorização de tráfego — **DiffServ** (marca DSCP por classe) e **IntServ** (reserva com RSVP); essencial para **VoIP**
- **SDN**: separa **plano de controle** (controlador centralizado) do **plano de dados** (switches); protocolo **OpenFlow**
- **SD-WAN**: SDN aplicada à WAN, escolhendo dinamicamente links (MPLS, internet, 4G)

::: quiz
? Quantos hosts utilizáveis há em uma sub-rede /27?
- [ ] 32
- [x] 30
- [ ] 62
= 2^(32−27) − 2 = 32 − 2 = 30.
:::

::: cartoes
Hosts em /n :: 2^(32 − n) − 2.
Faixas privadas IPv4 :: 10/8, 172.16/12, 192.168/16.
IPv6 :: 128 bits; "::" abrevia uma única sequência de zeros.
802.1Q :: Padrão de tag de VLAN em portas trunk.
RIP :: Vetor de distância; máximo 15 saltos.
OSPF :: Estado de enlace; Dijkstra; área 0 é o backbone.
BGP :: Roteamento entre sistemas autônomos (EGP), TCP 179.
SDN :: Separa plano de controle do plano de dados.
:::

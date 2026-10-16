---
id: ti-servicos-rede
titulo: Serviços de rede — DNS, DHCP, HTTP, e-mail, diretório, gerência, Wi-Fi e VoIP
area: ti
disciplina: Redes de computadores
cargos: 402, 206
labs: redes, servidor
resumo: Registros DNS, processo DORA do DHCP, HTTP e proxy, SMTP/POP/IMAP, LDAP, SNMP, NTP, padrões 802.11 e segurança Wi-Fi, SIP e RTP.
ordem: 3
busca: dns registros a aaaa mx cname dhcp dora http status proxy reverso smtp ldap snmp ntp wi-fi 802.11 wpa3 voip sip rtp portas
---
# DNS

- Traduz nomes em IPs; usa **UDP 53** (TCP 53 em transferência de zona e respostas grandes)
- Consulta **recursiva** (o resolvedor resolve tudo para o cliente) × **iterativa** (cada servidor indica o próximo)
- Registros: **A** (IPv4) · **AAAA** (IPv6) · **CNAME** (apelido) · **MX** (servidor de e-mail) · **NS** (servidor autoritativo) · **PTR** (reverso) · **SOA** · **TXT** (SPF, DKIM)
- No Brasil, o **Registro.br** (NIC.br) administra o domínio **.br**

---

# DHCP

- Atribui IP, máscara, gateway e DNS automaticamente; servidor **UDP 67**, cliente **UDP 68**
- Processo **DORA**: **D**iscover (broadcast) → **O**ffer → **R**equest → **A**cknowledge
- **Concessão** (lease) com tempo de validade; **reserva** fixa um IP para um MAC; **DHCP relay** encaminha pedidos entre sub-redes

---

# Web, proxy e e-mail

- **HTTP**: métodos GET, POST, PUT, PATCH, DELETE; status **2xx** sucesso, **3xx** redirecionamento, **4xx** erro do cliente (401, 403, **404**), **5xx** erro do servidor; HTTP/3 roda sobre **QUIC (UDP)**
- **Proxy** (encaminha clientes para a internet, cache e filtragem) × **proxy reverso** (fica na frente dos servidores: balanceamento, TLS, cache — ex.: Nginx)
- E-mail: **SMTP** (envio, 25/587) · **POP3** (110/995) · **IMAP** (143/993)

---

# Portas e serviços de infraestrutura

| Serviço | Porta | Serviço | Porta |
|---|---|---|---|
| FTP | 20/21 | SSH / SFTP | 22 |
| Telnet | 23 | HTTP | 80 |
| HTTPS | 443 | **LDAP** / LDAPS | 389 / 636 |
| **SNMP** | 161 (traps 162) | **NTP** | 123 |
| Kerberos | 88 | RDP | 3389 |

- **SNMP**: gerente consulta agentes (MIB); **v3** traz autenticação e criptografia
- **NTP**: sincroniza relógios — essencial para logs, Kerberos e certificados

---

# Wi-Fi e VoIP

| Padrão | Faixa | Nome comercial |
|---|---|---|
| 802.11b / g | 2,4 GHz | — (11 / 54 Mbps) |
| 802.11a | 5 GHz | — (54 Mbps) |
| 802.11n | 2,4 e 5 GHz, MIMO | Wi-Fi 4 |
| 802.11ac | 5 GHz | Wi-Fi 5 |
| 802.11ax | 2,4, 5 e 6 GHz | Wi-Fi 6 / 6E |

- Segurança: **WEP** (quebrado) → WPA → **WPA2** (AES-CCMP) → **WPA3** (SAE); corporativo com **802.1X/EAP** (PEAP) e RADIUS
- **VoIP**: **SIP** (sinalização, 5060) + **RTP** (mídia); sensível a **latência, jitter e perda**

::: quiz
? O registro DNS que indica o servidor de e-mail de um domínio é o:
- [ ] CNAME
- [x] MX
- [ ] PTR
= MX (mail exchanger). CNAME é apelido; PTR é resolução reversa.
:::

::: cartoes
Registro A × AAAA :: IPv4 × IPv6.
Registro MX :: Servidor de e-mail do domínio.
Registro PTR :: Resolução reversa (IP → nome).
DORA :: Discover, Offer, Request, Acknowledge (DHCP).
Proxy reverso :: Fica na frente dos servidores (balanceamento, TLS, cache).
SNMP :: Gerência de rede; UDP 161; v3 com segurança.
WPA3 :: Usa SAE no lugar da chave pré-compartilhada do WPA2.
SIP × RTP :: SIP sinaliza a chamada; RTP transporta a voz.
:::

---
id: ti-seguranca-ataques
titulo: Segurança — malwares, ataques e mecanismos de defesa
area: ti
disciplina: Segurança da informação
cargos: 402, 206
labs: linux
resumo: Tipos de malware, ataques de rede e de aplicação (DDoS, spoofing, SQL injection, XSS, buffer overflow, APT), firewall, IDS/IPS, WAF, VPN, Zero Trust, SIEM, EDR, IAM e PAM.
ordem: 7
busca: segurança malware vírus worm trojan rootkit ransomware ddos spoofing sql injection xss csrf buffer overflow apt firewall ids ips waf vpn zero trust siem edr iam pam mfa
---
# Malwares

| Tipo | Característica |
|---|---|
| **Vírus** | infecta arquivos/programas; precisa ser **executado** e de **hospedeiro** |
| **Worm** | **autorreplica-se pela rede** explorando falhas, sem hospedeiro |
| **Cavalo de troia** | disfarça-se de programa legítimo |
| **Ransomware** | **cifra** os dados e exige resgate |
| **Spyware / keylogger / screenlogger** | espionam; registram teclas / telas |
| **Backdoor** | mantém acesso oculto |
| **Rootkit** | **esconde** a presença do invasor com privilégios elevados |
| **Bot / botnet** | máquina controlada remotamente; rede de bots usada em DDoS e spam |

---

# Ataques de rede

- **DoS / DDoS**: esgotam recursos (SYN flood, amplificação DNS/NTP) — DDoS parte de muitas origens (botnet)
- **IP spoofing**: forja o endereço de origem · **ARP spoofing**: envenena tabelas para fazer **man-in-the-middle**
- **Port scan** (nmap): mapeia portas e serviços abertos — reconhecimento
- **Session hijacking**: rouba o identificador de sessão (cookie) · **sniffing**: captura tráfego (Wireshark)
- **Força bruta** e **credential stuffing** contra logins

---

# Ataques a aplicações e pessoas

- **SQL injection**: entrada do usuário vira parte da consulta → use **consultas parametrizadas**
- **XSS**: injeta script no navegador da vítima (armazenado, refletido, DOM) → **codificar a saída** e **CSP**
- **CSRF**: força o navegador logado a fazer requisição → tokens anti-CSRF, SameSite
- **Buffer overflow**: escreve além do limite da memória e desvia a execução
- **Phishing** (em massa) × **spear phishing** (direcionado) × whaling (alto escalão); **APT**: ataque persistente, furtivo e prolongado contra alvo específico

---

# Mecanismos de defesa

- **Firewall**: filtro de pacotes (stateless) → **stateful** (acompanha conexões) → aplicação/NGFW; **DMZ** isola servidores expostos
- **IDS** detecta e alerta (passivo) × **IPS** bloqueia (em linha); por **assinatura** ou por **anomalia**; NIDS (rede) × HIDS (host)
- **WAF**: firewall de aplicação web (camada 7) contra SQLi, XSS · **VPN** (IPsec, TLS): túnel cifrado · **proxy**, **NAC**, **honeypot**
- **Zero Trust**: "nunca confie, sempre verifique" — autenticar e autorizar **cada acesso**, mínimo privilégio, microssegmentação
- **SIEM**: coleta e **correlaciona logs** para detectar incidentes · **EDR/XDR**: detecção e resposta no endpoint (e além)
- **IAM** (identidades e acessos) · **PAM** (contas **privilegiadas**) · **MFA**: algo que você **sabe**, **tem** e **é**

::: quiz
? O malware que se propaga sozinho pela rede, explorando vulnerabilidades, sem precisar de um arquivo hospedeiro, é o:
- [ ] vírus
- [x] worm
- [ ] rootkit
= Worm se autorreplica pela rede; vírus depende de hospedeiro e execução.
:::

::: cartoes
Worm × vírus :: Worm se propaga sozinho pela rede; vírus precisa de hospedeiro.
Rootkit :: Esconde a presença do invasor no sistema.
IDS × IPS :: IDS detecta e alerta; IPS bloqueia em linha.
WAF :: Firewall de aplicação web (camada 7).
Prevenção de SQL injection :: Consultas parametrizadas (prepared statements).
Spear phishing :: Phishing direcionado a uma pessoa ou grupo.
SIEM :: Coleta e correlaciona logs de segurança.
Zero Trust :: Nunca confie, sempre verifique cada acesso.
:::

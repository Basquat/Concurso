---
id: ti-criptografia-gestao
titulo: Criptografia, certificação digital e gestão da segurança (ISO 27000)
area: ti
disciplina: Segurança da informação
cargos: 402, 206
labs: code
resumo: Pilares da segurança, criptografia simétrica e assimétrica, hash, assinatura e certificado digital (ICP-Brasil), TLS, família ISO 27000, gestão de riscos, incidentes e continuidade.
ordem: 8
busca: criptografia simétrica assimétrica aes rsa hash sha-256 assinatura digital certificado icp-brasil tls openssl iso 27001 27002 27005 risco incidente continuidade cid
---
# Pilares

- **Confidencialidade** (só quem pode lê) · **Integridade** (não foi alterado) · **Disponibilidade** (acessível quando preciso) — tríade **CID**
- **Autenticidade** (origem comprovada) · **Não repúdio** (o autor não pode negar)
- Ameaça explora **vulnerabilidade** de um **ativo** → **risco** = probabilidade × impacto

---

# Criptografia

| | Simétrica | Assimétrica |
|---|---|---|
| Chaves | **uma** chave compartilhada | **par**: pública e privada |
| Exemplos | **AES**, 3DES, ChaCha20 | **RSA**, ECC, Diffie-Hellman (troca de chaves) |
| Vantagem | **rápida** | resolve a **distribuição de chaves** |
| Uso | cifrar grandes volumes | troca de chaves e assinatura |

- **Confidencialidade**: cifra com a **pública do destinatário**; só a **privada** dele decifra
- **Hash** (SHA-256, SHA-3): resumo de tamanho fixo, **não reversível** → integridade; **MD5 e SHA-1** são considerados inseguros

---

# Assinatura e certificado digital

- **Assinatura digital**: hash do documento cifrado com a **chave privada do autor**; quem verifica usa a **pública** → **autenticidade, integridade e não repúdio** (não garante sigilo)
- **Certificado digital** (X.509): liga uma **chave pública** a uma identidade, **assinado por uma Autoridade Certificadora**
- **ICP-Brasil**: AC Raiz mantida pelo **ITI**; documentos assinados com certificado ICP-Brasil têm presunção de validade jurídica
- **TLS**: o handshake usa criptografia **assimétrica** para combinar uma chave de sessão **simétrica**; **OpenSSL** gera chaves, CSRs e certificados

---

# Família ISO/IEC 27000

| Norma | Conteúdo |
|---|---|
| **27001** | **requisitos** do SGSI — é a **certificável** (ciclo PDCA, Anexo A de controles) |
| **27002** | **código de prática**: orientações para implementar os controles (versão 2022: organizacionais, pessoas, físicos e tecnológicos) |
| 27003 | guia de implementação do SGSI |
| 27004 | monitoramento, medição e avaliação |
| **27005** | **gestão de riscos** de segurança da informação |
| 27701 | extensão para **privacidade** (gestão de informações pessoais) |

---

# Riscos, incidentes e continuidade

- Tratamento do risco: **mitigar**, **transferir/compartilhar** (seguro), **evitar**, **aceitar**
- **Gestão de ativos**: inventário, proprietário, classificação da informação
- **Resposta a incidentes**: preparação → detecção e análise → **contenção**, erradicação e recuperação → lições aprendidas; no Brasil, CSIRTs e o **CERT.br**
- **Continuidade de negócios** (ISO 22301): análise de impacto (**BIA**), RPO, RTO, plano de recuperação de desastres
- **Política de segurança**: documento aprovado pela alta direção, divulgado e revisado periodicamente

::: quiz
? Para que somente o destinatário consiga ler uma mensagem, o remetente deve cifrá-la com:
- [ ] a própria chave privada
- [x] a chave pública do destinatário
- [ ] a chave privada do destinatário
= O que se cifra com a pública só se decifra com a privada correspondente, que só o destinatário tem.
:::

::: cartoes
Tríade CID :: Confidencialidade, integridade e disponibilidade.
Simétrica × assimétrica :: Uma chave compartilhada × par de chaves.
Assinatura digital :: Hash cifrado com a chave privada do autor.
Assinatura garante :: Autenticidade, integridade e não repúdio (não sigilo).
Certificado digital :: Chave pública + identidade, assinados por uma AC.
ISO 27001 :: Requisitos do SGSI (certificável).
ISO 27002 :: Código de prática dos controles.
ISO 27005 :: Gestão de riscos de segurança da informação.
:::

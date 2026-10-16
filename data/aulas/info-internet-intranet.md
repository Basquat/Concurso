---
id: info-internet-intranet
titulo: Internet, intranet, extranet e ferramentas de busca
area: informatica
disciplina: Noções de Informática
cargos: todos
resumo: Internet x intranet x extranet, URL, protocolos (HTTP, HTTPS, DNS), serviços da web e operadores de busca do Google.
ordem: 2
busca: internet intranet extranet url http https dns busca google operadores site filetype
---
# Internet, intranet e extranet

- **Internet**: rede mundial de redes, pública, baseada em **TCP/IP**
- **Intranet**: rede **privada** da organização que usa as **mesmas tecnologias** da internet (navegador, HTTP, e-mail) — acesso restrito a usuários autorizados
- **Extranet**: parte da intranet aberta a **parceiros externos** (fornecedores, outros órgãos), com autenticação
- Intranet **pode** ser acessada de fora por VPN e pode ter acesso à internet

---

# Endereços e protocolos

- **URL**: `https://www.ufba.br/concursos/edital.pdf` → **protocolo** (https) · **domínio** (www.ufba.br) · **caminho** (/concursos/edital.pdf)
- **HTTP** (porta 80): transfere páginas · **HTTPS** (porta 443): HTTP + **TLS** (criptografia; cadeado no navegador)
- **DNS**: traduz nomes (ufba.br) em endereços **IP**
- Domínios: **.gov.br** (governo), **.edu.br** (educação), **.org.br**; **.br** é o país

---

# Buscadores — operadores do Google

| Operador | Efeito | Exemplo |
|---|---|---|
| "aspas" | frase exata | "edital 007/2026" |
| − (menos) | exclui termo | concurso −militar |
| site: | busca dentro de um site | site:ufba.br estatuto |
| filetype: | tipo de arquivo | lei 8112 filetype:pdf |
| OR | um ou outro termo | UFBA OR UFRB |
| * | curinga | "lei * acesso à informação" |

---

# Serviços da internet

- **Web** (páginas), **e-mail**, **FTP** (transferência de arquivos), **VoIP** e videoconferência, **streaming**, **computação em nuvem**
- **Navegador** acessa a web; **buscador** indexa páginas (não é a mesma coisa)

::: quiz
? Uma rede privada de um órgão, acessível apenas aos servidores e baseada nas tecnologias da internet, é uma:
- [ ] extranet
- [x] intranet
- [ ] internet pública
= Intranet: privada, com os protocolos e ferramentas da internet. Extranet a abre a parceiros externos.
:::

::: cartoes
Intranet :: Rede privada que usa as tecnologias da internet.
Extranet :: Parte da intranet acessível a parceiros externos autorizados.
HTTPS :: HTTP com criptografia TLS (porta 443).
DNS :: Converte nomes de domínio em endereços IP.
site: :: Restringe a busca a um site.
filetype: :: Restringe a busca a um tipo de arquivo.
:::

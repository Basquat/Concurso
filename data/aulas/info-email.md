---
id: info-email
titulo: Correio eletrônico e Outlook
area: informatica
disciplina: Noções de Informática
cargos: todos
resumo: Campos Para, Cc e Cco, responder, responder a todos e encaminhar, anexos, protocolos SMTP, POP3 e IMAP, pastas, regras e spam.
ordem: 4
busca: email correio eletrônico outlook cc cco encaminhar responder a todos smtp pop imap anexo spam
---
# Campos da mensagem

- **Para**: destinatários principais
- **Cc** (com cópia): recebem cópia; **todos veem** quem está em Cc
- **Cco** (com cópia oculta): recebem, mas **ninguém vê** quem está em Cco
- **Assunto**, corpo, **anexos**, prioridade, confirmação de leitura (o destinatário pode recusar)

---

# Responder × encaminhar

| Ação | Vai para | Anexo original |
|---|---|---|
| **Responder** | só o remetente | não vai |
| **Responder a todos** | remetente + Para + Cc (não Cco) | não vai |
| **Encaminhar** | quem você escolher | **vai** |

---

# Protocolos

- **SMTP**: **envio** de mensagens (portas 25/587)
- **POP3**: **baixa** as mensagens para o computador; em geral **remove** do servidor (porta 110; 995 com SSL)
- **IMAP**: **sincroniza** — mensagens ficam no servidor e aparecem igual em todos os aparelhos (porta 143; 993 com SSL)
- **Webmail**: acesso pelo navegador (usa HTTP/HTTPS)

---

# Outlook no dia a dia

- Pastas: Caixa de Entrada, Itens Enviados, Rascunhos, Lixo Eletrônico (spam), Itens Excluídos, Arquivo Morto
- **Regras**: mover ou sinalizar mensagens automaticamente (por remetente, assunto)
- **Calendário**, contatos, tarefas e reuniões integradas (Teams)
- Endereço: **usuario@dominio** — o @ separa a conta do domínio

> [!atencao] Golpes
> Desconfie de anexos inesperados (.exe, .js, .scr, macros em .docm/.xlsm) e links que pedem senha.

::: quiz
? Para enviar um comunicado a vários servidores sem que um veja o endereço dos outros, usa-se o campo:
- [ ] Para
- [ ] Cc
- [x] Cco
= Cópia oculta: destinatários não aparecem para os demais.
:::

::: cartoes
Cco :: Cópia oculta: ninguém vê quem recebeu por ali.
Encaminhar :: Reenvia a mensagem com os anexos originais.
Responder a todos :: Remetente + Para + Cc (não inclui Cco).
SMTP :: Protocolo de envio de e-mail.
IMAP :: Mantém as mensagens no servidor e sincroniza os aparelhos.
POP3 :: Baixa as mensagens para o dispositivo.
:::

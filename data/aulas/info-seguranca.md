---
id: info-seguranca
titulo: Segurança da informação para usuários
area: informatica
disciplina: Noções de Informática
cargos: todos
resumo: Malwares, phishing, senhas, autenticação em dois fatores, backup e navegação segura.
ordem: 8
---
# Tipos de malware

| Praga | Característica |
|---|---|
| Vírus | Precisa de hospedeiro e da execução do arquivo |
| Worm | Se propaga **sozinho** pela rede, explorando falhas |
| Cavalo de troia | Parece legítimo, executa ações ocultas |
| Ransomware | **Sequestra** (criptografa) dados e pede resgate |
| Spyware / keylogger | Espiona e captura o que é digitado |
| Botnet | Rede de máquinas zumbis controladas remotamente |

---

# Golpes e defesa

- **Phishing**: mensagem falsa que imita instituição para roubar dados — confira remetente e link real
- **Engenharia social**: explora confiança/urgência das pessoas
- Senhas longas e únicas + **autenticação em dois fatores**
- Firewall filtra tráfego; antivírus detecta malware; atualizações corrigem vulnerabilidades

---

# Backup

- **Completo**: copia tudo
- **Incremental**: só o que mudou desde o **último backup de qualquer tipo** (restauração: completo + todos os incrementais)
- **Diferencial**: o que mudou desde o **último completo** (restauração: completo + último diferencial)

> [!dica] Regra 3-2-1
> 3 cópias, em 2 mídias diferentes, 1 fora do local.

::: cartoes
Malware que se propaga sozinho :: Worm.
Malware que criptografa dados e pede resgate :: Ransomware.
Restauração com backup diferencial :: Último completo + último diferencial.
Restauração com backup incremental :: Último completo + todos os incrementais seguintes.
:::

---
id: ti-sistemas-operacionais
titulo: Sistemas operacionais — Linux, Windows Server, sistemas de arquivos e diretório
area: ti
disciplina: Sistemas operacionais Linux
cargos: 402, 206
labs: linux, servidor
resumo: Processos e memória, permissões Linux (chmod, umask, SUID), gerência de pacotes, LVM, NTFS x EXT x XFS, shell script Bash e PowerShell, Active Directory e OpenLDAP.
ordem: 4
busca: linux windows server processos permissões chmod umask suid sticky lvm ext4 xfs ntfs fat32 bash shell script powershell active directory gpo ldap samba nfs
---
# Fundamentos

- **Kernel** gerencia processos, memória, E/S e sistemas de arquivos; **shell** é a interface de comandos
- Estados do processo: novo → **pronto** → **executando** → **bloqueado** (espera E/S) → terminado
- **Memória virtual**: paginação, swap; **thrashing** quando o sistema passa mais tempo trocando páginas que executando
- Sinais: `kill -15` (SIGTERM, pede para encerrar) · `kill -9` (SIGKILL, força) · `ps`, `top`, `systemctl status nginx`

---

# Permissões no Linux

- `rwx` para **dono, grupo e outros**: r = 4, w = 2, x = 1 → `chmod 754 arq` = **rwxr-xr--**
- `chown usuario:grupo arq` · **umask 022** → arquivos 644, diretórios 755
- Especiais: **SUID** (4, executa com o dono — `passwd`), **SGID** (2, herda o grupo), **sticky bit** (1, só o dono apaga — `/tmp`)
- Diretórios: `/etc` (configurações), `/var/log` (logs), `/home`, `/root`, `/proc` (virtual, processos), `/dev`
- Pacotes: **apt/dpkg** (Debian/Ubuntu), **dnf/yum/rpm** (Red Hat), **zypper** (SUSE)

---

# Sistemas de arquivos e LVM

| Sistema | Destaques |
|---|---|
| FAT32 | sem journaling; arquivo de no máximo **4 GB** |
| NTFS | journaling, **ACLs**, compressão, criptografia (EFS), cotas |
| EXT2 | sem journaling |
| EXT3 / **EXT4** | com journaling; EXT4 usa extents e suporta volumes maiores |
| XFS | journaling, alto desempenho com arquivos grandes |

- Metadados no Linux ficam no **inode** (dono, permissões, datas, blocos — **não** o nome)
- **LVM**: discos físicos (**PV**) → grupo de volumes (**VG**) → volumes lógicos (**LV**) que podem crescer sem reformatar
- Compartilhamento: **SMB/CIFS** (Windows, Samba) e **NFS** (Unix/Linux)

---

# Shell script e PowerShell

```bash
#!/bin/bash
# backup.sh <pasta>
[ $# -lt 1 ] && { echo "uso: $0 pasta"; exit 1; }
tar -czf "/backup/$(date +%F).tar.gz" "$1" && echo "ok" || echo "falhou: $?"
```

- `$1` primeiro argumento · `$#` quantidade · `$?` código de saída do último comando (0 = sucesso) · `chmod +x` para executar
- **PowerShell**: cmdlets **Verbo-Substantivo** que trafegam **objetos** — `Get-Service | Where-Object Status -eq 'Running'`

---

# Active Directory e LDAP

- **AD DS**: diretório do Windows Server — **domínio**, **árvore**, **floresta**, **unidades organizacionais (OU)**, controladores de domínio
- **GPO** (Group Policy): aplica configurações e políticas a usuários e computadores por site, domínio ou OU
- Autenticação **Kerberos** (porta 88); consultas via **LDAP** (389)
- **OpenLDAP**: implementação livre do LDAP; entradas identificadas por **DN** (ex.: `uid=ana,ou=sti,dc=ufba,dc=br`)

::: quiz
? O comando chmod 640 relatorio.txt deixa as permissões como:
- [x] rw-r-----
- [ ] rwxr-----
- [ ] rw-rw----
= 6 = rw- (dono), 4 = r-- (grupo), 0 = --- (outros).
:::

::: cartoes
chmod 755 :: rwxr-xr-x.
umask 022 :: Arquivos 644 e diretórios 755.
Sticky bit :: Em /tmp: só o dono apaga seus arquivos.
SUID :: Executa com as permissões do dono do arquivo.
kill -9 :: SIGKILL (encerra à força).
$? no Bash :: Código de saída do último comando.
LVM :: PV → VG → LV.
FAT32 :: Arquivo de no máximo 4 GB.
GPO :: Políticas aplicadas a usuários e computadores do domínio.
:::

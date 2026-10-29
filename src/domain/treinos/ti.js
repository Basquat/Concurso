// Treinos de TI e informática: bases numéricas, permissões Linux, sub-redes (com o mesmo motor IPv4 do laboratório de
// Redes), protocolos, HTTP, segurança, engenharia de software, banco de dados, governança e arquivos do dia a dia.
import { escolha, inteiro } from './motor.js';
import { infoCidr, intParaIp } from '../network/ipv4.js';

const RWX = (o) => [4, 2, 1].map((b, i) => ((o & b) ? 'rwx'[i] : '-')).join('');
const simbolico = (oct) => String(oct).split('').map((d) => RWX(Number(d))).join('');

export default {
  'bases-numericas': {
    intro: 'Binário, decimal e hexadecimal, bits e bytes — conversões que caem em Informática e em TI.',
    teoria: 'Binário → decimal: some as potências de 2 onde há 1. Decimal → binário: divisões sucessivas por 2. Hexadecimal: dígitos 0–9 e A–F (A = 10 … F = 15); cada dígito hex = 4 bits. 1 byte = 8 bits; 1 KiB = 1.024 bytes.',
    exercicios: [
      { tipo: 'calc', id: 'bin-dec', titulo: 'Binário para decimal', formula: 'Σ bit × 2^posição', gerar: (r) => {
        const n = inteiro(r, 5, 255); const b = n.toString(2);
        return { enunciado: `Converta o binário ${b} para decimal.`, resposta: n, passos: `${b.split('').map((d, i) => (d === '1' ? `2^${b.length - 1 - i}` : null)).filter(Boolean).join(' + ')} = **${n}**` };
      } },
      { tipo: 'calc', id: 'dec-bin', titulo: 'Decimal para binário', formula: 'divisões sucessivas por 2', gerar: (r) => {
        const n = inteiro(r, 5, 255);
        return { enunciado: `Converta o decimal ${n} para binário (sem zeros à esquerda).`, resposta: n.toString(2), passos: `Restos das divisões por 2, de baixo para cima: **${n.toString(2)}**` };
      } },
      { tipo: 'calc', id: 'hex-dec', titulo: 'Hexadecimal para decimal', formula: 'Σ dígito × 16^posição', gerar: (r) => {
        const n = inteiro(r, 16, 4095); const h = n.toString(16).toUpperCase();
        return { enunciado: `Converta o hexadecimal ${h} para decimal.`, resposta: n, passos: `${h.split('').map((d, i) => `${parseInt(d, 16)}×16^${h.length - 1 - i}`).join(' + ')} = **${n}**` };
      } },
      { tipo: 'calc', id: 'dec-hex', titulo: 'Decimal para hexadecimal', formula: 'divisões sucessivas por 16', gerar: (r) => {
        const n = inteiro(r, 16, 4095);
        return { enunciado: `Converta o decimal ${n} para hexadecimal (letras maiúsculas).`, resposta: n.toString(16).toUpperCase(), passos: `Restos das divisões por 16: **${n.toString(16).toUpperCase()}**` };
      } },
      { tipo: 'calc', id: 'bytes', titulo: 'Bits e bytes', formula: '1 byte = 8 bits; 1 KiB = 1.024 B; 1 MiB = 1.024 KiB', gerar: (r) => {
        const c = escolha(r, ['bits', 'kib', 'mib']); const v = inteiro(r, 2, 64);
        if (c === 'bits') return { enunciado: `Quantos bits há em ${v} bytes?`, resposta: v * 8, unidade: 'bits', passos: `${v} × 8 = **${v * 8} bits**` };
        if (c === 'kib') return { enunciado: `Quantos bytes há em ${v} KiB?`, resposta: v * 1024, unidade: 'bytes', passos: `${v} × 1.024 = **${v * 1024} bytes**` };
        return { enunciado: `Quantos KiB há em ${v} MiB?`, resposta: v * 1024, unidade: 'KiB', passos: `${v} × 1.024 = **${v * 1024} KiB**` };
      } },
    ],
  },

  permissoes: {
    intro: 'Permissões de arquivos no Linux: notação octal e simbólica e o efeito da umask.',
    teoria: 'r = 4, w = 2, x = 1, para dono, grupo e outros. chmod 754 = rwxr-xr--. Novos arquivos partem de 666 e diretórios de 777, menos a umask (022 → arquivos 644).',
    exercicios: [
      { tipo: 'calc', id: 'octal', titulo: 'Simbólico para octal', formula: 'r=4, w=2, x=1 por grupo', gerar: (r) => {
        const o = [inteiro(r, 4, 7), inteiro(r, 0, 7), inteiro(r, 0, 7)].join('');
        return { enunciado: `Qual o valor octal das permissões ${simbolico(o)}?`, resposta: o, passos: `${simbolico(o).match(/.../g).map((t) => `${t} = ${[...t].reduce((s, c) => s + ({ r: 4, w: 2, x: 1 }[c] ?? 0), 0)}`).join('; ')} → **${o}**` };
      } },
      { tipo: 'calc', id: 'simbolico', titulo: 'Octal para simbólico', formula: '7=rwx 6=rw- 5=r-x 4=r-- …', gerar: (r) => {
        const o = escolha(r, ['755', '644', '600', '700', '750', '640', '775', '664', '444', '711']);
        return { enunciado: `Após "chmod ${o} arquivo", como ficam as permissões em notação simbólica (9 caracteres, ex.: rwxr-xr--)?`, resposta: simbolico(o), passos: `**${simbolico(o)}**` };
      } },
      { tipo: 'calc', id: 'umask', titulo: 'Efeito da umask', formula: 'arquivo: 666 − umask; diretório: 777 − umask', gerar: (r) => {
        const u = escolha(r, ['022', '002', '027', '077']); const dir = r() < 0.5;
        const res = (dir ? [7, 7, 7] : [6, 6, 6]).map((b, i) => b & ~Number(u[i])).join('');
        return { enunciado: `Com umask ${u}, qual a permissão octal de um novo ${dir ? 'diretório' : 'arquivo'}?`, resposta: res, passos: `${dir ? '777' : '666'} sem os bits ${u} = **${res}** (${simbolico(res)})` };
      } },
      { tipo: 'classificar', id: 'comandos', titulo: 'Comandos de permissão e usuários', pergunta: 'O comando serve para:', categorias: ['Alterar permissões', 'Alterar dono', 'Ver identidade/grupos', 'Executar como administrador'], itens: [
        ['chmod 640 relatorio.txt', 'Alterar permissões'], ['chmod u+x script.sh', 'Alterar permissões'],
        ['chown ana arquivo', 'Alterar dono'], ['chown root:adm log', 'Alterar dono'], ['chgrp equipe pasta', 'Alterar dono', 'Altera o grupo dono.'],
        ['id', 'Ver identidade/grupos'], ['whoami', 'Ver identidade/grupos'], ['groups', 'Ver identidade/grupos'],
        ['sudo systemctl restart nginx', 'Executar como administrador'], ['sudo apt update', 'Executar como administrador'],
      ] },
    ],
  },

  subredes: {
    intro: 'Sub-redes IPv4 sem calculadora: hosts, máscara, endereço de rede e broadcast.',
    teoria: 'Hosts úteis = 2^(32 − prefixo) − 2. O tamanho do bloco no octeto "quebrado" é 256 − valor da máscara nesse octeto. Rede = múltiplo do bloco; broadcast = próxima rede − 1.',
    exercicios: [
      { tipo: 'calc', id: 'hosts', titulo: 'Hosts por sub-rede', formula: '2^(32 − prefixo) − 2', gerar: (r) => {
        const p = inteiro(r, 20, 30);
        return { enunciado: `Quantos endereços de host utilizáveis há em uma sub-rede /${p}?`, resposta: 2 ** (32 - p) - 2, passos: `2^${32 - p} − 2 = **${2 ** (32 - p) - 2}** (descontados rede e broadcast).` };
      } },
      { tipo: 'calc', id: 'mascara', titulo: 'Máscara decimal', formula: 'prefixo → bits 1 da esquerda para a direita', gerar: (r) => {
        const p = inteiro(r, 8, 30);
        return { enunciado: `Qual a máscara em notação decimal pontuada do prefixo /${p}?`, resposta: infoCidr('10.0.0.0', p).mascara, passos: `${p} bits 1 → **${infoCidr('10.0.0.0', p).mascara}**` };
      } },
      { tipo: 'calc', id: 'rede', titulo: 'Endereço de rede', formula: 'zerar os bits de host', gerar: (r) => {
        const p = inteiro(r, 22, 29); const ip = `${escolha(r, [10, 172, 192])}.${inteiro(r, 0, 255)}.${inteiro(r, 0, 255)}.${inteiro(r, 1, 254)}`; const i = infoCidr(ip, p);
        return { enunciado: `Qual o endereço de rede de ${ip}/${p}?`, resposta: i.rede, passos: `Máscara ${i.mascara} → rede **${i.rede}**, broadcast ${i.broadcast}, hosts ${i.primeiro} a ${i.ultimo}.` };
      } },
      { tipo: 'calc', id: 'broadcast', titulo: 'Endereço de broadcast', formula: 'rede + tamanho do bloco − 1', gerar: (r) => {
        const p = inteiro(r, 22, 29); const ip = `192.168.${inteiro(r, 0, 255)}.${inteiro(r, 1, 254)}`; const i = infoCidr(ip, p);
        return { enunciado: `Qual o endereço de broadcast de ${ip}/${p}?`, resposta: i.broadcast, passos: `Rede ${i.rede} → broadcast **${i.broadcast}**.` };
      } },
      { tipo: 'calc', id: 'divisao', titulo: 'Dividir uma rede', formula: 'nº de sub-redes = 2^(bits emprestados)', gerar: (r) => {
        const p = escolha(r, [16, 20, 22, 24]); const b = inteiro(r, 1, 6);
        return { enunciado: `Uma rede /${p} é dividida em sub-redes /${p + b}. Quantas sub-redes são obtidas?`, resposta: 2 ** b, passos: `${b} bit(s) emprestado(s): 2^${b} = **${2 ** b}** sub-redes de ${2 ** (32 - p - b) - 2} hosts úteis cada.` };
      } },
      { tipo: 'classificar', id: 'privados', titulo: 'Endereço privado ou público?', pergunta: 'O endereço IPv4 é:', categorias: ['Privado (RFC 1918)', 'Público', 'Especial'], itens: [
        ['10.20.30.40', 'Privado (RFC 1918)'], ['172.16.5.1', 'Privado (RFC 1918)'], ['172.31.255.10', 'Privado (RFC 1918)'], ['192.168.0.10', 'Privado (RFC 1918)'],
        ['8.8.8.8', 'Público'], ['200.17.0.1', 'Público'], ['172.32.0.1', 'Público', 'Fora da faixa 172.16.0.0/12.'],
        ['127.0.0.1', 'Especial', 'Loopback.'], ['169.254.10.5', 'Especial', 'APIPA / link-local.'], [`${intParaIp(0xffffffff)}`, 'Especial', 'Broadcast limitado.'],
      ] },
    ],
  },

  protocolos: {
    intro: 'Camadas TCP/IP, portas padrão e as trocas clássicas (DHCP e three-way handshake).',
    teoria: 'TCP/IP: aplicação (HTTP, DNS, SMTP, SSH), transporte (TCP, UDP), internet (IP, ICMP, ARP*) e acesso à rede (Ethernet, Wi-Fi). *ARP opera entre rede e enlace.',
    exercicios: [
      { tipo: 'classificar', id: 'camadas', titulo: 'Camada TCP/IP', pergunta: 'O protocolo opera na camada:', categorias: ['Aplicação', 'Transporte', 'Internet', 'Acesso à rede'], itens: [
        ['HTTP', 'Aplicação'], ['DNS', 'Aplicação'], ['SMTP', 'Aplicação'], ['SSH', 'Aplicação'], ['DHCP', 'Aplicação'], ['FTP', 'Aplicação'],
        ['TCP', 'Transporte'], ['UDP', 'Transporte'],
        ['IP', 'Internet'], ['ICMP (ping)', 'Internet'],
        ['Ethernet', 'Acesso à rede'], ['Wi-Fi (802.11)', 'Acesso à rede'],
      ] },
      { tipo: 'classificar', id: 'portas', titulo: 'Portas padrão', pergunta: 'A porta padrão do serviço é:', categorias: ['21', '22', '25', '53', '80', '110', '143', '443', '3389'], itens: [
        ['FTP (controle)', '21'], ['SSH', '22'], ['SMTP', '25'], ['DNS', '53'], ['HTTP', '80'], ['POP3', '110'], ['IMAP', '143'], ['HTTPS', '443'], ['RDP (área de trabalho remota)', '3389'],
      ] },
      { tipo: 'classificar', id: 'tcp-udp', titulo: 'TCP ou UDP?', pergunta: 'Em uso típico, o serviço utiliza:', categorias: ['TCP', 'UDP'], itens: [
        ['HTTP/HTTPS (navegação)', 'TCP'], ['SSH', 'TCP'], ['SMTP', 'TCP'], ['FTP', 'TCP'], ['Transferência de zona DNS', 'TCP'],
        ['Consulta DNS comum', 'UDP'], ['DHCP', 'UDP'], ['SNMP', 'UDP'], ['TFTP', 'UDP'], ['Streaming de voz (VoIP/RTP)', 'UDP'],
      ] },
      { tipo: 'ordenar', id: 'dhcp', titulo: 'Concessão DHCP (DORA)', passos: ['Discover (cliente procura servidores)', 'Offer (servidor oferece um endereço)', 'Request (cliente solicita o endereço oferecido)', 'Acknowledge (servidor confirma a concessão)'] },
      { tipo: 'ordenar', id: 'handshake', titulo: 'Abertura de conexão TCP', passos: ['SYN', 'SYN-ACK', 'ACK'], explicacao: 'Three-way handshake: só depois dele os dados começam a trafegar.' },
    ],
  },

  http: {
    intro: 'Códigos de status e métodos HTTP no desenho e no diagnóstico de APIs REST.',
    teoria: '1xx informativo, 2xx sucesso, 3xx redirecionamento, 4xx erro do cliente, 5xx erro do servidor. GET lê, POST cria, PUT substitui, PATCH altera parcialmente, DELETE remove.',
    exercicios: [
      { tipo: 'classificar', id: 'status', titulo: 'Classes de status HTTP', pergunta: 'O código pertence à classe:', categorias: ['2xx Sucesso', '3xx Redirecionamento', '4xx Erro do cliente', '5xx Erro do servidor'], itens: [
        ['200 OK', '2xx Sucesso'], ['201 Created', '2xx Sucesso'], ['204 No Content', '2xx Sucesso'],
        ['301 Moved Permanently', '3xx Redirecionamento'], ['302 Found', '3xx Redirecionamento'], ['304 Not Modified', '3xx Redirecionamento'],
        ['400 Bad Request', '4xx Erro do cliente'], ['401 Unauthorized', '4xx Erro do cliente', 'Falta autenticação.'], ['403 Forbidden', '4xx Erro do cliente', 'Autenticado, mas sem permissão.'], ['404 Not Found', '4xx Erro do cliente'], ['429 Too Many Requests', '4xx Erro do cliente'],
        ['500 Internal Server Error', '5xx Erro do servidor'], ['502 Bad Gateway', '5xx Erro do servidor'], ['503 Service Unavailable', '5xx Erro do servidor'],
      ] },
      { tipo: 'classificar', id: 'metodos', titulo: 'Método HTTP adequado', pergunta: 'Para a operação, o método REST adequado é:', categorias: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], itens: [
        ['Listar os processos de um servidor', 'GET'], ['Consultar um protocolo pelo número', 'GET'],
        ['Cadastrar um novo requerimento', 'POST'], ['Enviar um formulário que cria um registro', 'POST'],
        ['Substituir por completo os dados de um cadastro', 'PUT'],
        ['Alterar apenas o e-mail de um usuário', 'PATCH'], ['Atualizar só o status de um chamado', 'PATCH'],
        ['Excluir um anexo', 'DELETE'], ['Remover um agendamento', 'DELETE'],
      ] },
      { tipo: 'classificar', id: 'idempotencia', titulo: 'Idempotência', pergunta: 'Pela especificação HTTP, o método é idempotente?', categorias: ['Idempotente', 'Não idempotente'], itens: [
        ['GET', 'Idempotente'], ['PUT', 'Idempotente'], ['DELETE', 'Idempotente'], ['HEAD', 'Idempotente'],
        ['POST', 'Não idempotente', 'Cada envio pode criar um novo recurso.'], ['PATCH', 'Não idempotente', 'Não é garantido pela especificação.'],
      ] },
    ],
  },

  seguranca: {
    intro: 'Princípios da segurança, tipos de criptografia, backups e controles.',
    teoria: 'CID: confidencialidade, integridade e disponibilidade (+ autenticidade e não repúdio). Simétrica: mesma chave (AES). Assimétrica: par de chaves (RSA). Hash: resumo irreversível (SHA-256).',
    exercicios: [
      { tipo: 'classificar', id: 'cid', titulo: 'Princípio afetado', pergunta: 'O incidente compromete principalmente a:', categorias: ['Confidencialidade', 'Integridade', 'Disponibilidade', 'Autenticidade', 'Não repúdio'], itens: [
        ['Vazamento de dados pessoais de servidores', 'Confidencialidade'], ['Acesso indevido a prontuários médicos', 'Confidencialidade'],
        ['Alteração não autorizada de notas no sistema', 'Integridade'], ['Arquivo corrompido durante a transferência', 'Integridade'],
        ['Ataque DDoS derruba o portal de serviços', 'Disponibilidade'], ['Ransomware impede o acesso aos arquivos', 'Disponibilidade'],
        ['E-mail falso se passa pelo diretor', 'Autenticidade'], ['Site clonado imitando o banco', 'Autenticidade'],
        ['Autor nega ter assinado um despacho eletrônico', 'Não repúdio'],
      ] },
      { tipo: 'classificar', id: 'cripto', titulo: 'Tipos de algoritmo', pergunta: 'O algoritmo é de:', categorias: ['Criptografia simétrica', 'Criptografia assimétrica', 'Hash'], itens: [
        ['AES', 'Criptografia simétrica'], ['DES / 3DES', 'Criptografia simétrica'], ['Blowfish', 'Criptografia simétrica'], ['ChaCha20', 'Criptografia simétrica'],
        ['RSA', 'Criptografia assimétrica'], ['Curvas elípticas (ECC)', 'Criptografia assimétrica'], ['Diffie-Hellman (troca de chaves)', 'Criptografia assimétrica'], ['ElGamal', 'Criptografia assimétrica'],
        ['SHA-256', 'Hash'], ['SHA-3', 'Hash'], ['MD5 (obsoleto)', 'Hash'],
      ] },
      { tipo: 'classificar', id: 'backup', titulo: 'Tipos de backup', pergunta: 'A característica é do backup:', categorias: ['Completo', 'Incremental', 'Diferencial'], itens: [
        ['Copia todos os dados selecionados a cada execução', 'Completo'], ['Restauração mais simples, mas maior tempo e espaço', 'Completo'],
        ['Copia só o que mudou desde o último backup de qualquer tipo', 'Incremental'], ['Mais rápido e menor, mas restaurar exige o completo e todos os incrementais', 'Incremental'],
        ['Copia tudo que mudou desde o último backup completo', 'Diferencial'], ['Restaurar exige o último completo e o último diferencial', 'Diferencial'],
      ] },
      { tipo: 'classificar', id: 'controles', titulo: 'Tipos de controle', pergunta: 'O controle é:', categorias: ['Preventivo', 'Detectivo', 'Corretivo'], itens: [
        ['Firewall bloqueando portas não usadas', 'Preventivo'], ['Autenticação em dois fatores', 'Preventivo'], ['Treinamento contra phishing', 'Preventivo'],
        ['Sistema de detecção de intrusão (IDS)', 'Detectivo'], ['Análise de logs e alertas do SIEM', 'Detectivo'],
        ['Restauração a partir do backup', 'Corretivo'], ['Aplicação de patch após incidente', 'Corretivo'],
      ] },
    ],
  },

  'eng-software': {
    intro: 'Requisitos, padrões de projeto, tipos de teste e o modelo cascata.',
    teoria: 'Requisito funcional: o que o sistema faz. Não funcional: como (desempenho, segurança, usabilidade). Padrões GoF: criacionais, estruturais e comportamentais.',
    exercicios: [
      { tipo: 'classificar', id: 'requisitos', titulo: 'Tipos de requisito', pergunta: 'O requisito é:', categorias: ['Funcional', 'Não funcional'], itens: [
        ['O sistema deve emitir certidão negativa', 'Funcional'], ['O usuário deve poder anexar documentos ao processo', 'Funcional'], ['O sistema deve calcular o valor da diária', 'Funcional'],
        ['Responder em até 2 segundos', 'Não funcional', 'Desempenho.'], ['Funcionar nos navegadores modernos', 'Não funcional', 'Portabilidade.'], ['Atender às diretrizes de acessibilidade (eMAG)', 'Não funcional'], ['Disponibilidade de 99,9%', 'Não funcional'],
      ] },
      { tipo: 'classificar', id: 'padroes', titulo: 'Padrões de projeto (GoF)', pergunta: 'O padrão é:', categorias: ['Criacional', 'Estrutural', 'Comportamental'], itens: [
        ['Singleton', 'Criacional'], ['Factory Method', 'Criacional'], ['Builder', 'Criacional'], ['Abstract Factory', 'Criacional'],
        ['Adapter', 'Estrutural'], ['Decorator', 'Estrutural'], ['Facade', 'Estrutural'], ['Proxy', 'Estrutural'], ['Composite', 'Estrutural'],
        ['Observer', 'Comportamental'], ['Strategy', 'Comportamental'], ['Command', 'Comportamental'], ['Iterator', 'Comportamental'], ['State', 'Comportamental'],
      ] },
      { tipo: 'classificar', id: 'testes', titulo: 'Tipos de teste', pergunta: 'O teste descrito é de:', categorias: ['Unidade', 'Integração', 'Sistema', 'Aceitação', 'Regressão'], itens: [
        ['Testa uma função isolada de cálculo', 'Unidade'], ['Usa mocks para isolar a classe', 'Unidade'],
        ['Verifica a comunicação entre a API e o banco de dados', 'Integração'],
        ['Avalia o sistema completo contra os requisitos', 'Sistema'],
        ['O cliente valida se o sistema atende ao negócio', 'Aceitação'], ['Homologação pelo usuário final', 'Aceitação'],
        ['Reexecuta testes antigos após uma mudança', 'Regressão'],
      ] },
      { tipo: 'ordenar', id: 'cascata', titulo: 'Modelo cascata', passos: ['Levantamento de requisitos', 'Análise e projeto', 'Implementação (codificação)', 'Testes', 'Implantação', 'Manutenção'] },
    ],
  },

  'banco-dados': {
    intro: 'Sublinguagens do SQL, propriedades ACID, formas normais e a ordem lógica do SELECT.',
    teoria: 'DDL define estrutura; DML manipula dados; DQL consulta; DCL controla acesso; TCL controla transações. ACID: atomicidade, consistência, isolamento e durabilidade.',
    exercicios: [
      { tipo: 'classificar', id: 'sublinguagens', titulo: 'Sublinguagens do SQL', pergunta: 'O comando pertence à:', categorias: ['DDL', 'DML', 'DQL', 'DCL', 'TCL'], itens: [
        ['CREATE TABLE', 'DDL'], ['ALTER TABLE', 'DDL'], ['DROP TABLE', 'DDL'], ['TRUNCATE', 'DDL'],
        ['INSERT', 'DML'], ['UPDATE', 'DML'], ['DELETE', 'DML'],
        ['SELECT', 'DQL'],
        ['GRANT', 'DCL'], ['REVOKE', 'DCL'],
        ['COMMIT', 'TCL'], ['ROLLBACK', 'TCL'], ['SAVEPOINT', 'TCL'],
      ] },
      { tipo: 'classificar', id: 'acid', titulo: 'Propriedades ACID', pergunta: 'A situação ilustra a propriedade:', categorias: ['Atomicidade', 'Consistência', 'Isolamento', 'Durabilidade'], itens: [
        ['A transferência debita e credita, ou nada acontece', 'Atomicidade'], ['Falha no meio da transação desfaz tudo', 'Atomicidade'],
        ['Restrições de integridade continuam válidas após a transação', 'Consistência'],
        ['Transações simultâneas não enxergam dados intermediários uma da outra', 'Isolamento'],
        ['Depois do COMMIT, os dados sobrevivem a uma queda de energia', 'Durabilidade'],
      ] },
      { tipo: 'classificar', id: 'normalizacao', titulo: 'Forma normal violada', pergunta: 'A tabela viola a:', categorias: ['1FN', '2FN', '3FN'], itens: [
        ['Coluna "telefones" guarda vários números separados por vírgula', '1FN', 'Atributo multivalorado.'], ['Atributo composto não atômico, como endereço inteiro em um campo usado por partes', '1FN'],
        ['Chave (pedido, produto) e o nome do produto depende só do produto', '2FN', 'Dependência parcial da chave composta.'], ['Em matrícula(aluno, disciplina), o nome do aluno depende só de aluno', '2FN'],
        ['Tabela de servidores com cod_setor e nome_setor, que depende de cod_setor', '3FN', 'Dependência transitiva.'], ['CEP determina cidade, e cidade está na tabela de clientes junto com o CEP', '3FN'],
      ] },
      { tipo: 'ordenar', id: 'select', titulo: 'Ordem lógica de execução do SELECT', passos: ['FROM / JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY', 'LIMIT'], explicacao: 'Por isso um alias criado no SELECT não pode ser usado no WHERE, mas pode no ORDER BY.' },
    ],
  },

  'governanca-ti': {
    intro: 'Práticas do ITIL 4, domínios do COBIT 2019 e modelos de serviço em nuvem.',
    teoria: 'Incidente: interrupção não planejada (restaurar rápido). Problema: causa de um ou mais incidentes. Requisição: pedido padrão do usuário. Mudança: adição, modificação ou remoção que afeta serviços.',
    exercicios: [
      { tipo: 'classificar', id: 'itil', titulo: 'ITIL: o que é cada registro?', pergunta: 'A situação deve ser tratada como:', categorias: ['Incidente', 'Problema', 'Requisição de serviço', 'Mudança'], itens: [
        ['O sistema de protocolo saiu do ar agora', 'Incidente'], ['A impressora do setor parou de funcionar', 'Incidente'],
        ['Investigar por que o servidor reinicia toda semana', 'Problema', 'Busca da causa raiz.'], ['Análise da causa de vários chamados repetidos de lentidão', 'Problema'],
        ['Usuário pede instalação de software homologado', 'Requisição de serviço'], ['Pedido de redefinição de senha', 'Requisição de serviço'],
        ['Atualizar a versão do banco de dados em produção', 'Mudança'], ['Trocar o firewall da rede', 'Mudança'],
      ] },
      { tipo: 'classificar', id: 'cobit', titulo: 'Domínios do COBIT 2019', pergunta: 'O objetivo pertence ao domínio:', categorias: ['EDM (governança)', 'APO', 'BAI', 'DSS', 'MEA'], itens: [
        ['Avaliar, dirigir e monitorar: garantir a entrega de benefícios', 'EDM (governança)'], ['Garantir a otimização de riscos (visão da alta direção)', 'EDM (governança)'],
        ['Alinhar, planejar e organizar: gerenciar a estratégia e a arquitetura', 'APO'], ['Gerenciar o orçamento e os custos de TI', 'APO'],
        ['Construir, adquirir e implementar: gerenciar projetos e mudanças', 'BAI'], ['Gerenciar a identificação e a construção de soluções', 'BAI'],
        ['Entregar, servir e suportar: gerenciar operações e incidentes', 'DSS'], ['Gerenciar a continuidade', 'DSS'],
        ['Monitorar, avaliar e analisar o desempenho e a conformidade', 'MEA'],
      ] },
      { tipo: 'classificar', id: 'nuvem', titulo: 'Modelos de serviço em nuvem', pergunta: 'O serviço é:', categorias: ['IaaS', 'PaaS', 'SaaS'], itens: [
        ['Máquinas virtuais e redes sob demanda (ex.: EC2)', 'IaaS'], ['Armazenamento em blocos gerenciado pelo cliente no nível do SO', 'IaaS'],
        ['Plataforma que executa o código sem gerenciar servidores (ex.: App Engine, Heroku)', 'PaaS'], ['Banco de dados gerenciado pelo provedor', 'PaaS'],
        ['E-mail e suíte de escritório pela web', 'SaaS'], ['Sistema de RH acessado pelo navegador por assinatura', 'SaaS'],
      ] },
    ],
  },

  'informatica-pratica': {
    intro: 'Pragas digitais, tipos de arquivo e funções de planilha — o essencial de Noções de Informática.',
    teoria: 'Vírus precisa de hospedeiro; worm se propaga sozinho pela rede; cavalo de troia se disfarça de programa legítimo; ransomware sequestra dados; spyware espiona; phishing engana para roubar dados.',
    exercicios: [
      { tipo: 'classificar', id: 'malware', titulo: 'Pragas e golpes digitais', pergunta: 'A ameaça descrita é:', categorias: ['Vírus', 'Worm', 'Cavalo de troia', 'Ransomware', 'Spyware', 'Phishing'], itens: [
        ['Infecta arquivos e depende da execução do hospedeiro', 'Vírus'], ['Macro maliciosa anexada a documento de texto', 'Vírus'],
        ['Se propaga sozinho explorando falhas da rede', 'Worm'], ['Replica-se automaticamente e consome a banda da rede', 'Worm'],
        ['Jogo gratuito que instala um programa malicioso escondido', 'Cavalo de troia'], ['Programa aparentemente útil que abre brecha no sistema', 'Cavalo de troia'],
        ['Criptografa os arquivos e exige resgate em criptomoeda', 'Ransomware'],
        ['Registra o que é digitado e envia ao atacante', 'Spyware', 'Keylogger é um tipo de spyware.'], ['Monitora a navegação sem o conhecimento do usuário', 'Spyware'],
        ['E-mail falso do "banco" pedindo para atualizar a senha', 'Phishing'], ['SMS com link para "regularizar o CPF"', 'Phishing'],
      ] },
      { tipo: 'classificar', id: 'arquivos', titulo: 'Tipos de arquivo', pergunta: 'A extensão corresponde a:', categorias: ['Texto', 'Planilha', 'Apresentação', 'Imagem', 'Compactado', 'Executável'], itens: [
        ['.docx', 'Texto'], ['.odt', 'Texto'], ['.rtf', 'Texto'],
        ['.xlsx', 'Planilha'], ['.ods', 'Planilha'], ['.csv', 'Planilha', 'Texto com valores separados, aberto em planilhas.'],
        ['.pptx', 'Apresentação'], ['.odp', 'Apresentação'],
        ['.jpg', 'Imagem'], ['.png', 'Imagem'], ['.gif', 'Imagem'],
        ['.zip', 'Compactado'], ['.rar', 'Compactado'], ['.7z', 'Compactado'],
        ['.exe', 'Executável'], ['.msi', 'Executável'],
      ] },
      { tipo: 'classificar', id: 'funcoes', titulo: 'Funções de planilha', pergunta: 'A função é da categoria:', categorias: ['Lógica', 'Pesquisa e referência', 'Matemática e estatística', 'Texto', 'Data e hora'], itens: [
        ['SE', 'Lógica'], ['E', 'Lógica'], ['OU', 'Lógica'], ['SEERRO', 'Lógica'],
        ['PROCV', 'Pesquisa e referência'], ['PROCX', 'Pesquisa e referência'], ['ÍNDICE', 'Pesquisa e referência'], ['CORRESP', 'Pesquisa e referência'],
        ['SOMA', 'Matemática e estatística'], ['MÉDIA', 'Matemática e estatística'], ['CONT.SE', 'Matemática e estatística'], ['MÁXIMO', 'Matemática e estatística'],
        ['CONCATENAR', 'Texto'], ['ESQUERDA', 'Texto'], ['ARRUMAR', 'Texto'],
        ['HOJE', 'Data e hora'], ['DIATRABALHOTOTAL', 'Data e hora'], ['AGORA', 'Data e hora'],
      ] },
    ],
  },
};

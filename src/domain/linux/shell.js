// Servidor Linux simulado: sistema de arquivos em memória + interpretador de um subconjunto do Bash.
// Nada aqui executa comandos reais nem toca o disco do usuário.

const D = (owner, mode, children = {}) => ({ t: 'd', owner, mode, children });
const F = (content, owner = 'root', mode = 0o644, size) => ({ t: 'f', owner, mode, content, ...(size ? { size } : {}) });
const GB = 1024 ** 3;

const APP_LOG = [
  '2026-10-15 08:00:01 INFO  aplicação iniciada na porta 8080',
  '2026-10-15 08:05:12 INFO  usuário maria autenticado',
  '2026-10-15 08:07:44 WARN  tempo de resposta acima de 2s em /relatorios',
  '2026-10-15 08:09:03 ERROR falha ao conectar no banco: timeout após 30s',
  '2026-10-15 08:15:27 INFO  backup diário agendado',
  '2026-10-15 08:21:55 ERROR arquivo /var/www/uploads/edital.pdf não encontrado',
  '2026-10-15 08:30:10 INFO  usuário joao autenticado',
  '2026-10-15 08:31:42 WARN  uso de memória em 85%',
  '2026-10-15 08:40:00 ERROR permissão negada ao gravar em /var/www/cache',
  '2026-10-15 08:45:19 INFO  relatório mensal gerado',
].join('\n') + '\n';

const ACCESS_IPS = ['203.0.113.45', '198.51.100.7', '203.0.113.45', '192.0.2.10', '203.0.113.45', '198.51.100.7',
  '192.168.10.30', '203.0.113.45', '192.0.2.10', '203.0.113.45', '198.51.100.7', '203.0.113.45', '192.168.10.30',
  '203.0.113.45', '198.51.100.7', '192.0.2.10', '203.0.113.45', '198.51.100.7', '203.0.113.45'];
const ROTAS = ['/index.html', '/login', '/editais', '/wp-admin', '/.env', '/editais/2026.pdf'];
const ACCESS_LOG = ACCESS_IPS.map((ip, i) =>
  `${ip} - - [15/Oct/2026:09:${String(10 + i).padStart(2, '0')}:01 -0300] "GET ${ROTAS[i % ROTAS.length]} HTTP/1.1" ${i % 4 === 3 ? 404 : 200} ${300 + i * 17} "-" "Mozilla/5.0"`,
).join('\n') + '\n';

const NGINX_SITE = 'server {\n    listen 80\n    server_name _;\n    root /var/www/html;\n    index index.html;\n}\n';
const SSHD = '# Configuração do servidor SSH (didática)\nPort 22\nPermitRootLogin yes\nPasswordAuthentication yes\n';

export function criarServidor() {
  const fs = D('root', 0o755, {
    bin: D('root', 0o755),
    etc: D('root', 0o755, {
      hostname: F('srv-didatico\n'),
      hosts: F('127.0.0.1 localhost\n192.168.10.20 srv-didatico\n192.168.10.5 intranet.local\n'),
      'resolv.conf': F('# Nenhum servidor DNS configurado\n'),
      passwd: F('root:x:0:0:root:/root:/bin/bash\naluno:x:1000:1000:Aluno:/home/aluno:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n'),
      shadow: F('root:*:19700:0:99999:7:::\naluno:$6$didatico$hashficticio:19700:0:99999:7:::\n', 'root', 0o640),
      nginx: D('root', 0o755, {
        'nginx.conf': F('user www-data;\nworker_processes auto;\n\nevents {\n    worker_connections 768;\n}\n\nhttp {\n    include /etc/nginx/sites-enabled/*;\n}\n'),
        'sites-enabled': D('root', 0o755, { default: F(NGINX_SITE) }),
      }),
      ssh: D('root', 0o755, { sshd_config: F(SSHD) }),
    }),
    home: D('root', 0o755, {
      aluno: D('aluno', 0o755, {
        'deploy.sh': F('#!/bin/bash\n# Script de publicação didático\necho "Iniciando deploy..."\nmkdir -p ~/releases/v1\necho "versao 1 publicada" > ~/releases/v1/status.txt\necho "Deploy concluído"\n', 'aluno', 0o644),
        'notas.txt': F('Lembretes do plantão:\n- verificar logs do app\n- revisar firewall e SSH\n- partição /var quase cheia?\n', 'aluno'),
      }),
    }),
    root: D('root', 0o700, { 'segredo.txt': F('nada para ver aqui\n', 'root', 0o600) }),
    tmp: D('root', 0o777),
    usr: D('root', 0o755, { bin: D('root', 0o755) }),
    var: D('root', 0o755, {
      log: D('root', 0o755, {
        'app.log': F(APP_LOG),
        'app.log.1': F('(log rotacionado antigo, nunca removido)\n', 'root', 0o644, 6.2 * GB),
        nginx: D('root', 0o755, { 'access.log': F(ACCESS_LOG), 'error.log': F('') }),
      }),
      www: D('root', 0o755, { html: D('root', 0o755, { 'index.html': F('<h1>Bem-vindo ao nginx!</h1>\n') }) }),
    }),
  });
  return {
    fs, cwd: '/home/aluno', oldpwd: '/home/aluno', user: 'aluno', host: 'srv-didatico', historico: [],
    servicos: {
      nginx: { ativo: false, habilitado: false },
      ssh: { ativo: true, habilitado: true, carregado: SSHD },
      mysql: { ativo: true, habilitado: true },
      cron: { ativo: true, habilitado: true },
    },
    ufw: { ativo: false, regras: [] },
    procs: [
      { pid: 1, user: 'root', cpu: 0, mem: 0.3, cmd: '/sbin/init' },
      { pid: 412, user: 'root', cpu: 0, mem: 0.2, cmd: '/usr/sbin/cron -f', svc: 'cron' },
      { pid: 587, user: 'root', cpu: 0.1, mem: 0.5, cmd: 'sshd: /usr/sbin/sshd -D', svc: 'ssh' },
      { pid: 733, user: 'mysql', cpu: 0.8, mem: 9.6, cmd: '/usr/sbin/mysqld', svc: 'mysql' },
      { pid: 1337, user: 'www-data', cpu: 99.1, mem: 31.0, cmd: './cryptominer --pool stratum+tcp://pool.exemplo:3333' },
      { pid: 1402, user: 'aluno', cpu: 0, mem: 0.1, cmd: '-bash' },
    ],
    executados: {},
  };
}

// ---------- caminhos e permissões ----------

export function absoluto(st, p) {
  const base = !p ? st.cwd : p.startsWith('/') ? p : `${st.cwd}/${p}`;
  const out = [];
  for (const s of base.split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') out.pop(); else out.push(s);
  }
  return '/' + out.join('/');
}

function no(st, a) {
  let n = st.fs;
  for (const s of a.split('/').filter(Boolean)) {
    if (n.t !== 'd' || !(n = n.children[s])) return null;
  }
  return n;
}

const separar = (a) => { const i = a.lastIndexOf('/'); return [a.slice(0, i) || '/', a.slice(i + 1)]; };

function pode(n, user, bit) {
  if (user === 'root') return true;
  const m = n.owner === user ? (n.mode >> 6) & 7 : n.mode & 7;
  return (m & bit) !== 0;
}

// Verifica permissão de travessia (x) em cada diretório ancestral.
function atravessa(st, a, user) {
  let n = st.fs;
  for (const s of separar(a)[0].split('/').filter(Boolean)) {
    if (!pode(n, user, 1)) return false;
    n = n.children[s];
    if (!n || n.t !== 'd') return true; // inexistência é tratada por quem chamou
  }
  return pode(n, user, 1);
}

const MSG_INEX = 'Arquivo ou diretório inexistente';
const MSG_PERM = 'Permissão negada';

class Erro extends Error {}

function resolver(c, p) {
  const a = absoluto(c.st, p);
  if (a !== '/' && !atravessa(c.st, a, c.user)) throw new Erro(`${p}: ${MSG_PERM}`);
  return { a, n: no(c.st, a) };
}

function criarNo(c, p, novo) {
  const { a, n } = resolver(c, p);
  if (n) return { a, n, existia: true };
  const [pai, nome] = separar(a);
  const dir = no(c.st, pai);
  if (!dir || dir.t !== 'd') throw new Erro(`${p}: ${MSG_INEX}`);
  if (!pode(dir, c.user, 2)) throw new Erro(`${p}: ${MSG_PERM}`);
  dir.children[nome] = novo;
  return { a, n: novo, existia: false };
}

function lerTexto(c, p, cmd) {
  const { n } = resolver(c, p);
  if (!n) throw new Erro(`${cmd}: ${p}: ${MSG_INEX}`);
  if (n.t === 'd') throw new Erro(`${cmd}: ${p}: É um diretório`);
  if (!pode(n, c.user, 4)) throw new Erro(`${cmd}: ${p}: ${MSG_PERM}`);
  return n.content;
}

function gravar(c, p, texto, anexar = false) {
  const { n, existia } = criarNo(c, p, F('', c.user, 0o644));
  if (n.t === 'd') throw new Erro(`bash: ${p}: É um diretório`);
  if (existia && !pode(n, c.user, 2)) throw new Erro(`bash: ${p}: ${MSG_PERM}`);
  n.content = anexar ? n.content + texto : texto;
  delete n.size;
}

export function lerArquivo(st, caminho) {
  const n = no(st, absoluto(st, caminho));
  return n && n.t === 'f' ? n.content : null;
}

export function existe(st, caminho, tipo) {
  const n = no(st, absoluto(st, caminho));
  return !!n && (!tipo || n.t === tipo);
}

// Autocompletar (Tab): nomes do diretório, com "/" nos diretórios.
export function listar(st, caminho) {
  const n = no(st, absoluto(st, caminho || '.'));
  return n?.t === 'd' ? Object.entries(n.children).map(([k, v]) => (v.t === 'd' ? `${k}/` : k)).sort() : [];
}

export function modo(st, caminho) {
  return no(st, absoluto(st, caminho))?.mode ?? null;
}

// Usado pelo editor (nano) da interface.
export function salvarArquivo(st, caminho, texto, comoRoot) {
  try {
    gravar({ st, user: comoRoot ? 'root' : st.user }, caminho, texto);
    return null;
  } catch (e) {
    return e.message.replace(/^bash: /, '');
  }
}

// ---------- utilidades ----------

const permStr = (n) => (n.t === 'd' ? 'd' : '-') + [6, 3, 0].map((s) => {
  const m = (n.mode >> s) & 7;
  return (m & 4 ? 'r' : '-') + (m & 2 ? 'w' : '-') + (m & 1 ? 'x' : '-');
}).join('');

const tamanho = (n) => (n.t === 'd' ? 4096 : n.size ?? new TextEncoder().encode(n.content).length);

function humano(b) {
  if (b < 1024) return `${b}`;
  const u = ['K', 'M', 'G', 'T'];
  let i = -1;
  do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
  return (b < 10 ? b.toFixed(1).replace('.', ',') : Math.round(b)) + u[i];
}

function percorrer(n, a, fn) {
  fn(a, n);
  if (n.t === 'd') for (const [k, f] of Object.entries(n.children)) percorrer(f, a === '/' ? `/${k}` : `${a}/${k}`, fn);
}

const VAR_TOTAL = 20 * GB;
const VAR_BASE = 13 * GB;

export function usoVar(st) {
  let soma = 0;
  percorrer(no(st, '/var'), '/var', (_, n) => { if (n.t === 'f' && n.size) soma += n.size; });
  return Math.round(((VAR_BASE + soma) / VAR_TOTAL) * 100);
}

function flags(args, validas) {
  const f = new Set();
  const resto = [];
  for (const a of args) {
    if (/^-[a-zA-Z]+$/.test(a) && [...a.slice(1)].every((x) => validas.includes(x))) [...a.slice(1)].forEach((x) => f.add(x));
    else resto.push(a);
  }
  return [f, resto];
}

function globRegex(p) {
  return new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
}

function expandirGlob(st, palavra) {
  const i = palavra.lastIndexOf('/');
  const dirTxt = i >= 0 ? palavra.slice(0, i + 1) : '';
  const pad = palavra.slice(i + 1);
  const dir = no(st, absoluto(st, dirTxt || '.'));
  if (!dir || dir.t !== 'd') return [palavra];
  const re = globRegex(pad);
  const nomes = Object.keys(dir.children).filter((n) => re.test(n) && (pad.startsWith('.') || !n.startsWith('.'))).sort();
  return nomes.length ? nomes.map((n) => dirTxt + n) : [palavra];
}

// ---------- nginx ----------

export function testarNginx(st) {
  for (const arq of ['/etc/nginx/nginx.conf', '/etc/nginx/sites-enabled/default']) {
    const txt = lerArquivo(st, arq);
    if (txt === null) continue;
    const linhas = txt.split('\n').map((l) => l.replace(/#.*/, '').trim());
    let prof = 0;
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i];
      if (!l) continue;
      if (l.endsWith('{')) prof++;
      else if (l === '}') {
        if (--prof < 0) return { ok: false, msg: `nginx: [emerg] unexpected "}" in ${arq}:${i + 1}` };
      } else if (!l.endsWith(';')) {
        const j = linhas.findIndex((x, k) => k > i && x);
        const prox = j >= 0 ? linhas[j].split(/\s+/)[0] : '';
        return { ok: false, msg: `nginx: [emerg] invalid parameter "${prox}" in ${arq}:${j + 1}` };
      }
    }
    if (prof > 0) return { ok: false, msg: `nginx: [emerg] unexpected end of file, expecting "}" in ${arq}:${linhas.length}` };
  }
  return { ok: true, msg: 'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful' };
}

// ---------- parser ----------

function env(st) {
  return { HOME: '/home/aluno', USER: st.user, PWD: st.cwd, HOSTNAME: st.host, SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin' };
}

export function tokenizar(linha, vars) {
  const toks = [];
  let cur = null;
  const push = () => { if (cur) { toks.push(cur); cur = null; } };
  const expandirVar = (s) => s.replace(/\$(\w+)|\$\{(\w+)\}/g, (_, a, b) => vars[a ?? b] ?? '');
  for (let i = 0; i < linha.length;) {
    const c = linha[i];
    const dois = linha.slice(i, i + 2);
    if (c === ' ' || c === '\t') { push(); i++; continue; }
    if (c === '>' && cur?.w === '2' && !cur.glob) { cur = null; toks.push({ op: '2>' }); i += dois === '>>' ? 2 : 1; continue; }
    if (['&&', '||', '>>'].includes(dois)) { push(); toks.push({ op: dois }); i += 2; continue; }
    if ('|;><'.includes(c)) { push(); toks.push({ op: c }); i++; continue; }
    cur ??= { w: '', glob: false };
    if (c === "'" || c === '"') {
      const j = linha.indexOf(c, i + 1);
      if (j < 0) throw new Erro('bash: erro de sintaxe: aspas não fechadas');
      const s = linha.slice(i + 1, j);
      cur.w += c === '"' ? expandirVar(s) : s;
      i = j + 1;
      continue;
    }
    if (c === '\\' && i + 1 < linha.length) { cur.w += linha[i + 1]; i += 2; continue; }
    if (c === '$') {
      const m = /^\$(\w+|\{\w+\})/.exec(linha.slice(i));
      if (m) { cur.w += vars[m[1].replace(/[{}]/g, '')] ?? ''; i += m[0].length; continue; }
    }
    if (c === '~' && cur.w === '' && (i + 1 === linha.length || '/ '.includes(linha[i + 1]))) { cur.w += vars.HOME; i++; continue; }
    if (c === '*' || c === '?') cur.glob = true;
    if (c === '{') cur.chaves = true;
    cur.w += c;
    i++;
  }
  push();
  return toks;
}

const BLOQUEIOS = [
  [/:\(\)\s*\{/, 'fork bomb: cria processos sem limite até travar a máquina.'],
  [/\bmkfs(\.\w+)?\b/, 'mkfs formata uma partição e apaga todos os dados dela.'],
  [/\bdd\s+.*\bof=\/dev\//, 'dd gravando direto em um disco destrói o sistema de arquivos.'],
  [/^\s*(sudo\s+)?(shutdown|reboot|poweroff|halt)\b/, 'desligar/reiniciar o servidor derrubaria todos os serviços.'],
  [/chmod\s+(-R\s+)?777\s+\/\s*$/, 'liberar tudo para todos na raiz anula toda a segurança do sistema.'],
];

const CRITICOS = ['/', '/etc', '/bin', '/usr', '/var', '/home', '/boot', '/root', '/lib'];

export function executar(st, linha, profundidade = 0) {
  linha = linha.trim();
  if (!linha) return { saida: '' };
  if (profundidade === 0) st.historico.push(linha);
  for (const [re, motivo] of BLOQUEIOS) {
    if (re.test(linha)) return { saida: `⚠ Comando bloqueado no laboratório: ${motivo}\nNum servidor real isso causaria dano irreversível.` };
  }
  let toks;
  try { toks = tokenizar(linha, env(st)); } catch (e) { return { saida: e.message }; }

  const partes = [];
  let atual = [];
  let op = null;
  for (const t of toks) {
    if (t.op === ';' || t.op === '&&' || t.op === '||') { partes.push({ op, toks: atual }); op = t.op; atual = []; } else atual.push(t);
  }
  partes.push({ op, toks: atual });

  let saida = '';
  let ok = true;
  const efeitos = {};
  for (const p of partes) {
    if (!p.toks.length) continue;
    if ((p.op === '&&' && !ok) || (p.op === '||' && ok)) continue;
    const r = pipeline(st, p.toks, profundidade);
    saida += r.saida;
    ok = r.ok;
    Object.assign(efeitos, r.efeitos);
  }
  return { saida: saida.replace(/\n$/, ''), ...efeitos };
}

function pipeline(st, toks, prof) {
  const cmds = [[]];
  for (const t of toks) { if (t.op === '|') cmds.push([]); else cmds.at(-1).push(t); }
  let stdin = '';
  let erros = '';
  let ok = true;
  const efeitos = {};
  for (let i = 0; i < cmds.length; i++) {
    const r = comando(st, cmds[i], stdin, prof);
    erros += r.err ?? '';
    stdin = r.out ?? '';
    ok = r.ok !== false;
    if (r.limpar) efeitos.limpar = true;
    if (r.editar) efeitos.editar = r.editar;
  }
  return { saida: erros + stdin, ok, efeitos };
}

function expandirChaves(w) {
  const m = /^(.*?)\{([^{}]*,[^{}]*)\}(.*)$/.exec(w);
  return m ? m[2].split(',').flatMap((p) => expandirChaves(m[1] + p + m[3])) : [w];
}

function comando(st, toks, stdin, prof) {
  const args = [];
  let redir = null;
  let redirErr = null;
  let entrada = null;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.op === '>' || t.op === '>>' || t.op === '2>') {
      const alvo = toks[++i];
      if (!alvo || alvo.op) return { err: 'bash: erro de sintaxe próximo ao token inesperado `newline\'\n', ok: false };
      if (t.op === '2>') redirErr = alvo.w;
      else redir = { arq: alvo.w, anexar: t.op === '>>' };
    } else if (t.op === '<') {
      entrada = toks[++i]?.w;
    } else if (t.chaves) args.push(...expandirChaves(t.w));
    else if (t.glob) args.push(...expandirGlob(st, t.w));
    else args.push(t.w);
  }
  if (!args.length) {
    if (redir && redir.arq !== '/dev/null') {
      try { gravar({ st, user: st.user }, redir.arq, '', redir.anexar); } catch (e) { return { err: e.message + '\n', ok: false }; }
    }
    return { out: '' };
  }
  let user = st.user;
  if (args[0] === 'sudo') {
    args.shift();
    if (!args.length) return { err: 'uso: sudo comando\n', ok: false };
    if (['-i', '-s', 'su', 'bash', '-'].includes(args[0])) return { err: 'No laboratório use sudo antes de cada comando (ex.: sudo systemctl restart nginx).\nShell root permanente é má prática: tudo vira irreversível.\n', ok: false };
    user = 'root';
  }
  const c = { st, user, args: args.slice(1), stdin, prof };
  let r;
  try {
    if (entrada) c.stdin = lerTexto(c, entrada, 'bash');
    r = rodar(c, args[0]);
  } catch (e) {
    if (!(e instanceof Erro)) throw e;
    r = { err: e.message + '\n', ok: false };
  }
  if (redir) {
    if (redir.arq !== '/dev/null') {
      try { gravar({ st, user: st.user }, redir.arq, r.out ?? '', redir.anexar); } catch (e) { r.err = (r.err ?? '') + e.message + '\n'; r.ok = false; }
    }
    r.out = '';
  }
  if (redirErr) {
    if (redirErr !== '/dev/null' && r.err) {
      try { gravar({ st, user: st.user }, redirErr, r.err); } catch { /* mantém a mensagem na tela */ }
    }
    if (redirErr === '/dev/null' || r.err) r.err = '';
  }
  return r;
}

function rodar(c, nome) {
  if (nome.includes('/')) return script(c, nome, true);
  const fn = CMDS[nome];
  if (!fn) {
    const dica = ALTERNATIVAS[nome];
    return { err: `bash: ${nome}: comando não encontrado${dica ? `\n${dica}` : ' (não implementado neste simulador — digite help)'}\n`, ok: false };
  }
  return fn(c) ?? {};
}

function script(c, caminho, exigeX) {
  const { a, n } = resolver(c, caminho);
  if (!n) throw new Erro(`bash: ${caminho}: ${MSG_INEX}`);
  if (n.t === 'd') throw new Erro(`bash: ${caminho}: É um diretório`);
  if (exigeX && !pode(n, c.user, 1)) throw new Erro(`bash: ${caminho}: ${MSG_PERM}`);
  if (!pode(n, c.user, 4)) throw new Erro(`bash: ${caminho}: ${MSG_PERM}`);
  if (c.prof > 3) throw new Erro('bash: recursão de scripts bloqueada');
  if (exigeX) c.st.executados[a] = true;
  const userAntes = c.st.user;
  c.st.user = c.user;
  let out = '';
  try {
    for (const l of n.content.split('\n')) {
      if (!l.trim() || l.trim().startsWith('#')) continue;
      const r = executar(c.st, l, c.prof + 1);
      if (r.saida) out += r.saida + '\n';
    }
  } finally { c.st.user = userAntes; }
  return { out };
}

const ALTERNATIVAS = {
  ifconfig: 'O pacote net-tools é obsoleto; use: ip a',
  netstat: 'Use: ss -tulpn (não implementado aqui) — ou ip a / ip route',
  apt: 'Instalação de pacotes não é simulada: o laboratório não acessa a internet.',
  'apt-get': 'Instalação de pacotes não é simulada: o laboratório não acessa a internet.',
  service: 'Use systemctl (ex.: sudo systemctl status nginx).',
};

// ---------- comandos ----------

const AJUDA = {
  pwd: 'mostra o diretório atual', ls: 'lista arquivos (-l -a -h)', cd: 'muda de diretório', mkdir: 'cria diretórios (-p)',
  touch: 'cria arquivo vazio', cat: 'mostra conteúdo', echo: 'imprime texto (use > e >> para gravar)', rm: 'remove (-r -f)',
  cp: 'copia (-r)', mv: 'move/renomeia', head: 'primeiras linhas (-n N)', tail: 'últimas linhas (-n N)', wc: 'conta linhas/palavras (-l -w -c)',
  grep: 'filtra linhas (-i -v -n -c -r)', sort: 'ordena (-n -r -u)', uniq: 'remove repetidas (-c conta)', cut: 'recorta colunas (-d X -f N)',
  find: 'procura (-name -type -size)', chmod: 'altera permissões (755, u+x)', chown: 'altera dono (requer sudo)',
  whoami: 'usuário atual', id: 'identidade do usuário', uname: 'informações do kernel (-a)', hostname: 'nome da máquina', date: 'data e hora',
  ps: 'processos (aux)', top: 'processos por consumo (instantâneo)', kill: 'encerra processo por PID', pkill: 'encerra processo por nome',
  df: 'uso de disco (-h)', free: 'uso de memória (-h)', ip: 'rede (ip a, ip route)', ping: 'testa conectividade', curl: 'requisição HTTP (-I)',
  systemctl: 'serviços (status/start/stop/restart/enable)', journalctl: 'logs de serviço (-u nome)', nginx: 'nginx -t testa a configuração',
  ufw: 'firewall (status/enable/allow/deny)', nano: 'abre o editor de texto', tee: 'grava a entrada em arquivo (-a anexa)',
  sudo: 'executa um comando como root', history: 'histórico de comandos', clear: 'limpa a tela', man: 'ajuda de um comando', ssh: 'acesso remoto (explicação)',
};

const CMDS = {
  help: () => ({ out: 'Comandos implementados neste simulador:\n' + Object.entries(AJUDA).map(([k, v]) => `  ${k.padEnd(11)} ${v}`).join('\n') + '\nTambém: ./script.sh, bash script.sh, pipes (|), &&, ;, > e >>.\n' }),
  man: (c) => ({ out: c.args[0] && AJUDA[c.args[0]] ? `${c.args[0]} — ${AJUDA[c.args[0]]}\n(manual resumido do simulador; no Linux real: man ${c.args[0]})\n` : 'Qual página do manual você quer? Ex.: man ls\n' }),
  pwd: (c) => ({ out: c.st.cwd + '\n' }),
  whoami: (c) => ({ out: c.user + '\n' }),
  id: (c) => ({ out: c.user === 'root' ? 'uid=0(root) gid=0(root) grupos=0(root)\n' : 'uid=1000(aluno) gid=1000(aluno) grupos=1000(aluno),27(sudo)\n' }),
  hostname: (c) => ({ out: c.st.host + '\n' }),
  uname: (c) => ({ out: c.args.includes('-a') ? `Linux ${c.st.host} 6.8.0-didatico #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n` : 'Linux\n' }),
  date: () => ({ out: new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' }) + '\n' }),
  clear: () => ({ limpar: true, out: '' }),
  history: (c) => ({ out: c.st.historico.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n') + '\n' }),
  exit: () => ({ out: 'Simulação: não há sessão remota para encerrar.\n' }),
  echo: (c) => {
    const n = c.args[0] === '-n';
    return { out: (n ? c.args.slice(1) : c.args).join(' ') + (n ? '' : '\n') };
  },

  cd: (c) => {
    const alvo = c.args[0] === '-' ? c.st.oldpwd : c.args[0] ?? '/home/aluno';
    const { a, n } = resolver(c, alvo);
    if (!n) throw new Erro(`bash: cd: ${alvo}: ${MSG_INEX}`);
    if (n.t !== 'd') throw new Erro(`bash: cd: ${alvo}: Não é um diretório`);
    if (!pode(n, c.user, 1)) throw new Erro(`bash: cd: ${alvo}: ${MSG_PERM}`);
    c.st.oldpwd = c.st.cwd;
    c.st.cwd = a;
  },

  ls: (c) => {
    const [f, alvos] = flags(c.args, 'lahR1');
    const lista = alvos.length ? alvos : ['.'];
    const linha = (nome, n) => f.has('l')
      ? `${permStr(n)} ${n.t === 'd' ? 2 : 1} ${n.owner.padEnd(8)} ${n.owner.padEnd(8)} ${String(f.has('h') ? humano(tamanho(n)) : tamanho(n)).padStart(f.has('h') ? 5 : 10)} out 15 09:00 ${nome}`
      : nome;
    let out = '';
    let err = '';
    for (const p of lista) {
      let r;
      try { r = resolver(c, p); } catch (e) { err += `ls: não foi possível acessar '${p}': ${MSG_PERM}\n`; continue; }
      if (!r.n) { err += `ls: não foi possível acessar '${p}': ${MSG_INEX}\n`; continue; }
      if (r.n.t === 'f') { out += linha(p, r.n) + '\n'; continue; }
      if (!pode(r.n, c.user, 4)) { err += `ls: não foi possível abrir o diretório '${p}': ${MSG_PERM}\n`; continue; }
      if (lista.length > 1) out += `${p}:\n`;
      const nomes = Object.keys(r.n.children).filter((k) => f.has('a') || !k.startsWith('.')).sort();
      const itens = (f.has('a') ? [['.', r.n], ['..', r.n]] : []).concat(nomes.map((k) => [k, r.n.children[k]]));
      if (f.has('l')) out += `total ${itens.length * 4}\n` + itens.map(([k, n]) => linha(k, n)).join('\n') + (itens.length ? '\n' : '');
      else if (itens.length) out += itens.map(([k, n]) => (n.t === 'd' ? k + '/' : k)).join('  ') + '\n';
    }
    return { out, err, ok: !err };
  },

  mkdir: (c) => {
    const [f, dirs] = flags(c.args, 'pv');
    if (!dirs.length) throw new Erro('mkdir: falta operando');
    for (const d of dirs) {
      if (f.has('p')) {
        let atual = d.startsWith('/') ? '/' : '';
        for (const parte of d.split('/').filter(Boolean)) {
          atual += (atual && !atual.endsWith('/') ? '/' : '') + parte;
          const r = criarNo(c, atual, D(c.user, 0o755));
          if (r.n.t !== 'd') throw new Erro(`mkdir: não foi possível criar o diretório “${d}”: Arquivo existe`);
        }
      } else {
        const r = criarNo(c, d, D(c.user, 0o755));
        if (r.existia) throw new Erro(`mkdir: não foi possível criar o diretório “${d}”: Arquivo existe`);
      }
    }
  },

  touch: (c) => {
    if (!c.args.length) throw new Erro('touch: falta operando');
    for (const a of c.args) criarNo(c, a, F('', c.user, 0o644));
  },

  cat: (c) => ({ out: c.args.length ? c.args.map((a) => lerTexto(c, a, 'cat')).join('') : c.stdin }),

  tee: (c) => {
    const [f, arqs] = flags(c.args, 'a');
    for (const a of arqs) gravar(c, a, c.stdin, f.has('a'));
    return { out: c.stdin };
  },

  head: (c) => cabecaCauda(c, 'head'),
  tail: (c) => cabecaCauda(c, 'tail'),

  wc: (c) => {
    const [f, arqs] = flags(c.args, 'lwc');
    const conta = (t) => {
      const v = { l: (t.match(/\n/g) ?? []).length, w: t.split(/\s+/).filter(Boolean).length, c: new TextEncoder().encode(t).length };
      const sel = f.size ? ['l', 'w', 'c'].filter((k) => f.has(k)) : ['l', 'w', 'c'];
      return sel.map((k) => v[k]).join(' ');
    };
    if (!arqs.length) return { out: conta(c.stdin) + '\n' };
    return { out: arqs.map((a) => `${conta(lerTexto(c, a, 'wc'))} ${a}`).join('\n') + '\n' };
  },

  grep: (c) => {
    const [f, resto] = flags(c.args, 'ivncrE');
    const [pad, ...arqs] = resto;
    if (pad === undefined) throw new Erro('Uso: grep [OPÇÃO]... PADRÕES [ARQUIVO]...');
    let re;
    try { re = new RegExp(pad, f.has('i') ? 'i' : ''); } catch { re = new RegExp(pad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), f.has('i') ? 'i' : ''); }
    const fontes = [];
    if (!arqs.length) fontes.push(['', c.stdin]);
    for (const a of arqs) {
      const { a: abs, n } = resolver(c, a);
      if (n?.t === 'd' && f.has('r')) percorrer(n, abs, (p, x) => { if (x.t === 'f' && pode(x, c.user, 4)) fontes.push([p, x.content]); });
      else fontes.push([a, lerTexto(c, a, 'grep')]);
    }
    const prefixo = fontes.length > 1 || f.has('r');
    let out = '';
    let achou = false;
    for (const [nome, txt] of fontes) {
      const linhas = txt.split('\n');
      if (linhas.at(-1) === '') linhas.pop();
      const hits = linhas.map((l, i) => [l, i]).filter(([l]) => re.test(l) !== f.has('v'));
      if (hits.length) achou = true;
      if (f.has('c')) out += (prefixo ? `${nome}:` : '') + hits.length + '\n';
      else for (const [l, i] of hits) out += (prefixo ? `${nome}:` : '') + (f.has('n') ? `${i + 1}:` : '') + l + '\n';
    }
    return { out, ok: achou };
  },

  sort: (c) => {
    const [f, arqs] = flags(c.args, 'nru');
    let linhas = (arqs.length ? arqs.map((a) => lerTexto(c, a, 'sort')).join('') : c.stdin).split('\n').filter((l, i, a) => l || i < a.length - 1);
    linhas.sort(f.has('n') ? (a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b) : (a, b) => a.localeCompare(b));
    if (f.has('r')) linhas.reverse();
    if (f.has('u')) linhas = [...new Set(linhas)];
    return { out: linhas.length ? linhas.join('\n') + '\n' : '' };
  },

  uniq: (c) => {
    const [f, arqs] = flags(c.args, 'c');
    const linhas = (arqs.length ? lerTexto(c, arqs[0], 'uniq') : c.stdin).split('\n');
    if (linhas.at(-1) === '') linhas.pop();
    const grupos = [];
    for (const l of linhas) { if (grupos.length && grupos.at(-1)[0] === l) grupos.at(-1)[1]++; else grupos.push([l, 1]); }
    return { out: grupos.map(([l, n]) => (f.has('c') ? `${String(n).padStart(7)} ${l}` : l)).join('\n') + (grupos.length ? '\n' : '') };
  },

  cut: (c) => {
    let delim = '\t';
    let campos = null;
    const arqs = [];
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a === '-d') delim = c.args[++i];
      else if (a.startsWith('-d')) delim = a.slice(2);
      else if (a === '-f') campos = c.args[++i];
      else if (a.startsWith('-f')) campos = a.slice(2);
      else arqs.push(a);
    }
    if (!campos) throw new Erro('cut: você deve especificar uma lista de campos (-f)');
    const idx = campos.split(',').map(Number);
    const txt = arqs.length ? lerTexto(c, arqs[0], 'cut') : c.stdin;
    const linhas = txt.split('\n');
    if (linhas.at(-1) === '') linhas.pop();
    return { out: linhas.map((l) => { const p = l.split(delim); return p.length > 1 ? idx.map((k) => p[k - 1] ?? '').join(delim) : l; }).join('\n') + (linhas.length ? '\n' : '') };
  },

  find: (c) => {
    let inicio = '.';
    let i = 0;
    if (c.args[0] && !c.args[0].startsWith('-')) { inicio = c.args[0]; i = 1; }
    const filtros = [];
    for (; i < c.args.length; i++) {
      const [op, v] = [c.args[i], c.args[i + 1]];
      if (op === '-name' || op === '-iname') { const re = globRegex(v); const ci = op === '-iname'; filtros.push((_, n, nome) => (ci ? globRegex(v.toLowerCase()).test(nome.toLowerCase()) : re.test(nome))); i++; }
      else if (op === '-type') { filtros.push((_, n) => n.t === v); i++; }
      else if (op === '-size') {
        const m = /^([+-]?)(\d+)([kMG]?)$/.exec(v ?? '');
        if (!m) throw new Erro(`find: tamanho inválido em -size: ${v}`);
        const b = Number(m[2]) * ({ k: 1024, M: 1024 ** 2, G: GB }[m[3]] ?? 512);
        filtros.push((_, n) => n.t === 'f' && (m[1] === '+' ? tamanho(n) > b : m[1] === '-' ? tamanho(n) < b : tamanho(n) === b));
        i++;
      } else throw new Erro(`find: predicado desconhecido “${op}” (o simulador suporta -name, -iname, -type, -size)`);
    }
    const { a, n } = resolver(c, inicio);
    if (!n) throw new Erro(`find: ‘${inicio}’: ${MSG_INEX}`);
    let out = '';
    let err = '';
    const visitar = (p, x, mostrado) => {
      const nome = p === '/' ? '/' : p.split('/').pop();
      if (filtros.every((fn) => fn(p, x, nome))) out += mostrado + '\n';
      if (x.t !== 'd') return;
      if (!pode(x, c.user, 4) || !pode(x, c.user, 1)) { err += `find: ‘${mostrado}’: ${MSG_PERM}\n`; return; }
      for (const k of Object.keys(x.children).sort()) visitar(p === '/' ? `/${k}` : `${p}/${k}`, x.children[k], mostrado === '/' ? `/${k}` : `${mostrado}/${k}`);
    };
    visitar(a, n, inicio);
    return { out, err };
  },

  rm: (c) => {
    const [f, alvos] = flags(c.args, 'rfRiv');
    if (!alvos.length) throw new Erro('rm: falta operando');
    const rec = f.has('r') || f.has('R');
    let err = '';
    for (const alvo of alvos) {
      const a = absoluto(c.st, alvo);
      if (CRITICOS.includes(a)) { err += `⚠ Bloqueado no laboratório: remover ${a} destruiria o sistema operacional.\n`; continue; }
      let r;
      try { r = resolver(c, alvo); } catch (e) { err += `rm: não foi possível remover '${alvo}': ${MSG_PERM}\n`; continue; }
      if (!r.n) { if (!f.has('f')) err += `rm: não foi possível remover '${alvo}': ${MSG_INEX}\n`; continue; }
      if (r.n.t === 'd' && !rec) { err += `rm: não foi possível remover '${alvo}': É um diretório\n`; continue; }
      const [pai, nome] = separar(a);
      const dir = no(c.st, pai);
      if (!pode(dir, c.user, 2)) { err += `rm: não foi possível remover '${alvo}': ${MSG_PERM}\n`; continue; }
      delete dir.children[nome];
    }
    return { err, ok: !err };
  },

  cp: (c) => copiarMover(c, 'cp'),
  mv: (c) => copiarMover(c, 'mv'),

  chmod: (c) => {
    const [, resto] = flags(c.args, 'Rv');
    const [m, ...arqs] = resto;
    if (!m || !arqs.length) throw new Erro('chmod: falta operando');
    for (const a of arqs) {
      const { n } = resolver(c, a);
      if (!n) throw new Erro(`chmod: não foi possível acessar '${a}': ${MSG_INEX}`);
      if (c.user !== 'root' && n.owner !== c.user) throw new Erro(`chmod: alterando as permissões de '${a}': Operação não permitida`);
      n.mode = novoModo(n.mode, m);
    }
  },

  chown: (c) => {
    const [dono, ...arqs] = c.args;
    if (!dono || !arqs.length) throw new Erro('chown: falta operando');
    for (const a of arqs) {
      const { n } = resolver(c, a);
      if (!n) throw new Erro(`chown: não foi possível acessar '${a}': ${MSG_INEX}`);
      if (c.user !== 'root') throw new Erro(`chown: alterando o dono de '${a}': Operação não permitida`);
      n.owner = dono.split(':')[0];
    }
  },

  ps: (c) => {
    if (!c.args.length) return { out: '    PID TTY          TIME CMD\n   1402 pts/0    00:00:00 bash\n   9999 pts/0    00:00:00 ps\n' };
    const cab = 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n';
    return { out: cab + c.st.procs.map((p) => `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(Math.round(p.mem * 40000 + 9000)).padStart(6)} ${String(Math.round(p.mem * 39000 + 3000)).padStart(5)} ${p.pid === 1402 ? 'pts/0   ' : '?       '} ${p.cpu > 50 ? 'R' : 'S'}s   08:00   ${p.cpu > 50 ? '42:17' : '0:00'} ${p.cmd}`).join('\n') + '\n' };
  },

  top: (c) => {
    const carga = c.st.procs.some((p) => p.cpu > 50) ? '3.98, 3.95, 3.90' : '0.08, 0.05, 0.01';
    const ord = [...c.st.procs].sort((a, b) => b.cpu - a.cpu);
    return {
      out: `top - 10:00:00 up 3 days,  1 user,  load average: ${carga}\nTarefas: ${ord.length} total,   ${ord.filter((p) => p.cpu > 50).length} executando\nMiB Mem :   3900,0 total\n\n    PID USUÁRIO   %CPU %MEM COMANDO\n` +
        ord.map((p) => `${String(p.pid).padStart(7)} ${p.user.padEnd(9)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.cmd.split(' ')[0]}`).join('\n') +
        '\n(instantâneo: no Linux real o top é interativo e se atualiza; saia com q)\n',
    };
  },

  kill: (c) => {
    const pids = c.args.filter((a) => !a.startsWith('-'));
    if (!pids.length) throw new Erro('kill: uso: kill [-s sinal | -n num | -sinal] pid');
    let err = '';
    for (const pid of pids) {
      const r = matar(c, (p) => p.pid === Number(pid));
      if (!r.achou) err += `bash: kill: (${pid}) - Processo inexistente\n`;
      else if (r.negados.length) err += `bash: kill: (${pid}) - Operação não permitida\n`;
    }
    return { err, ok: !err };
  },

  pkill: (c) => {
    const nome = c.args.filter((a) => !a.startsWith('-'))[0];
    if (!nome) throw new Erro('pkill: nenhum critério de correspondência especificado');
    const r = matar(c, (p) => p.cmd.includes(nome));
    return { err: r.negados.map((p) => `pkill: killing pid ${p.pid} failed: Operação não permitida\n`).join(''), ok: r.achou && !r.negados.length };
  },

  df: (c) => {
    const h = c.args.includes('-h');
    const uso = usoVar(c.st);
    const usado = (VAR_TOTAL * uso) / 100;
    const fmt = (b) => (h ? humano(b) : String(Math.round(b / 1024)));
    const linhas = [
      ['/dev/sda1', 30 * GB, 8.1 * GB, '/'],
      ['/dev/sdb1', VAR_TOTAL, usado, '/var'],
      ['tmpfs', 2 * GB, 0, '/tmp'],
    ];
    return {
      out: `${'Sist. Arq.'.padEnd(15)} ${(h ? 'Tam.' : '1K-blocos').padStart(10)} ${'Usado'.padStart(10)} ${'Disp.'.padStart(10)} Uso% Montado em\n` +
        linhas.map(([d, t, u, m]) => `${d.padEnd(15)} ${fmt(t).padStart(10)} ${fmt(u).padStart(10)} ${fmt(t - u).padStart(10)} ${String(Math.round((u / t) * 100)).padStart(3)}% ${m}`).join('\n') + '\n',
    };
  },

  free: (c) => {
    const minerador = c.st.procs.some((p) => p.cmd.includes('cryptominer'));
    const usada = minerador ? 3.1 : 1.9;
    return { out: `               total       usada       livre    buff/cache  disponível\nMem:           3,8Gi       ${String(usada).replace('.', ',')}Gi       ${String((3.8 - usada - 0.5).toFixed(1)).replace('.', ',')}Gi       0,5Gi       ${String((3.8 - usada).toFixed(1)).replace('.', ',')}Gi\nSwap:          2,0Gi          0B       2,0Gi\n` };
  },

  ip: (c) => {
    const sub = c.args[0] ?? '';
    if (['a', 'addr', 'address'].includes(sub)) {
      return { out: '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP\n    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff\n    inet 192.168.10.20/24 brd 192.168.10.255 scope global eth0\n' };
    }
    if (['r', 'route'].includes(sub)) return { out: 'default via 192.168.10.1 dev eth0\n192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.20\n' };
    if (sub === 'link') return { out: '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP\n' };
    throw new Erro('Uso no simulador: ip a | ip route | ip link');
  },

  ping: (c) => {
    const [, resto] = flags(c.args, '');
    const host = resto.filter((a, i) => !a.startsWith('-') && resto[i - 1] !== '-c').at(-1);
    const iC = resto.indexOf('-c');
    const n = Math.min(Number(iC >= 0 ? resto[iC + 1] : 4) || 4, 10);
    if (!host) throw new Erro('ping: destino de endereço necessário');
    const ip = resolverNome(c.st, host);
    if (!ip) throw new Erro(`ping: ${host}: Falha temporária na resolução de nome`);
    let out = `PING ${host} (${ip}) 56(84) bytes of data.\n`;
    for (let i = 1; i <= n; i++) out += `64 bytes from ${ip}: icmp_seq=${i} ttl=${ip.startsWith('127.') ? 64 : 57} time=${ip.startsWith('127.') ? '0.045' : (11 + i * 0.7).toFixed(1)} ms\n`;
    out += `\n--- ${host} ping statistics ---\n${n} packets transmitted, ${n} received, 0% packet loss, time ${(n - 1) * 1001}ms\n(simulado: nenhum pacote real foi enviado)\n`;
    return { out };
  },

  curl: (c) => {
    const [f, resto] = flags(c.args, 'Isv');
    const url = resto[0];
    if (!url) throw new Erro('curl: try \'curl --help\' for more information');
    const host = url.replace(/^https?:\/\//, '').split(/[/:]/)[0];
    const local = ['localhost', '127.0.0.1', c.st.host, '192.168.10.20'].includes(host);
    if (!local) {
      if (!resolverNome(c.st, host)) throw new Erro(`curl: (6) Could not resolve host: ${host}`);
      return { out: `(simulado) O laboratório não acessa a internet: nenhuma requisição foi enviada para ${host}.\n` };
    }
    if (!c.st.servicos.nginx.ativo) throw new Erro(`curl: (7) Failed to connect to ${host} port 80 after 0 ms: Couldn't connect to server`);
    const corpo = lerArquivo(c.st, '/var/www/html/index.html') ?? '';
    const cab = `HTTP/1.1 200 OK\nServer: nginx/1.24.0 (Ubuntu)\nContent-Type: text/html\nContent-Length: ${corpo.length}\n`;
    return { out: f.has('I') ? cab : corpo };
  },

  nginx: (c) => {
    if (c.args[0] !== '-t') throw new Erro('No simulador use: nginx -t (testa a configuração). Para iniciar: sudo systemctl start nginx');
    const r = testarNginx(c.st);
    return r.ok ? { err: r.msg + '\n' } : { err: r.msg + '\nnginx: configuration file /etc/nginx/nginx.conf test failed\n', ok: false };
  },

  systemctl: (c) => {
    const [acao, nomeBruto] = c.args;
    const nome = (nomeBruto ?? '').replace(/\.service$/, '');
    const svc = c.st.servicos[nome === 'sshd' ? 'ssh' : nome];
    if (!acao) throw new Erro('Uso: systemctl [status|start|stop|restart|reload|enable|disable|is-active] serviço');
    if (!svc) throw new Erro(`Unit ${nome || '?'}.service could not be found.`);
    const unidade = `${nome}.service`;
    if (!['status', 'is-active', 'is-enabled'].includes(acao) && c.user !== 'root') throw new Erro(`Failed to ${acao} ${unidade}: Access denied (use sudo)`);
    const chave = nome === 'sshd' ? 'ssh' : nome;
    switch (acao) {
      case 'status': {
        const est = svc.ativo ? 'active (running)' : svc.falhou ? 'failed (Result: exit-code)' : 'inactive (dead)';
        return { out: `● ${unidade}\n     Loaded: loaded (/lib/systemd/system/${unidade}; ${svc.habilitado ? 'enabled' : 'disabled'})\n     Active: ${est}\n${svc.falhou && !svc.ativo ? `   ${svc.falhou}\n` : ''}`, ok: svc.ativo };
      }
      case 'is-active': return { out: (svc.ativo ? 'active' : svc.falhou ? 'failed' : 'inactive') + '\n', ok: svc.ativo };
      case 'is-enabled': return { out: (svc.habilitado ? 'enabled' : 'disabled') + '\n', ok: svc.habilitado };
      case 'enable': svc.habilitado = true; return { err: `Created symlink /etc/systemd/system/multi-user.target.wants/${unidade} → /lib/systemd/system/${unidade}.\n` };
      case 'disable': svc.habilitado = false; return { err: `Removed /etc/systemd/system/multi-user.target.wants/${unidade}.\n` };
      case 'stop': svc.ativo = false; c.st.procs = c.st.procs.filter((p) => p.svc !== chave); return {};
      case 'start': case 'restart': case 'reload': return iniciarServico(c.st, chave, unidade);
      default: throw new Erro(`Unknown command verb ${acao}.`);
    }
  },

  journalctl: (c) => {
    const nome = c.args[c.args.indexOf('-u') + 1]?.replace(/\.service$/, '');
    const svc = c.st.servicos[nome];
    if (!svc) return { out: '-- No entries --\n' };
    return { out: svc.falhou ? `out 15 10:00:00 ${c.st.host} systemd[1]: Starting ${nome}.service...\nout 15 10:00:00 ${c.st.host} ${nome}[2001]: ${svc.falhou}\nout 15 10:00:00 ${c.st.host} systemd[1]: ${nome}.service: Failed with result 'exit-code'.\n` : `out 15 10:00:00 ${c.st.host} systemd[1]: ${svc.ativo ? 'Started' : 'Stopped'} ${nome}.service.\n` };
  },

  ufw: (c) => {
    if (c.user !== 'root') throw new Erro('ERROR: You need to be root to run this script');
    const u = c.st.ufw;
    const [acao, ...resto] = c.args;
    const porta = (s) => ({ ssh: '22', openssh: '22', http: '80', https: '443' }[String(s).toLowerCase()] ?? String(s).split('/')[0]);
    switch (acao) {
      case 'status':
        return { out: u.ativo ? `Status: active\n\nTo                         Action      From\n--                         ------      ----\n${u.regras.map((r) => `${r.porta.padEnd(27)}${r.acao.padEnd(12)}Anywhere`).join('\n')}\n` : 'Status: inactive\n' };
      case 'enable': {
        u.ativo = true;
        const aviso = u.regras.some((r) => r.porta === '22' && r.acao === 'ALLOW') ? '' : 'Command may disrupt existing ssh connections. Proceed with operation (y|n)? y  ← (respondido pelo simulador: cuidado, sem liberar a 22 você perderia o acesso remoto!)\n';
        return { out: aviso + 'Firewall is active and enabled on system startup\n' };
      }
      case 'disable': u.ativo = false; return { out: 'Firewall stopped and disabled on system startup\n' };
      case 'allow': case 'deny': {
        if (!resto[0]) throw new Erro(`ERROR: Wrong number of arguments`);
        const p = porta(resto[0]);
        u.regras = u.regras.filter((r) => r.porta !== p).concat({ porta: p, acao: acao.toUpperCase() });
        return { out: 'Rules updated\nRules updated (v6)\n' };
      }
      case 'delete': {
        const p = porta(resto.at(-1));
        const antes = u.regras.length;
        u.regras = u.regras.filter((r) => r.porta !== p);
        return { out: antes === u.regras.length ? 'Could not delete non-existent rule\n' : 'Rule deleted\nRule deleted (v6)\n' };
      }
      default: throw new Erro('Uso no simulador: ufw status | enable | disable | allow PORTA | deny PORTA | delete allow PORTA');
    }
  },

  ssh: () => ({ out: 'Simulação: nenhuma conexão SSH real é feita pelo laboratório.\nPara praticar, configure o servidor SSH deste host em /etc/ssh/sshd_config e reinicie com sudo systemctl restart ssh.\n' }),
  su: () => ({ err: 'No laboratório use sudo antes de cada comando em vez de abrir um shell root.\n', ok: false }),

  nano: (c) => editar(c),
  vim: (c) => editar(c),
  vi: (c) => editar(c),

  bash: (c) => (c.args[0] ? script(c, c.args[0], false) : { err: 'Shell interativo aninhado não é simulado.\n' }),
  sh: (c) => (c.args[0] ? script(c, c.args[0], false) : { err: 'Shell interativo aninhado não é simulado.\n' }),
};

function cabecaCauda(c, cmd) {
  let n = 10;
  const arqs = [];
  for (let i = 0; i < c.args.length; i++) {
    const a = c.args[i];
    if (a === '-n') n = Number(c.args[++i]);
    else if (/^-\d+$/.test(a)) n = Number(a.slice(1));
    else arqs.push(a);
  }
  const txt = arqs.length ? lerTexto(c, arqs[0], cmd) : c.stdin;
  const linhas = txt.split('\n');
  if (linhas.at(-1) === '') linhas.pop();
  const sel = cmd === 'head' ? linhas.slice(0, n) : linhas.slice(-n);
  return { out: sel.length ? sel.join('\n') + '\n' : '' };
}

function copiarMover(c, cmd) {
  const [f, args] = flags(c.args, 'rRfv');
  if (args.length < 2) throw new Erro(`${cmd}: falta o operando arquivo de destino`);
  const destino = args.pop();
  const d = resolver(c, destino);
  for (const orig of args) {
    const o = resolver(c, orig);
    if (!o.n) throw new Erro(`${cmd}: não foi possível obter estado de '${orig}': ${MSG_INEX}`);
    if (cmd === 'cp' && o.n.t === 'd' && !(f.has('r') || f.has('R'))) throw new Erro(`cp: -r não especificado; omitindo o diretório '${orig}'`);
    if (!pode(o.n, c.user, 4)) throw new Erro(`${cmd}: não foi possível abrir '${orig}' para leitura: ${MSG_PERM}`);
    const alvo = d.n?.t === 'd' ? `${d.a}/${separar(o.a)[1]}` : d.a;
    if (alvo === o.a || alvo.startsWith(o.a + '/')) throw new Erro(`${cmd}: não é possível mover/copiar '${orig}' para dentro de si mesmo`);
    const [paiAlvo, nomeAlvo] = separar(alvo);
    const dir = no(c.st, paiAlvo);
    if (!dir || dir.t !== 'd') throw new Erro(`${cmd}: não foi possível criar '${destino}': ${MSG_INEX}`);
    if (!pode(dir, c.user, 2)) throw new Erro(`${cmd}: não foi possível criar '${destino}': ${MSG_PERM}`);
    if (cmd === 'mv') {
      const [paiOrig, nomeOrig] = separar(o.a);
      const dirOrig = no(c.st, paiOrig);
      if (!pode(dirOrig, c.user, 2)) throw new Erro(`mv: não foi possível mover '${orig}': ${MSG_PERM}`);
      delete dirOrig.children[nomeOrig];
      dir.children[nomeAlvo] = o.n;
    } else {
      const copia = structuredClone(o.n);
      percorrer(copia, '', (_, x) => { x.owner = c.user; });
      dir.children[nomeAlvo] = copia;
    }
  }
}

function novoModo(atual, m) {
  if (/^[0-7]{3,4}$/.test(m)) return parseInt(m.slice(-3), 8);
  let modo = atual;
  for (const parte of m.split(',')) {
    const r = /^([ugoa]*)([+\-=])([rwx]+)$/.exec(parte);
    if (!r) throw new Erro(`chmod: modo inválido: “${m}”`);
    const quem = r[1] === '' || r[1].includes('a') ? 'ugo' : r[1];
    const bits = (r[3].includes('r') ? 4 : 0) | (r[3].includes('w') ? 2 : 0) | (r[3].includes('x') ? 1 : 0);
    for (const q of quem) {
      const s = { u: 6, g: 3, o: 0 }[q];
      if (r[2] === '+') modo |= bits << s;
      else if (r[2] === '-') modo &= ~(bits << s);
      else modo = (modo & ~(7 << s)) | (bits << s);
    }
  }
  return modo;
}

function matar(c, filtro) {
  const alvos = c.st.procs.filter(filtro);
  const negados = [];
  for (const p of alvos) {
    if (c.user !== 'root' && p.user !== c.user) { negados.push(p); continue; }
    c.st.procs = c.st.procs.filter((x) => x !== p);
    if (p.svc) c.st.servicos[p.svc].ativo = false;
  }
  return { achou: alvos.length > 0, negados };
}

function iniciarServico(st, nome, unidade) {
  const svc = st.servicos[nome];
  if (nome === 'nginx') {
    const t = testarNginx(st);
    if (!t.ok) {
      svc.ativo = false;
      svc.falhou = t.msg;
      st.procs = st.procs.filter((p) => p.svc !== 'nginx');
      return { err: `Job for ${unidade} failed because the control process exited with error code.\nSee "systemctl status ${unidade}" and "journalctl -xeu ${unidade}" for details.\n`, ok: false };
    }
    if (!st.procs.some((p) => p.svc === 'nginx')) {
      st.procs.push({ pid: 2001, user: 'root', cpu: 0, mem: 0.2, cmd: 'nginx: master process /usr/sbin/nginx', svc: 'nginx' },
        { pid: 2002, user: 'www-data', cpu: 0, mem: 0.3, cmd: 'nginx: worker process', svc: 'nginx' });
    }
  }
  if (nome === 'ssh') svc.carregado = lerArquivo(st, '/etc/ssh/sshd_config');
  svc.ativo = true;
  delete svc.falhou;
  return {};
}

function resolverNome(st, host) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return host;
  if (host === 'localhost') return '127.0.0.1';
  const linha = (lerArquivo(st, '/etc/hosts') ?? '').split('\n').find((l) => l.split(/\s+/).slice(1).includes(host));
  if (linha) return linha.split(/\s+/)[0];
  if (!/^\s*nameserver\s+\d+\.\d+\.\d+\.\d+/m.test(lerArquivo(st, '/etc/resolv.conf') ?? '')) return null;
  let h = 0;
  for (const ch of host) h = (h * 31 + ch.charCodeAt(0)) % 250;
  return `203.0.113.${h + 1}`; // faixa reservada para documentação (RFC 5737)
}

function editar(c) {
  const arq = c.args[0];
  if (!arq) throw new Erro('Informe o arquivo: nano caminho/do/arquivo');
  const { a, n } = resolver(c, arq);
  if (n?.t === 'd') throw new Erro(`${arq} é um diretório`);
  if (n && !pode(n, c.user, 4)) throw new Erro(`[ Erro ao ler ${arq}: ${MSG_PERM} ]`);
  return { editar: { caminho: a, conteudo: n?.content ?? '', root: c.user === 'root' }, out: '' };
}

// ---------- distribuições (Ubuntu, Fedora, Arch) e comandos extras ----------
export const DISTROS = {
  ubuntu: { nome: 'Ubuntu 24.04 LTS', id: 'ubuntu', like: 'debian', kernel: '6.8.0-45-generic', pm: 'apt', shell: 'bash 5.2.21', de: 'GNOME 46' },
  fedora: { nome: 'Fedora Linux 41 (Workstation Edition)', id: 'fedora', like: '', kernel: '6.11.4-301.fc41.x86_64', pm: 'dnf', shell: 'bash 5.2.32', de: 'GNOME 47' },
  arch: { nome: 'Arch Linux', id: 'arch', like: '', kernel: '6.11.5-arch1-1', pm: 'pacman', shell: 'bash 5.2.37', de: 'KDE Plasma 6.2' },
};
const REPO = ['htop', 'vim', 'git', 'curl', 'wget', 'nginx', 'fastfetch', 'neofetch', 'sl', 'tree', 'docker', 'python3', 'nodejs', 'gcc', 'tmux', 'cowsay'];
const distroAtual = (st) => DISTROS[st.distro ?? 'ubuntu'];
const pacotes = (st) => (st.pacotes ??= ['bash', 'coreutils', 'systemd', 'openssh', 'nginx']);

export function definirDistro(st, id) {
  if (!DISTROS[id]) return false;
  st.distro = id;
  const d = DISTROS[id];
  no(st, '/etc').children['os-release'] = F(`PRETTY_NAME="${d.nome}"\nID=${d.id}\n${d.like ? `ID_LIKE=${d.like}\n` : ''}`);
  return true;
}

function gerenciador(c, pm) {
  const d = distroAtual(c.st);
  if (d.pm !== pm) return { err: `bash: ${pm}: comando não encontrado\n(Em ${d.nome} o gerenciador de pacotes é ${d.pm}.)\n`, ok: false };
  const a = c.args;
  const op = pm === 'pacman'
    ? ({ '-S': 'i', '-R': 'r', '-Rs': 'r', '-Ss': 'b', '-Syu': 'u', '-Q': 'l' }[a[0]])
    : ({ install: 'i', remove: 'r', search: 'b', update: 'u', upgrade: 'u', list: 'l' }[a[0]]);
  const alvos = a.slice(1).filter((x) => !x.startsWith('-'));
  if (['i', 'r', 'u'].includes(op) && c.user !== 'root') {
    return { err: pm === 'pacman' ? 'error: you cannot perform this operation unless you are root.\n' : 'E: Não foi possível abrir o arquivo de trava - permissão negada. Você é root? (use sudo)\n', ok: false };
  }
  if (op === 'u') {
    return { out: { apt: 'Lendo listas de pacotes... Pronto\nTodos os pacotes estão atualizados.\n', dnf: 'Dependências resolvidas.\nNada a fazer.\nConcluído!\n', pacman: ':: Sincronizando bancos de dados de pacotes...\n:: Iniciando atualização completa do sistema...\n não há nada para fazer\n' }[pm] + '(simulado)\n' };
  }
  if (op === 'l') return { out: pacotes(c.st).slice().sort().map((p) => (pm === 'pacman' ? `${p} 1.0-1` : `${p} 1.0 [instalado]`)).join('\n') + '\n' };
  if (op === 'b') return { out: REPO.filter((p) => p.includes(alvos[0] ?? '')).map((p) => `${p} - pacote ${p}`).join('\n') + '\n' };
  if (op === 'i' || op === 'r') {
    let out = '';
    for (const p of alvos) {
      const tem = pacotes(c.st).includes(p);
      if (op === 'i' && !REPO.includes(p)) out += { pacman: `error: target not found: ${p}\n`, dnf: `Nenhuma correspondência para o argumento: ${p}\n`, apt: `E: Impossível encontrar o pacote ${p}\n` }[pm];
      else if (op === 'i' && !tem) { pacotes(c.st).push(p); out += { pacman: `resolvendo dependências...\n(1/1) instalando ${p}\n`, dnf: `Instalando: ${p}\nConcluído!\n`, apt: `Configurando ${p} ...\n` }[pm]; }
      else if (op === 'i') out += `${p} já está instalado na versão mais recente.\n`;
      else if (tem) { c.st.pacotes = pacotes(c.st).filter((x) => x !== p); out += `Removendo ${p} ...\n`; }
      else out += `O pacote ${p} não está instalado.\n`;
    }
    return { out: `${out}(simulado: nada foi baixado)\n` };
  }
  return { out: pm === 'pacman' ? 'uso: pacman -S | -R | -Ss | -Syu | -Q\n' : `uso: ${pm} install | remove | search | update | upgrade | list\n` };
}

const exige = (c, p) => (pacotes(c.st).includes(p) ? null : { err: `bash: ${p}: comando não encontrado\nInstale com: ${{ apt: 'sudo apt install', dnf: 'sudo dnf install', pacman: 'sudo pacman -S' }[distroAtual(c.st).pm]} ${p}\n`, ok: false });

const TREM = [
  '                        (@@) (  ) (@)  ( )  @@    ()    @     O     @',
  '                   (   )',
  '               (@@@@)',
  '            (    )',
  '          (@@@)',
  '       ====        ________                ___________',
  '   _D _|  |_______/        \\__I_I_____===__|_________|',
  '    |(_)---  |   H\\________/ |   |        =|___ ___|',
  '    /     |  |   H  |  |     |   |         ||_| |_||',
  '   |      |  |   H  |__--------------------| [___] |',
  '   | ________|___H__/__|_____/[][]~\\_______|       |',
  '   |/ |   |-----------I_____I [][] []  D   |=======|__',
  ' __/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
  '  |/-=|___|=    ||    ||    ||    |_____/~\\___/',
  '   \\_/      \\O=====O=====O=====O_/      \\_/',
].join('\n') + '\n';

const LOGOS = {
  ubuntu: ['    .-.     ', '  .-(   )-.  ', ' (  UBUNTU  )', '  `-(   )-`  ', '    `-`     '],
  fedora: ['   ______   ', '  /  __  \\  ', ' |  |__|  | ', ' |  FEDORA | ', '  \\______/  '],
  arch: ['     /\\     ', '    /  \\    ', '   / /\\ \\   ', '  /  ARCH \\ ', ' /___/\\___\\ '],
};

function ficha(c) {
  const d = distroAtual(c.st);
  const logo = LOGOS[d.id];
  const info = [`aluno@${c.st.host}`, '-----------------', `SO: ${d.nome} x86_64`, `Kernel: Linux ${d.kernel}`, 'Uptime: 3 days, 2 hours', `Pacotes: ${pacotes(c.st).length + 1200} (${d.pm})`, `Shell: ${d.shell}`, `DE: ${d.de}`, 'CPU: Processador virtual (4) @ 2.40 GHz', 'Memória: 1.90 GiB / 3.80 GiB (50%)', 'Disco (/): 8.10 GiB / 30.00 GiB (27%)', 'IP local (eth0): 192.168.10.20/24'];
  return { out: info.map((l, i) => `${(logo[i] ?? '').padEnd(14)}  ${l}`).join('\n') + '\n' };
}

Object.assign(CMDS, {
  apt: (c) => gerenciador(c, 'apt'), 'apt-get': (c) => gerenciador(c, 'apt'), dnf: (c) => gerenciador(c, 'dnf'), yum: (c) => gerenciador(c, 'dnf'), pacman: (c) => gerenciador(c, 'pacman'),
  sl: (c) => exige(c, 'sl') ?? { out: TREM },
  fastfetch: (c) => exige(c, 'fastfetch') ?? ficha(c),
  neofetch: (c) => exige(c, 'neofetch') ?? ficha(c),
  cowsay: (c) => {
    const e = exige(c, 'cowsay');
    if (e) return e;
    const t = c.args.join(' ') || 'Muu!';
    return { out: ` ${'_'.repeat(t.length + 2)}\n< ${t} >\n ${'-'.repeat(t.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||\n` };
  },
  uptime: () => ({ out: ' 10:00:00 up 3 days,  2:00,  1 user,  load average: 0.08, 0.05, 0.01\n' }),
  lsblk: () => ({ out: 'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   30G  0 disk\n└─sda1   8:1    0   30G  0 part /\nsdb      8:16   0   20G  0 disk\n└─sdb1   8:17   0   20G  0 part /var\n' }),
  ss: () => ({ out: 'Netid State  Local Address:Port  Peer Address:Port Process\ntcp   LISTEN 0.0.0.0:22          0.0.0.0:*         sshd\ntcp   LISTEN 127.0.0.1:3306      0.0.0.0:*         mysqld\n' }),
  hostnamectl: (c) => { const d = distroAtual(c.st); return { out: ` Static hostname: ${c.st.host}\nOperating System: ${d.nome}\n          Kernel: Linux ${d.kernel}\n    Architecture: x86-64\n` }; },
  which: (c) => ({ out: c.args.map((a) => `/usr/bin/${a}`).join('\n') + '\n' }),
  distro: (c) => (definirDistro(c.st, c.args[0])
    ? { out: `Distribuição alterada para ${distroAtual(c.st).nome}. Gerenciador de pacotes: ${distroAtual(c.st).pm}.\n` }
    : { out: `Atual: ${distroAtual(c.st).nome}\nUso: distro ubuntu | fedora | arch\n` }),
});
delete ALTERNATIVAS.apt;
delete ALTERNATIVAS['apt-get'];
Object.assign(AJUDA, { 'apt/dnf/pacman': 'gerenciador de pacotes da distro (com sudo)', fastfetch: 'ficha do sistema (instale antes)', sl: 'o trem de quem erra o ls (instale antes)', distro: 'troca entre ubuntu, fedora e arch', uptime: 'tempo ligado', lsblk: 'discos e partições', ss: 'portas abertas', hostnamectl: 'nome da máquina e SO' });

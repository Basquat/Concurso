// Simulador do Docker CLI com a semântica real: imagens em camadas, contêineres com ciclo de vida
// (created → running → exited), portas publicadas, volumes, logs, build a partir de Dockerfile e docker compose.

const REGISTRO = {
  'nginx': { tags: ['latest', '1.27', 'alpine'], cmd: 'nginx -g daemon off;', porta: 80, log: ['/docker-entrypoint.sh: Configuration complete; ready for start up', 'start worker processes'] },
  'postgres': { tags: ['latest', '17', '16'], cmd: 'postgres', porta: 5432, log: ['PostgreSQL init process complete; ready for start up.', 'database system is ready to accept connections'], exige: 'POSTGRES_PASSWORD' },
  'node': { tags: ['latest', '22', '20-alpine'], cmd: 'node', porta: null, log: ['Welcome to Node.js v22.'] },
  'python': { tags: ['latest', '3.12', '3.12-slim'], cmd: 'python3', porta: null, log: ['Python 3.12.7'] },
  'redis': { tags: ['latest', '7'], cmd: 'redis-server', porta: 6379, log: ['Ready to accept connections tcp'] },
  'hello-world': { tags: ['latest'], cmd: '/hello', porta: null, log: ['Hello from Docker!', 'This message shows that your installation appears to be working correctly.'], sai: true },
  'mysql': { tags: ['latest', '8.4'], cmd: 'mysqld', porta: 3306, log: ['mysqld: ready for connections.'], exige: 'MYSQL_ROOT_PASSWORD' },
};
const id12 = () => Array.from({ length: 12 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const NOMES = ['brave_turing', 'eager_hopper', 'quirky_lovelace', 'sleepy_dijkstra', 'jolly_knuth', 'vibrant_liskov', 'happy_torvalds'];

export const novoDocker = () => ({ imagens: {}, conteineres: [], volumes: [], redes: ['bridge', 'host', 'none'], arquivos: { Dockerfile: 'FROM node:22\nWORKDIR /app\nCOPY . .\nRUN npm install\nEXPOSE 3000\nCMD ["node", "server.js"]\n', 'compose.yaml': 'services:\n  web:\n    image: nginx\n    ports:\n      - "8080:80"\n  db:\n    image: postgres:17\n    environment:\n      POSTGRES_PASSWORD: segredo\n' } });

const ref = (s) => { const [n, t = 'latest'] = s.split(':'); return { nome: n, tag: t, chave: `${n}:${t}` }; };
function puxar(d, img, saida) {
  const r = ref(img);
  if (d.imagens[r.chave]) return true;
  const base = REGISTRO[r.nome];
  if (!base || !base.tags.includes(r.tag)) { saida.push(`Error response from daemon: pull access denied for ${r.nome}, repository does not exist or may require 'docker login'`); return false; }
  saida.push(`Unable to find image '${r.chave}' locally`, `${r.tag}: Pulling from library/${r.nome}`, 'Digest: sha256:' + id12() + id12(), `Status: Downloaded newer image for ${r.chave}`);
  d.imagens[r.chave] = { id: id12(), ...base, tamanho: `${50 + r.nome.length * 23}MB`, camadas: 4 };
  return true;
}
const acharC = (d, x) => d.conteineres.find((c) => c.nome === x || c.id.startsWith(x));

export function executar(d, linha) {
  const a = linha.match(/"[^"]*"|'[^']*'|\S+/g)?.map((x) => x.replace(/^["']|["']$/g, '')) ?? [];
  if (a[0] === 'cat') return d.arquivos[a[1]] ?? `cat: ${a[1]}: No such file`;
  if (a[0] === 'ls') return Object.keys(d.arquivos).join('  ');
  if (a[0] === 'curl') { const porta = Number((a[1] ?? '').match(/:(\d+)/)?.[1]); const c = d.conteineres.find((x) => x.estado === 'running' && x.portas.some((p) => p.host === porta)); return c ? (c.imagem.startsWith('nginx') ? '<!DOCTYPE html>\n<title>Welcome to nginx!</title>' : `resposta do contêiner ${c.nome}`) : `curl: (7) Failed to connect to localhost port ${porta}: Connection refused`; }
  if (a[0] !== 'docker') return `${a[0]}: comando não encontrado (use docker, cat, ls, curl)`;
  const [, sub, ...r] = a;
  const out = [];
  if (sub === 'version') return 'Client: Docker Engine - Community\n Version: 27.3.1\nServer: Docker Engine - Community (simulado)';
  if (sub === 'pull') { puxar(d, r[0], out); return out.join('\n'); }
  if (sub === 'images' || (sub === 'image' && r[0] === 'ls')) return ['REPOSITORY   TAG       IMAGE ID       SIZE', ...Object.entries(d.imagens).map(([k, v]) => `${k.split(':')[0].padEnd(12)} ${k.split(':')[1].padEnd(9)} ${v.id}   ${v.tamanho}`)].join('\n');
  if (sub === 'run' || sub === 'create') {
    const op = { d: false, p: [], e: {}, nome: null, v: [], rm: false };
    let i = 0;
    for (; i < r.length && r[i].startsWith('-'); i++) {
      const f = r[i];
      if (f === '-d') op.d = true; else if (f === '--rm') op.rm = true; else if (f === '-it' || f === '-i' || f === '-t') { /* interativo */ } else if (f === '-p') op.p.push(r[++i]); else if (f === '-e') { const [k, v] = r[++i].split('='); op.e[k] = v; } else if (f === '--name') op.nome = r[++i]; else if (f === '-v') op.v.push(r[++i]); else return `unknown flag: ${f}`;
    }
    const img = r[i];
    if (!img) return '"docker run" requires at least 1 argument.';
    if (!puxar(d, img, out)) return out.join('\n');
    const im = d.imagens[ref(img).chave];
    const nome = op.nome ?? NOMES[d.conteineres.length % NOMES.length] + (d.conteineres.length >= NOMES.length ? d.conteineres.length : '');
    if (d.conteineres.some((c) => c.nome === nome)) return `docker: Error response from daemon: Conflict. The container name "/${nome}" is already in use.`;
    const portas = op.p.map((x) => { const [h, c] = x.split(':').map(Number); return { host: h, cont: c }; });
    for (const p of portas) if (d.conteineres.some((c) => c.estado === 'running' && c.portas.some((q) => q.host === p.host))) return `docker: Error response from daemon: Bind for 0.0.0.0:${p.host} failed: port is already allocated.`;
    op.v.forEach((v) => { const n = v.split(':')[0]; if (!n.startsWith('/') && !d.volumes.includes(n)) d.volumes.push(n); });
    const falta = im.exige && !op.e[im.exige];
    const c = { id: id12(), nome, imagem: ref(img).chave, estado: sub === 'create' ? 'created' : falta || im.sai ? 'exited' : 'running', portas, env: op.e, volumes: op.v, logs: falta ? [`Error: Database is uninitialized and superuser password is not specified.\n       You must specify ${im.exige} to a non-empty value.`] : [...im.log], codigo: falta ? 1 : 0 };
    if (!(op.rm && c.estado === 'exited')) d.conteineres.push(c);
    if (sub === 'create') return c.id;
    if (!op.d || im.sai) out.push(...c.logs); else out.push(c.id + id12() + id12());
    return out.join('\n');
  }
  if (sub === 'ps') {
    const todos = r.includes('-a');
    const vis = d.conteineres.filter((c) => todos || c.estado === 'running');
    return ['CONTAINER ID   IMAGE            STATUS                     PORTS                  NAMES', ...vis.map((c) => `${c.id}   ${c.imagem.padEnd(16)} ${(c.estado === 'running' ? 'Up 2 minutes' : c.estado === 'created' ? 'Created' : `Exited (${c.codigo}) 1 minute ago`).padEnd(26)} ${c.portas.map((p) => `0.0.0.0:${p.host}->${p.cont}/tcp`).join(', ').padEnd(22)} ${c.nome}`)].join('\n');
  }
  if (['stop', 'start', 'restart', 'rm', 'logs', 'inspect', 'exec'].includes(sub)) {
    const forcar = r.includes('-f');
    const alvo = r.filter((x) => !x.startsWith('-'))[0];
    const c = acharC(d, alvo);
    if (!c) return `Error response from daemon: No such container: ${alvo}`;
    if (sub === 'stop') { c.estado = 'exited'; c.codigo = 0; return c.nome; }
    if (sub === 'start' || sub === 'restart') { if (c.env && REGISTRO[c.imagem.split(':')[0]]?.exige && !c.env[REGISTRO[c.imagem.split(':')[0]].exige]) return `Error: container ${c.nome} exits immediately (check docker logs)`; c.estado = 'running'; return c.nome; }
    if (sub === 'rm') { if (c.estado === 'running' && !forcar) return `Error response from daemon: cannot remove container "${c.nome}": container is running: stop the container before removing or force remove`; d.conteineres = d.conteineres.filter((x) => x !== c); return c.nome; }
    if (sub === 'logs') return c.logs.join('\n');
    if (sub === 'inspect') return JSON.stringify([{ Id: c.id, Name: `/${c.nome}`, State: { Status: c.estado, ExitCode: c.codigo }, Config: { Image: c.imagem, Env: Object.entries(c.env).map(([k, v]) => `${k}=${v}`) }, HostConfig: { PortBindings: c.portas, Binds: c.volumes } }], null, 2);
    if (sub === 'exec') { if (c.estado !== 'running') return `Error response from daemon: container ${c.id} is not running`; const cmd = r.slice(r.indexOf(alvo) + 1).join(' '); return cmd.includes('env') ? Object.entries(c.env).map(([k, v]) => `${k}=${v}`).join('\n') : cmd.includes('hostname') ? c.id : `(executado em ${c.nome}): ${cmd}`; }
  }
  if (sub === 'rmi') { const k = ref(r[0]).chave; if (d.conteineres.some((c) => c.imagem === k)) return `Error response from daemon: conflict: unable to remove repository reference "${k}" - container is using its referenced image`; delete d.imagens[k]; return `Untagged: ${k}`; }
  if (sub === 'volume') { if (r[0] === 'create') { d.volumes.push(r[1]); return r[1]; } return ['DRIVER    VOLUME NAME', ...d.volumes.map((v) => `local     ${v}`)].join('\n'); }
  if (sub === 'network') return ['NETWORK ID     NAME      DRIVER', ...d.redes.map((n) => `${id12()}   ${n.padEnd(9)} ${n === 'none' ? 'null' : n}`)].join('\n');
  if (sub === 'build') {
    const t = r[r.indexOf('-t') + 1];
    if (!r.includes('-t') || !t) return 'Use: docker build -t nome:tag .';
    const linhas = (d.arquivos.Dockerfile ?? '').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    if (!/^FROM\s/i.test(linhas[0] ?? '')) return 'ERROR: failed to solve: dockerfile parse error: first instruction must be FROM';
    linhas.forEach((l, k) => out.push(`#${k + 1} [${k + 1}/${linhas.length}] ${l}`));
    const base = linhas[0].split(/\s+/)[1];
    if (!puxar(d, base, [])) return `ERROR: failed to solve: ${base}: not found`;
    d.imagens[ref(t).chave] = { ...d.imagens[ref(base).chave], id: id12(), log: ['Servidor ouvindo na porta 3000'], porta: Number(linhas.find((l) => /^EXPOSE/i.test(l))?.split(/\s+/)[1]) || null, camadas: linhas.length, sai: false };
    out.push(`naming to docker.io/library/${ref(t).chave} done`);
    return out.join('\n');
  }
  if (sub === 'compose') {
    const yml = d.arquivos['compose.yaml'] ?? '';
    const servicos = {};
    let atual = null;
    let chave = null;
    for (const l of yml.split('\n')) {
      let m;
      if ((m = l.match(/^ {2}(\w[\w-]*):\s*$/))) { atual = servicos[m[1]] = { ports: [], env: {} }; chave = null; }
      else if (atual && (m = l.match(/^ {4}image:\s*(\S+)/))) atual.image = m[1];
      else if (atual && /^ {4}ports:/.test(l)) chave = 'ports';
      else if (atual && /^ {4}environment:/.test(l)) chave = 'env';
      else if (atual && chave === 'ports' && (m = l.match(/^ {6}- "?([\d:]+)"?/))) atual.ports.push(m[1]);
      else if (atual && chave === 'env' && (m = l.match(/^ {6}(\w+):\s*(.+)/))) atual.env[m[1]] = m[2];
    }
    if (r[0] === 'up') {
      for (const [n, s] of Object.entries(servicos)) {
        d.conteineres = d.conteineres.filter((c) => c.nome !== `projeto-${n}-1`);
        out.push(executar(d, `docker run -d --name projeto-${n}-1 ${s.ports.map((p) => `-p ${p}`).join(' ')} ${Object.entries(s.env).map(([k, v]) => `-e ${k}=${v}`).join(' ')} ${s.image}`).split('\n').filter((x) => !/^[0-9a-f]{20,}$/.test(x)).join('\n'));
        out.push(` ✔ Container projeto-${n}-1  Started`);
      }
      return out.filter(Boolean).join('\n');
    }
    if (r[0] === 'down') { d.conteineres = d.conteineres.filter((c) => !c.nome.startsWith('projeto-')); return Object.keys(servicos).map((n) => ` ✔ Container projeto-${n}-1  Removed`).join('\n'); }
    if (r[0] === 'ps') return executar(d, 'docker ps -a').split('\n').filter((l, k) => !k || l.includes('projeto-')).join('\n');
    return 'Use: docker compose up -d | ps | down';
  }
  return `docker: '${sub}' is not a docker command.\nSee 'docker --help'`;
}

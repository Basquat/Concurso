// Motor Git didático com o modelo de dados real: diretório de trabalho, índice (stage), commits encadeados,
// branches e HEAD. Comandos: init, status, add, commit -m, log [--oneline], branch [-d], checkout/switch [-b|-c],
// merge (fast-forward, 3-way e conflito), reset --hard, diff --stat, restore, e edição com echo/cat/ls/rm.

const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16).padStart(8, '0') + Math.abs(h % 9973).toString(16).padStart(4, '0').slice(0, 4); };

export const novoRepo = () => ({ iniciado: false, arquivos: {}, indice: {}, commits: {}, branches: {}, head: 'main', conflito: null, relogio: 0 });

const arvore = (r, id) => (id ? r.commits[id].arvore : {});
const atual = (r) => r.branches[r.head] ?? null;
function ancestrais(r, id) { const s = new Set(); const fila = [id]; while (fila.length) { const x = fila.pop(); if (!x || s.has(x)) continue; s.add(x); fila.push(...r.commits[x].pais); } return s; }
function base(r, a, b) { const aa = ancestrais(r, a); const fila = [b]; const vis = new Set(); while (fila.length) { const x = fila.shift(); if (!x || vis.has(x)) continue; vis.add(x); if (aa.has(x)) return x; fila.push(...r.commits[x].pais); } return null; }

export function status(r) {
  const t = arvore(r, atual(r));
  const preparados = [...new Set([...Object.keys(r.indice), ...Object.keys(t)])].filter((k) => r.indice[k] !== t[k]);
  const modificados = Object.keys(r.indice).filter((k) => k in r.arquivos && r.arquivos[k] !== r.indice[k]).concat(Object.keys(r.indice).filter((k) => !(k in r.arquivos)));
  const naoRastreados = Object.keys(r.arquivos).filter((k) => !(k in r.indice));
  return { preparados, modificados, naoRastreados };
}

function commitar(r, msg, pais) {
  r.relogio++;
  const id = hash(`${JSON.stringify(r.indice)}${msg}${pais.join()}${r.relogio}`).slice(0, 7);
  r.commits[id] = { id, msg, pais, arvore: { ...r.indice }, n: r.relogio };
  r.branches[r.head] = id;
  return id;
}

export function executar(r, linha) {
  const a = (linha.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((x) => x.replace(/^["']|["']$/g, ''));
  const [cmd, sub, ...resto] = a;
  if (!cmd) return '';
  if (cmd === 'echo') {
    const i = a.findIndex((x) => x === '>' || x === '>>');
    if (i < 0) return a.slice(1).join(' ');
    const f = a[i + 1];
    const txt = a.slice(1, i).join(' ');
    r.arquivos[f] = a[i] === '>>' && r.arquivos[f] != null ? `${r.arquivos[f]}\n${txt}` : txt;
    return '';
  }
  if (cmd === 'cat') return r.arquivos[sub] ?? `cat: ${sub}: Arquivo ou diretório inexistente`;
  if (cmd === 'ls') return Object.keys(r.arquivos).sort().join('  ');
  if (cmd === 'rm') { delete r.arquivos[sub]; return ''; }
  if (cmd === 'clear') return '\f';
  if (cmd !== 'git') return `${cmd}: comando não encontrado (use git, echo, cat, ls, rm)`;
  if (sub === 'init') { const ja = r.iniciado; r.iniciado = true; return ja ? 'Reinitialized existing Git repository in /home/aluno/projeto/.git/' : 'Initialized empty Git repository in /home/aluno/projeto/.git/'; }
  if (!r.iniciado) return 'fatal: not a git repository (or any of the parent directories): .git';
  if (sub === 'status') {
    const s = status(r);
    const o = [`On branch ${r.head}`];
    if (r.conflito) o.push('You have unmerged paths.\n  (fix conflicts and run "git commit")');
    if (!atual(r)) o.push('\nNo commits yet');
    if (s.preparados.length) o.push('\nChanges to be committed:', ...s.preparados.map((k) => `\t${k in r.indice ? (k in arvore(r, atual(r)) ? 'modified' : 'new file') : 'deleted'}:   ${k}`));
    if (s.modificados.length) o.push('\nChanges not staged for commit:', ...s.modificados.map((k) => `\t${k in r.arquivos ? 'modified' : 'deleted'}:   ${k}`));
    if (s.naoRastreados.length) o.push('\nUntracked files:', ...s.naoRastreados.map((k) => `\t${k}`));
    if (!s.preparados.length && !s.modificados.length && !s.naoRastreados.length) o.push('nothing to commit, working tree clean');
    return o.join('\n');
  }
  if (sub === 'add') {
    const alvos = resto[0] === '.' || resto[0] === '-A' ? [...new Set([...Object.keys(r.arquivos), ...Object.keys(r.indice)])] : resto;
    for (const f of alvos) {
      if (f in r.arquivos) r.indice[f] = r.arquivos[f];
      else if (f in r.indice) delete r.indice[f];
      else return `fatal: pathspec '${f}' did not match any files`;
    }
    return '';
  }
  if (sub === 'commit') {
    const i = resto.indexOf('-m');
    if (resto.includes('-a') || resto.includes('-am')) for (const k of Object.keys(r.indice)) if (k in r.arquivos) r.indice[k] = r.arquivos[k];
    const msg = resto[i + 1] ?? resto[resto.indexOf('-am') + 1];
    if (!msg) return 'error: use git commit -m "mensagem"';
    if (r.conflito) { const id = commitar(r, msg, [atual(r), r.conflito.de]); r.conflito = null; return `[${r.head} ${id}] ${msg}`; }
    if (!status(r).preparados.length) return `On branch ${r.head}\nnothing to commit, working tree clean`;
    const id = commitar(r, msg, atual(r) ? [atual(r)] : []);
    return `[${r.head}${Object.keys(r.commits).length === 1 ? ' (root-commit)' : ''} ${id}] ${msg}`;
  }
  if (sub === 'log') {
    const o = [];
    let x = atual(r);
    const vis = new Set();
    const fila = [x];
    const lista = [];
    while (fila.length) { x = fila.shift(); if (!x || vis.has(x)) continue; vis.add(x); lista.push(r.commits[x]); fila.push(...r.commits[x].pais); }
    lista.sort((p, q) => q.n - p.n);
    if (!lista.length) return `fatal: your current branch '${r.head}' does not have any commits yet`;
    for (const c of lista) {
      const refs = Object.entries(r.branches).filter(([, v]) => v === c.id).map(([b]) => (b === r.head ? `HEAD -> ${b}` : b));
      o.push(resto.includes('--oneline') ? `${c.id}${refs.length ? ` (${refs.join(', ')})` : ''} ${c.msg}` : `commit ${c.id}${refs.length ? ` (${refs.join(', ')})` : ''}${c.pais.length > 1 ? `\nMerge: ${c.pais.join(' ')}` : ''}\n\n    ${c.msg}\n`);
    }
    return o.join('\n');
  }
  if (sub === 'branch') {
    if (!resto.length) return Object.keys(r.branches).sort().map((b) => `${b === r.head ? '* ' : '  '}${b}`).join('\n') || `* ${r.head}`;
    if (resto[0] === '-d' || resto[0] === '-D') { if (resto[1] === r.head) return `error: Cannot delete branch '${resto[1]}' checked out`; delete r.branches[resto[1]]; return `Deleted branch ${resto[1]}.`; }
    if (!atual(r)) return `fatal: Not a valid object name: '${r.head}'.`;
    if (r.branches[resto[0]]) return `fatal: a branch named '${resto[0]}' already exists`;
    r.branches[resto[0]] = atual(r);
    return '';
  }
  if (sub === 'checkout' || sub === 'switch') {
    const criar = resto[0] === '-b' || resto[0] === '-c';
    const alvo = criar ? resto[1] : resto[0];
    if (criar) { if (r.branches[alvo]) return `fatal: a branch named '${alvo}' already exists`; r.branches[alvo] = atual(r); r.head = alvo; return `Switched to a new branch '${alvo}'`; }
    if (!(alvo in r.branches)) return `error: pathspec '${alvo}' did not match any file(s) known to git`;
    const s = status(r);
    if (s.modificados.length || s.preparados.length) return `error: Your local changes to the following files would be overwritten by checkout:\n\t${[...s.modificados, ...s.preparados].join('\n\t')}\nPlease commit your changes or stash them before you switch branches.`;
    r.head = alvo;
    const t = arvore(r, atual(r));
    for (const k of Object.keys(r.indice)) delete r.arquivos[k];
    r.indice = { ...t };
    Object.assign(r.arquivos, t);
    return `Switched to branch '${alvo}'`;
  }
  if (sub === 'merge') {
    const outro = r.branches[resto[0]];
    if (!outro) return `merge: ${resto[0]} - not something we can merge`;
    const meu = atual(r);
    if (ancestrais(r, meu).has(outro)) return 'Already up to date.';
    if (ancestrais(r, outro).has(meu)) {
      r.branches[r.head] = outro;
      const t = arvore(r, outro);
      r.indice = { ...t };
      Object.assign(r.arquivos, t);
      return `Updating ${meu}..${outro}\nFast-forward`;
    }
    const b = arvore(r, base(r, meu, outro));
    const m = arvore(r, meu);
    const o = arvore(r, outro);
    const res = {};
    const conflitos = [];
    for (const k of new Set([...Object.keys(b), ...Object.keys(m), ...Object.keys(o)])) {
      if (m[k] === o[k] || o[k] === b[k]) { if (m[k] != null) res[k] = m[k]; } else if (m[k] === b[k]) { if (o[k] != null) res[k] = o[k]; } else { conflitos.push(k); res[k] = `<<<<<<< HEAD\n${m[k] ?? ''}\n=======\n${o[k] ?? ''}\n>>>>>>> ${resto[0]}`; }
    }
    Object.assign(r.arquivos, res);
    if (conflitos.length) { r.indice = { ...m }; r.conflito = { de: outro, arquivos: conflitos }; return `${conflitos.map((k) => `CONFLICT (content): Merge conflict in ${k}`).join('\n')}\nAutomatic merge failed; fix conflicts and then commit the result.`; }
    r.indice = res;
    commitar(r, `Merge branch '${resto[0]}'`, [meu, outro]);
    return "Merge made by the 'ort' strategy.";
  }
  if (sub === 'reset' && resto[0] === '--hard') {
    const alvo = resto[1]?.startsWith('HEAD~') ? (() => { let x = atual(r); for (let k = 0; k < Number(resto[1].slice(5) || 1); k++) x = r.commits[x]?.pais[0]; return x; })() : resto[1] ?? atual(r);
    if (!r.commits[alvo]) return `fatal: ambiguous argument '${resto[1]}'`;
    r.branches[r.head] = alvo;
    for (const k of Object.keys(r.indice)) delete r.arquivos[k];
    r.indice = { ...arvore(r, alvo) };
    Object.assign(r.arquivos, r.indice);
    r.conflito = null;
    return `HEAD is now at ${alvo} ${r.commits[alvo].msg}`;
  }
  if (sub === 'restore') { const f = resto.at(-1); if (resto.includes('--staged')) { const t = arvore(r, atual(r)); if (f in t) r.indice[f] = t[f]; else delete r.indice[f]; } else if (f in r.indice) r.arquivos[f] = r.indice[f]; return ''; }
  if (sub === 'diff') { const s = status(r); return s.modificados.map((k) => `diff --git a/${k} b/${k}\n- ${r.indice[k] ?? ''}\n+ ${r.arquivos[k] ?? ''}`).join('\n') || ''; }
  return `git: '${sub}' is not a git command. See 'git --help'.`;
}

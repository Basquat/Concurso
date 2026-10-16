// Laboratório Git: terminal com git real-semântico + grafo de commits.
import { esc, ic } from '../dom.js';
import { novoRepo, executar, status } from '../../../domain/git.js';
import { terminal } from '../componentes/terminal.js';

function grafo(r) {
  const cs = Object.values(r.commits).sort((a, b) => a.n - b.n);
  if (!cs.length) return '<p class="muted pequeno">Sem commits ainda.</p>';
  const raia = {};
  let prox = 0;
  for (const c of cs) {
    const b = Object.entries(r.branches).find(([, v]) => v === c.id)?.[0];
    const filho = cs.find((x) => x.pais[0] === c.id);
    raia[c.id] ??= c.pais[0] && !cs.some((x) => x.n < c.n && x.pais[0] === c.pais[0] && x.id !== c.id) ? raia[c.pais[0]] : prox++;
    void b; void filho;
  }
  const X = (c) => 30 + raia[c.id] * 34;
  const Y = (c) => 24 + (cs.length - 1 - cs.indexOf(c)) * 40;
  const linhas = cs.flatMap((c) => c.pais.map((p) => `<line x1="${X(c)}" y1="${Y(c)}" x2="${X(r.commits[p])}" y2="${Y(r.commits[p])}" stroke="var(--texto-3)" stroke-width="2"/>`)).join('');
  const nos = cs.map((c) => {
    const refs = Object.entries(r.branches).filter(([, v]) => v === c.id).map(([b]) => (b === r.head ? `HEAD→${b}` : b));
    return `<circle cx="${X(c)}" cy="${Y(c)}" r="8" fill="${c.pais.length > 1 ? 'var(--acento)' : 'var(--prim)'}"/><text x="${30 + (prox) * 34}" y="${Y(c) + 4}" font-size="12" fill="var(--texto)"><tspan font-family="monospace" fill="var(--texto-3)">${c.id}</tspan> ${esc(c.msg)}${refs.length ? ` <tspan fill="var(--ok)" font-weight="700">(${esc(refs.join(', '))})</tspan>` : ''}</text>`;
  }).join('');
  return `<svg viewBox="0 0 640 ${cs.length * 40 + 20}" style="width:100%">${linhas}${nos}</svg>`;
}

export default async function git(el, ctx, kit) {
  let r = kit.estado.carregar() ?? novoRepo();
  const missoes = kit.missoes([
    { id: 'init', titulo: 'Crie o repositório', descricao: 'Execute `git init`.', xp: 10, checar: (x) => x.iniciado },
    { id: 'commit', titulo: 'Primeiro commit', descricao: '`echo "Olá" > README.md`, `git add README.md`, `git commit -m "Primeiro commit"`.', xp: 20, checar: (x) => Object.keys(x.commits).length >= 1 },
    { id: 'branch', titulo: 'Trabalhe numa branch', descricao: 'Crie e entre em `feature/login` (`git switch -c feature/login`) e faça um commit nela.', xp: 30, checar: (x) => x.branches['feature/login'] && x.branches['feature/login'] !== x.branches.main },
    { id: 'merge', titulo: 'Integre a feature', descricao: 'Volte à main e faça `git merge feature/login`.', xp: 30, checar: (x) => x.branches.main && x.branches['feature/login'] && x.branches.main !== null && (x.branches.main === x.branches['feature/login'] || x.commits[x.branches.main]?.pais.includes(x.branches['feature/login'])) },
    { id: 'conflito', titulo: 'Resolva um conflito', descricao: 'Altere o mesmo arquivo em duas branches, faça merge, edite o arquivo (remova os marcadores) e conclua com add + commit.', xp: 50, checar: (x) => Object.values(x.commits).some((c) => c.pais.length > 1) && !x.conflito && Object.values(x.commits).some((c) => c.pais.length > 1 && Object.values(c.arvore).every((v) => !v.includes('<<<<<<<'))) },
    { id: 'limpo', titulo: 'Árvore limpa', descricao: 'Deixe `git status` sem pendências após 3+ commits.', xp: 20, checar: (x) => Object.keys(x.commits).length >= 3 && Object.values(status(x)).every((l) => !l.length) },
  ]);
  kit.referencia('<dl><dt>git init</dt><dd>cria o repositório</dd><dt>git status</dt><dd>situação do diretório e do stage</dd><dt>git add .</dt><dd>prepara tudo</dd><dt>git commit -m</dt><dd>grava um snapshot</dd><dt>git log --oneline</dt><dd>histórico resumido</dd><dt>git switch -c x</dt><dd>cria e troca de branch</dd><dt>git merge x</dt><dd>integra x na branch atual</dd><dt>git reset --hard HEAD~1</dt><dd>descarta o último commit</dd><dt>git restore f</dt><dd>desfaz mudança não preparada</dd><dt>echo t > f</dt><dd>escreve no arquivo</dd></dl>');
  kit.teoria('**Três áreas:** diretório de trabalho → *index/stage* (`add`) → repositório (`commit`).\n\n**Merge fast-forward:** a branch atual só avança o ponteiro; **3-way merge** cria um commit com dois pais.\n\n> [!prova] Cai em prova\n> `git fetch` só baixa; `git pull` = fetch + merge. `revert` cria commit que desfaz; `reset` move o ponteiro.');
  el.innerHTML = '<div class="dividido"><div id="t"></div><div class="card"><h3 class="mt0">Grafo de commits</h3><div id="g"></div><h3>Arquivos</h3><div id="arqs" class="mono pequeno"></div></div></div>';
  const pintar = () => {
    el.querySelector('#g').innerHTML = grafo(r);
    el.querySelector('#arqs').innerHTML = Object.entries(r.arquivos).map(([k, v]) => `<details><summary>${ic('arquivo')} ${esc(k)}</summary><pre class="saida">${esc(v)}</pre></details>`).join('') || '<span class="muted">vazio</span>';
  };
  terminal(el.querySelector('#t'), {
    prompt: () => `aluno@lab:~/projeto${r.iniciado ? ` (${r.head})` : ''}$ `,
    boasVindas: 'Terminal com Git. Comece com: git init',
    aoComando: (c) => { const s = executar(r, c); kit.estado.salvar(r); missoes.verificar(r); pintar(); return s; },
  });
  kit.aoReiniciar(() => { r = novoRepo(); kit.estado.salvar(r); location.reload(); });
  pintar();
}

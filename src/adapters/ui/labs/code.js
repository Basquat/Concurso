// Code Studio: editor Monaco + projetos com vários arquivos + executores reais + cliente HTTP + pré-visualização.
import { esc, ic, toast, modal, confirmar, pedir, baixarArquivo } from '../dom.js';
import { criarEditor } from '../editor.js';
import { MODELOS, GRUPOS, modelo as acharModelo } from '../../../domain/code/modelos.js';
import { EXERCICIOS, exercicio } from '../../../domain/code/exercicios.js';
import { executorJs, executorPython, executorPhpProjeto, executorJava, executorSql } from '../../runtimes/index.js';
import { preVisualizar } from '../../runtimes/web.js';
import { zip } from '../../../domain/zip.js';
import { markdown } from '../../../domain/markdown.js';

const LANG = { js: 'JavaScript', python: 'Python', php: 'PHP', java: 'Java', web: 'Web', sqlite: 'SQLite', postgres: 'PostgreSQL' };
const NIVEL = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado' };
const ICONE_ARQ = (k) => (/\.(html|css)$/.test(k) ? 'globo' : /\.(sql)$/.test(k) ? 'banco' : /\.(json|txt|csv|http|md)$/.test(k) ? 'arquivoTexto' : 'codigo');
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();

const REFERENCIA = `<h4>Atalhos</h4><dl><dt>Ctrl+Enter</dt><dd>Executar / verificar</dd><dt>Ctrl+S</dt><dd>Salvar (salva sozinho também)</dd><dt>Ctrl+Space</dt><dd>Sugestões (IntelliSense)</dd><dt>F1</dt><dd>Paleta de comandos do editor</dd><dt>Alt+Shift+F</dt><dd>Formatar documento</dd><dt>Ctrl+D</dt><dd>Selecionar próxima ocorrência</dd><dt>Alt+↑/↓</dt><dd>Mover linha</dd></dl>
<h4>O que roda de verdade</h4><dl><dt>JS / TS</dt><dd>Web Worker + Babel</dd><dt>Python</dt><dd>CPython 3.12 (Pyodide) + PyPI</dd><dt>PHP</dt><dd>PHP 8.4 (php-wasm)</dd><dt>Java</dt><dd>javac + JVM (CheerpJ, Java 8)</dd><dt>SQL</dt><dd>SQLite e PostgreSQL 17</dd><dt>Web</dt><dd>HTML/CSS/JS, React, Vue no iframe</dd></dl>
<h4>Python</h4><dl><dt>requirements.txt</dt><dd>pacotes do PyPI (puros) instalados com micropip</dd><dt>test_*.py</dt><dd>funções test_ executadas como no pytest</dd><dt>plt.show()</dt><dd>mostra o gráfico na Saída</dd></dl>
<h4>Node</h4><dl><dt>require('express')</dt><dd>API compatível (rotas, middleware, json)</dd><dt>*.test.js</dt><dd>describe / it / expect (estilo Jest)</dd></dl>`;

const TEORIA = `**Por que praticar programação para concurso?** As bancas cobram leitura de código: saída de um trecho, erro de compilação, complexidade, orientação a objetos, SQL e APIs REST.

> [!prova] Pegadinhas frequentes
> - Java: \`==\` compara referências; use \`equals()\` para \`String\`.
> - JavaScript: \`==\` converte tipos (\`'1' == 1\` é true); \`===\` não.
> - Python: argumento padrão mutável (\`def f(x=[])\`) é compartilhado entre chamadas.
> - SQL: \`WHERE\` filtra linhas antes do \`GROUP BY\`; \`HAVING\` filtra grupos depois.

**Métodos HTTP**: GET (ler, seguro e idempotente), POST (criar), PUT (substituir, idempotente), PATCH (alterar parte), DELETE (remover, idempotente).
**Códigos**: 200 OK · 201 Created · 204 No Content · 400 Bad Request · 401 Unauthorized · 403 Forbidden · 404 Not Found · 409 Conflict · 422 Unprocessable Entity · 500 Internal Server Error.`;

function novoProjeto(m, nome) {
  return { nome: nome ?? m.nome, modelo: m.id, arquivos: { ...m.arquivos }, abertos: [m.entrada], ativo: m.entrada, criado: Date.now() };
}

export default async function code(el, ctx, kit) {
  let st = kit.estado.carregar() ?? {};
  st.projetos ??= {};
  st.passou ??= {};
  if (!Object.keys(st.projetos).length) { st.projetos.p1 = novoProjeto(acharModelo('node'), 'Meu primeiro projeto'); st.atual = 'p1'; }
  if (!st.projetos[st.atual]) st.atual = Object.keys(st.projetos)[0];
  const salvar = () => kit.estado.salvar(st);

  const missoes = kit.missoes(EXERCICIOS.map((e) => ({ id: e.id, titulo: `${LANG[acharModelo(e.modelo).runtime] ?? ''} · ${e.titulo}`, descricao: e.enunciado, xp: e.xp, nivel: e.nivel, checar: (s) => !!s.passou?.[e.id] })), { titulo: 'Exercícios' });
  kit.referencia(REFERENCIA);
  kit.teoria(TEORIA);
  kit.sobre('<p class="mini sutil">Java via <a href="https://cheerpj.com" target="_blank" rel="noopener noreferrer">CheerpJ</a> (Leaning Technologies, licença Community). Python via <a href="https://pyodide.org" target="_blank" rel="noopener noreferrer">Pyodide</a>. PostgreSQL via <a href="https://pglite.dev" target="_blank" rel="noopener noreferrer">PGlite</a>. Editor <a href="https://microsoft.github.io/monaco-editor/" target="_blank" rel="noopener noreferrer">Monaco</a> (MIT).</p>');

  el.classList.add('cola');
  if (ctx.sessao.ler('config')?.['guia:code'] !== true) kit.semGuia();
  el.innerHTML = `<div class="studio">
    <div class="studio-barra">
      <select id="selProjeto" aria-label="Projeto"></select>
      <button class="btn peq" type="button" data-novo>${ic('mais')} Novo projeto</button>
      <button class="btn peq" type="button" data-exercicios>${ic('alvo')} Exercícios</button>
      <span class="sep" style="width:1px;height:22px;background:var(--borda)"></span>
      <button class="btn primario peq" type="button" data-rodar title="Ctrl+Enter">${ic('play')} Executar</button>
      <button class="btn peq" type="button" data-parar hidden>${ic('pausa')} Parar</button>
      <button class="btn fantasma peq" type="button" data-formatar title="Formatar (Alt+Shift+F)">${ic('brilho')} Formatar</button>
      <span class="espaco"></span>
      <button class="btn fantasma peq" type="button" data-zip title="Baixar projeto (.zip)">${ic('baixar')} .zip</button>
      <button class="btn fantasma peq" type="button" data-renomear title="Renomear projeto">${ic('redacao')}</button>
      <button class="btn fantasma peq" type="button" data-excluir title="Excluir projeto">${ic('lixeira')}</button>
    </div>
    <aside class="studio-explorer"><div class="cab"><span>Explorador</span><span><button class="btn fantasma icone peq" type="button" data-novo-arq title="Novo arquivo">${ic('mais')}</button></span></div><div id="arvore"></div>
      <div class="cab" style="margin-top:auto"><span>Modelo</span></div><div class="mini sutil" id="infoModelo" style="padding:0 10px 10px"></div></aside>
    <div class="studio-centro">
      <div id="enunciado"></div>
      <div class="studio-abas" id="abas"></div>
      <div class="studio-meio" id="meio"><div class="studio-editor"><div id="editor"><div class="carregando" style="padding:20px"><span class="gira"></span> Carregando o editor do VS Code…</div></div></div></div>
    </div>
    <section class="studio-painel" aria-label="Painel">
      <div class="abas" role="tablist">${[['saida', 'terminal', 'Saída'], ['testes', 'okCirculo', 'Testes'], ['http', 'globo', 'Cliente HTTP']].map(([k, i, n], j) => `<button type="button" data-painel="${k}" aria-selected="${j === 0}">${ic(i)} ${n}</button>`).join('')}</div>
      <div class="conteudo-painel" id="painel"></div>
    </section>
    <div class="studio-status"><span id="stLang"></span><span id="stMsg"></span><span class="espaco"></span><span id="stSalvo">salvo</span></div>
  </div>`;

  const $ = (s) => el.querySelector(s);
  const projeto = () => st.projetos[st.atual];
  const mod = () => acharModelo(projeto().modelo) ?? MODELOS[0];
  const ex = () => (projeto().ex ? exercicio(projeto().ex) : null);
  let painel = 'saida';
  let saida = [];
  let testes = null;
  let tabelas = null;
  let ultimoResultado = null;
  let preview = null;
  let rodando = false;
  const executores = {};
  const executor = (rt) => (executores[rt] ??= { js: executorJs, python: executorPython, php: executorPhpProjeto, java: executorJava, sqlite: () => executorSql('sqlite'), postgres: () => executorSql('postgres') }[rt]?.());
  const http = { metodo: 'GET', url: '/', corpo: '', historico: [] };

  const editor = await criarEditor($('#editor'), {
    aoMudar: (caminho, valor) => { if (projeto().arquivos[caminho] !== valor) { projeto().arquivos[caminho] = valor; $('#stSalvo').textContent = 'salvando…'; agendarSalvar(); } },
    aoExecutar: () => rodar(),
    aoSalvar: () => { salvar(); $('#stSalvo').textContent = 'salvo'; },
  });
  if (editor.tipo === 'simples') toast('Sem acesso ao editor do VS Code (offline?). Usando o editor simples.', { ms: 6000 });
  let tSalvar;
  const agendarSalvar = () => { clearTimeout(tSalvar); tSalvar = setTimeout(() => { salvar(); $('#stSalvo').textContent = 'salvo'; }, 600); };

  function desenharProjetos() {
    $('#selProjeto').innerHTML = Object.entries(st.projetos).sort((a, b) => (b[1].criado ?? 0) - (a[1].criado ?? 0)).map(([id, p]) => `<option value="${esc(id)}" ${id === st.atual ? 'selected' : ''}>${esc(p.nome)}</option>`).join('');
  }
  function desenharArvore() {
    const p = projeto();
    const ocultos = new Set(Object.keys(ex()?.verificar.testes ?? {}));
    $('#arvore').innerHTML = Object.keys(p.arquivos).filter((k) => !ocultos.has(k)).sort().map((k) => `<button class="arq ${k === p.ativo ? 'ativo' : ''}" type="button" data-arq="${esc(k)}">${ic(ICONE_ARQ(k))}<span>${esc(k)}</span><span class="acoes-arq"><span data-ren="${esc(k)}" title="Renomear">✎</span><span data-del="${esc(k)}" title="Excluir">✕</span></span></button>`).join('');
    const m = mod();
    $('#infoModelo').innerHTML = `<strong>${esc(m.nome)}</strong><br>${m.real ? '<span class="ok">● execução real</span>' : '<span style="color:var(--aviso)">● ambiente compatível</span>'}<br>${esc(m.descricao)}`;
  }
  function desenharAbas() {
    const p = projeto();
    p.abertos = p.abertos.filter((k) => k in p.arquivos);
    if (!p.abertos.includes(p.ativo) && p.ativo in p.arquivos) p.abertos.push(p.ativo);
    $('#abas').innerHTML = p.abertos.map((k) => `<button type="button" data-aba="${esc(k)}" class="${k === p.ativo ? 'ativa' : ''}">${ic(ICONE_ARQ(k))} ${esc(k)} <span class="fechar" data-fechar="${esc(k)}" title="Fechar">✕</span></button>`).join('');
  }
  function desenharEnunciado() {
    const e = ex();
    $('#enunciado').innerHTML = e ? `<div class="enunciado-ex"><div class="linha entre"><strong>${ic('alvo')} Exercício: ${esc(e.titulo)}</strong><span class="linha">${st.passou[e.id] ? `<span class="tag ok">${ic('ok')} concluído</span>` : `<span class="tag">${NIVEL[e.nivel]} · +${e.xp} XP</span>`}<button class="btn primario peq" type="button" data-verificar>${ic('play')} Verificar</button></span></div><div class="md">${markdown(e.enunciado)}</div></div>` : '';
    $('[data-verificar]')?.addEventListener('click', () => rodar());
  }
  function abrirArquivo(k) {
    const p = projeto();
    if (!(k in p.arquivos)) return;
    p.ativo = k;
    if (!p.abertos.includes(k)) p.abertos.push(k);
    editor.abrir(k, p.arquivos[k]);
    $('#stLang').textContent = `${LANG[mod().runtime] ?? ''} · ${k}`;
    desenharArvore();
    desenharAbas();
    salvar();
  }
  function trocarProjeto(id) {
    executores[mod().runtime]?.parar?.();
    st.atual = id;
    salvar();
    editor.fecharTodos();
    editor.sincronizar(projeto().arquivos);
    saida = [];
    testes = null;
    tabelas = null;
    desenharProjetos();
    desenharEnunciado();
    abrirArquivo(projeto().ativo in projeto().arquivos ? projeto().ativo : Object.keys(projeto().arquivos)[0]);
    configurarPreview();
    mostrarPainel(mod().http ? 'http' : 'saida');
    if (mod().runtime === 'web') rodar();
  }

  // ---------- Painel inferior ----------
  function mostrarPainel(k) {
    painel = k;
    el.querySelectorAll('[data-painel]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.painel === k)));
    const box = $('#painel');
    if (k === 'saida') {
      box.innerHTML = tabelas ? `<div class="resultado-sql">${tabelas.length ? tabelas.map((t) => `<div class="rolagem"><table class="tabela compacta"><thead><tr>${t.colunas.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.linhas.slice(0, 500).map((l) => `<tr>${l.map((v) => `<td>${v === null ? '<span class="sutil">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="mini sutil">${t.linhas.length} linha(s)</p>`).join('') : '<p class="muted">Comandos executados, sem linhas para mostrar.</p>'}${saida.length ? `<div class="saida console">${saida.map(fmtSaida).join('')}</div>` : ''}</div>`
        : `<div class="saida console" id="console">${saida.length ? saida.map(fmtSaida).join('') : '<span class="sutil">Clique em Executar (Ctrl+Enter). A saída aparece aqui.</span>'}</div>`;
      box.scrollTop = box.scrollHeight;
    } else if (k === 'testes') {
      box.innerHTML = testes == null ? '<p class="muted" style="padding:10px">Execute para rodar os testes (arquivos *.test.js, test_*.py ou os testes do exercício).</p>'
        : testes.length ? `<ul class="missoes" style="padding:10px">${testes.map((t) => `<li class="missao ${t.ok ? 'feita' : ''}"><div class="titulo"><span>${ic(t.ok ? 'okCirculo' : 'xCirculo')} ${esc(t.nome)}</span></div>${t.erro ? `<div class="desc erro mono">${esc(t.erro)}</div>` : ''}</li>`).join('')}</ul><p class="pequeno" style="padding:0 10px">${testes.filter((t) => t.ok).length} de ${testes.length} passaram.</p>` : '<p class="muted" style="padding:10px">Nenhum teste encontrado.</p>';
    } else {
      box.innerHTML = `<div class="http-cliente"><div><form class="pilha p" id="formHttp"><div class="linha nw"><select name="metodo" style="width:110px">${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => `<option ${m === http.metodo ? 'selected' : ''}>${m}</option>`).join('')}</select><input name="url" value="${esc(http.url)}" class="mono" placeholder="/api/recurso?x=1"><button class="btn primario" type="submit">Enviar</button></div>
        <textarea name="corpo" placeholder='Corpo JSON (POST/PUT/PATCH), ex.: {"nome": "Ana"}'>${esc(http.corpo)}</textarea>
        ${atalhosHttp()}</form></div><div id="respHttp">${http.ultima ? respostaHtml(http.ultima) : `<p class="muted pequeno">${mod().http ? 'Execute o servidor e envie uma requisição.' : 'Este modelo não é um servidor HTTP. Use os modelos Express, Flask ou FastAPI.'}</p>`}</div></div>`;
      const f = box.querySelector('#formHttp');
      f.addEventListener('submit', (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); Object.assign(http, d); enviarHttp(); });
      box.querySelectorAll('[data-req]').forEach((b) => b.addEventListener('click', () => { const [m, u, ...c] = b.dataset.req.split(' '); Object.assign(http, { metodo: m, url: u, corpo: c.join(' ') }); mostrarPainel('http'); enviarHttp(); }));
    }
  }
  const fmtSaida = (s) => (s.tipo === 'imagem' ? `<img alt="Gráfico gerado" src="data:image/png;base64,${s.png}" style="max-width:100%;background:#fff;border-radius:6px;margin:6px 0">` : `<span class="${s.nivel ?? ''}">${esc(s.texto)}</span>`);
  function atalhosHttp() {
    const reqs = (projeto().arquivos['requisicoes.http'] ?? '').split('\n').filter((l) => /^(GET|POST|PUT|PATCH|DELETE)\s/.test(l));
    return reqs.length ? `<div class="linha" style="gap:4px">${reqs.map((r) => `<button class="btn peq mono" type="button" data-req="${esc(r.replace(/\s+/, ' '))}">${esc(r.length > 38 ? `${r.slice(0, 36)}…` : r)}</button>`).join('')}</div>` : '';
  }
  function respostaHtml(r) {
    if (r.erro) return `<div class="aviso erro pequeno">${esc(r.erro)}</div>`;
    let corpo = r.corpo ?? '';
    try { corpo = JSON.stringify(JSON.parse(corpo), null, 2); } catch { /* texto */ }
    return `<div class="linha mb1"><span class="tag ${r.status < 300 ? 'ok' : r.status < 400 ? 'info' : 'erro'}">${r.status}</span><span class="mini sutil">${r.ms ?? 0} ms · ${esc(r.cabecalhos?.['content-type'] ?? '')}</span></div><pre class="saida" style="max-height:none">${esc(corpo) || '<span class="sutil">(sem corpo)</span>'}</pre>`;
  }
  async function enviarHttp() {
    const ex = executores[mod().runtime];
    $('#respHttp').innerHTML = '<span class="gira"></span>';
    const corpo = http.corpo?.trim() ?? '';
    const r = ex?.requisicao ? await ex.requisicao({ metodo: http.metodo, url: http.url.startsWith('/') ? http.url : `/${http.url}`, corpo, cabecalhos: corpo ? { 'Content-Type': 'application/json' } : {} }) : { erro: 'Execute o projeto primeiro.' };
    http.ultima = r;
    const alvo = $('#respHttp');
    if (alvo) alvo.innerHTML = respostaHtml(r);
    saida.push({ texto: `→ ${http.metodo} ${http.url} ${r.status ?? 'erro'}\n`, nivel: 'info' });
  }

  // ---------- Pré-visualização (web) ----------
  function configurarPreview() {
    const web = mod().runtime === 'web';
    $('#meio').classList.toggle('com-preview', web);
    preview?.parar();
    preview = null;
    $('#meio .studio-preview')?.remove();
    if (web) $('#meio').insertAdjacentHTML('beforeend', `<div class="studio-preview"><div class="barra-url">${ic('globo')} <span class="mono">http://localhost/${esc(mod().entrada)}</span><span class="espaco"></span><button class="btn fantasma peq" type="button" data-recarregar>${ic('recarregar')}</button></div><div class="caixa" id="caixaPreview"></div></div>`);
    $('[data-recarregar]')?.addEventListener('click', () => rodar());
    editor.layout();
  }

  // ---------- Execução e verificação ----------
  async function rodar() {
    if (rodando) return;
    const p = projeto();
    const m = mod();
    const e = ex();
    salvar();
    saida = [];
    testes = null;
    tabelas = null;
    const aoEvento = (ev) => {
      if (ev.tipo === 'status') { $('#stMsg').textContent = ev.texto; if (ev.texto) { saida.push({ texto: `${ev.texto}\n`, nivel: 'sutil' }); } }
      if (ev.tipo === 'saida' || ev.tipo === 'imagem') saida.push(ev);
      if (ev.tipo === 'limpar') saida = [];
      if (painel === 'saida') mostrarPainel('saida');
    };
    if (m.runtime === 'web') {
      preview = preVisualizar($('#caixaPreview'), p.arquivos, { entrada: m.entrada, aoConsole: (c) => { saida.push({ texto: `${c.texto}\n`, nivel: c.nivel === 'log' ? '' : c.nivel }); if (painel === 'saida') mostrarPainel('saida'); } });
      if (e) verificar(e, { testes: [] });
      return;
    }
    rodando = true;
    $('[data-rodar]').disabled = true;
    $('[data-parar]').hidden = false;
    $('#stMsg').textContent = 'Executando…';
    mostrarPainel(painel === 'http' && m.http ? 'http' : 'saida');
    const ocultos = e?.verificar.tipo === 'testes' ? e.verificar.testes : {};
    const arquivos = { ...p.arquivos, ...ocultos };
    const arquivosTeste = Object.keys(arquivos).filter((k) => /(\.test\.[jt]sx?|\.spec\.[jt]sx?)$/.test(k) || /(^|\/)test_.*\.py$/.test(k));
    const t0 = performance.now();
    let r;
    try {
      r = await executor(m.runtime).executar({ arquivos, entrada: e?.entrada ?? m.entrada, principal: m.principal ?? 'Main', arquivosTeste, expressoes: e?.verificar.tipo === 'expressoes' ? e.verificar.expressoes : [] }, aoEvento);
    } catch (err) { r = { erro: err.message, testes: [] }; }
    rodando = false;
    $('[data-rodar]').disabled = false;
    $('[data-parar]').hidden = true;
    ultimoResultado = r;
    if (r.erro) saida.push({ texto: `\n${r.erro}\n${r.pilha ? `${r.pilha}\n` : ''}`, nivel: 'erro' });
    if (r.tabelas) tabelas = r.tabelas;
    testes = r.testes?.length ? r.testes : (arquivosTeste.length ? [] : null);
    $('#stMsg').textContent = `${r.erro ? '✖ erro' : '✔ concluído'} em ${((performance.now() - t0) / 1000).toFixed(1)} s${r.servidor ? ' · servidor ativo (use o Cliente HTTP)' : ''}`;
    if (e) verificar(e, r);
    mostrarPainel(testes?.length && !r.servidor ? 'testes' : r.servidor && m.http && !e ? 'http' : 'saida');
  }

  function verificar(e, r) {
    const v = e.verificar;
    let ok = false;
    let motivo = '';
    if (v.tipo === 'expressoes' || v.tipo === 'testes') { ok = !r.erro && r.testes?.length > 0 && r.testes.every((t) => t.ok); motivo = r.erro ? 'o código gerou erro' : `${r.testes?.filter((t) => !t.ok).length ?? 0} teste(s) falharam`; }
    else if (v.tipo === 'saida') { const s = norm(saida.filter((x) => x.tipo !== 'imagem' && x.nivel !== 'sutil' && x.nivel !== 'erro').map((x) => x.texto).join('')); ok = !r.erro && s === norm(v.esperado); motivo = `saída esperada:\n${v.esperado}`; testes = [{ nome: `Saída igual à esperada${ok ? '' : ` — esperado:\n${v.esperado}`}`, ok }]; }
    else if (v.tipo === 'regras') { const cod = projeto().arquivos[v.arquivo] ?? ''; testes = v.regras.map(([re, nome]) => ({ nome, ok: new RegExp(re, 'i').test(cod) })); ok = testes.every((t) => t.ok); motivo = 'algum critério não foi atendido'; }
    else if (v.tipo === 'tabela') {
      const t = r.tabelas?.at(-1);
      const cols = t?.colunas.map((c) => c.toLowerCase());
      ok = !!t && JSON.stringify(cols) === JSON.stringify(v.esperado.colunas) && JSON.stringify(t.linhas.map((l) => l.map((x) => (typeof x === 'bigint' ? Number(x) : x)))) === JSON.stringify(v.esperado.linhas);
      testes = [{ nome: `Resultado igual ao esperado (${v.esperado.colunas.join(', ')})`, ok }];
      motivo = 'o resultado da última consulta difere do esperado';
    }
    if (ok && !st.passou[e.id]) {
      st.passou[e.id] = true;
      salvar();
      missoes.verificar(st);
      desenharEnunciado();
    } else if (!ok) toast(`Ainda não: ${motivo}.`, { tipo: 'erro', ms: 4500 });
    else toast('Exercício correto!', { tipo: 'ok' });
  }

  // ---------- Ações ----------
  $('#selProjeto').addEventListener('change', (e) => trocarProjeto(e.target.value));
  $('[data-rodar]').onclick = () => rodar();
  $('[data-parar]').onclick = () => { executores[mod().runtime]?.parar?.(); rodando = false; $('[data-rodar]').disabled = false; $('[data-parar]').hidden = true; $('#stMsg').textContent = 'Interrompido.'; saida.push({ texto: '\n■ Execução interrompida.\n', nivel: 'aviso' }); mostrarPainel('saida'); };
  $('[data-formatar]').onclick = () => editor.formatar();
  $('[data-zip]').onclick = () => baixarArquivo(`${projeto().nome.replace(/[^\w.-]+/g, '-').toLowerCase()}.zip`, new Blob([zip(projeto().arquivos)], { type: 'application/zip' }));
  $('[data-renomear]').onclick = async () => { const n = await pedir({ titulo: 'Renomear projeto', rotulo: 'Nome', valor: projeto().nome }); if (n?.trim()) { projeto().nome = n.trim().slice(0, 60); salvar(); desenharProjetos(); } };
  $('[data-excluir]').onclick = async () => {
    if (Object.keys(st.projetos).length === 1) return toast('Mantenha pelo menos um projeto.');
    if (!(await confirmar(`Excluir o projeto "${projeto().nome}"?`, { perigo: true, sim: 'Excluir' }))) return;
    delete st.projetos[st.atual];
    trocarProjeto(Object.keys(st.projetos)[0]);
  };
  $('[data-novo]').onclick = () => {
    const m = modal({ titulo: 'Novo projeto', larga: true, corpo: GRUPOS.map((g) => `<h3 class="${g === GRUPOS[0] ? 'mt0' : ''}">${esc(g)}</h3><div class="grid peq">${MODELOS.filter((x) => x.grupo === g).map((x) => `<button class="card interativo" type="button" data-modelo="${x.id}" style="text-align:left"><div class="linha entre"><strong>${esc(x.nome)}</strong>${x.real ? '<span class="tag real">real</span>' : '<span class="tag sim">compatível</span>'}</div><p class="mini sutil mb0 mt1">${esc(x.descricao)}</p></button>`).join('')}</div>`).join('') });
    m.el.querySelectorAll('[data-modelo]').forEach((b) => b.addEventListener('click', () => {
      const x = acharModelo(b.dataset.modelo);
      const id = `p${Date.now().toString(36)}`;
      st.projetos[id] = novoProjeto(x);
      m.fechar();
      trocarProjeto(id);
    }));
  };
  $('[data-exercicios]').onclick = () => {
    const grupos = [...new Set(EXERCICIOS.map((e) => LANG[acharModelo(e.modelo).runtime]))];
    const m = modal({ titulo: 'Exercícios corrigidos por execução', larga: true, corpo: grupos.map((g) => `<h3>${esc(g)}</h3><div class="pilha p">${EXERCICIOS.filter((e) => LANG[acharModelo(e.modelo).runtime] === g).map((e) => `<button class="tarefa" type="button" data-ex="${e.id}" style="width:100%;text-align:left"><span class="chip-area">${ic(st.passou[e.id] ? 'okCirculo' : 'alvo')}</span><span style="flex:1;min-width:0"><span class="tt">${esc(e.titulo)}</span><br><span class="ds">${NIVEL[e.nivel]} · +${e.xp} XP</span></span>${st.passou[e.id] ? '<span class="tag ok">feito</span>' : ''}</button>`).join('')}</div>`).join('') });
    m.el.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => { m.fechar(); abrirExercicio(b.dataset.ex); }));
  };
  function abrirExercicio(id) {
    const e = exercicio(id);
    if (!e) return;
    const pid = `ex-${id}`;
    if (!st.projetos[pid]) {
      const m = acharModelo(e.modelo);
      st.projetos[pid] = { nome: `Exercício: ${e.titulo}`, modelo: e.modelo, ex: id, arquivos: { ...(e.arquivos ?? m.arquivos) }, abertos: [], ativo: e.entrada ?? m.entrada, criado: Date.now() };
      if (e.modelo === 'react' && !e.arquivos) st.projetos[pid].ativo = 'App.jsx';
    }
    trocarProjeto(pid);
  }
  $('[data-novo-arq]').onclick = async () => {
    const n = (await pedir({ titulo: 'Novo arquivo', rotulo: 'Caminho (ex.: utils.js, src/app.py, dados.csv)' }))?.trim();
    if (!n) return;
    if (!/^[\w./-]+$/.test(n) || n.includes('..')) return toast('Use letras, números, ponto, hífen, barra e sublinhado.', { tipo: 'erro' });
    if (n in projeto().arquivos) return toast('Já existe um arquivo com esse nome.');
    projeto().arquivos[n] = '';
    editor.sincronizar(projeto().arquivos);
    abrirArquivo(n);
  };
  $('#arvore').addEventListener('click', async (e) => {
    const ren = e.target.closest('[data-ren]')?.dataset.ren;
    const del = e.target.closest('[data-del]')?.dataset.del;
    const arq = e.target.closest('[data-arq]')?.dataset.arq;
    const p = projeto();
    if (ren) {
      e.stopPropagation();
      const n = (await pedir({ titulo: 'Renomear arquivo', rotulo: 'Novo nome', valor: ren }))?.trim();
      if (!n || n === ren || !/^[\w./-]+$/.test(n) || n in p.arquivos) return;
      p.arquivos[n] = p.arquivos[ren];
      delete p.arquivos[ren];
      p.abertos = p.abertos.map((k) => (k === ren ? n : k));
      if (p.ativo === ren) p.ativo = n;
      editor.sincronizar(p.arquivos);
      abrirArquivo(p.ativo);
    } else if (del) {
      e.stopPropagation();
      if (Object.keys(p.arquivos).length === 1) return toast('O projeto precisa de pelo menos um arquivo.');
      if (!(await confirmar(`Excluir ${del}?`, { perigo: true, sim: 'Excluir' }))) return;
      delete p.arquivos[del];
      editor.sincronizar(p.arquivos);
      if (p.ativo === del) p.ativo = Object.keys(p.arquivos)[0];
      abrirArquivo(p.ativo);
    } else if (arq) abrirArquivo(arq);
  });
  $('#abas').addEventListener('click', (e) => {
    const fechar = e.target.closest('[data-fechar]')?.dataset.fechar;
    const p = projeto();
    if (fechar) {
      e.stopPropagation();
      p.abertos = p.abertos.filter((k) => k !== fechar);
      if (p.ativo === fechar) p.ativo = p.abertos.at(-1) ?? Object.keys(p.arquivos)[0];
      abrirArquivo(p.ativo);
      return;
    }
    const k = e.target.closest('[data-aba]')?.dataset.aba;
    if (k) abrirArquivo(k);
  });
  el.querySelectorAll('[data-painel]').forEach((b) => b.addEventListener('click', () => mostrarPainel(b.dataset.painel)));
  kit.aoReiniciar(() => { kit.estado.limpar(); location.reload(); }, 'Apagar TODOS os projetos do Code Studio e começar do zero? Exercícios concluídos e XP continuam.');

  editor.sincronizar(projeto().arquivos);
  desenharProjetos();
  if (kit.params.get('ex')) abrirExercicio(kit.params.get('ex'));
  else if (kit.params.get('modelo') && acharModelo(kit.params.get('modelo'))) { const id = `p${Date.now().toString(36)}`; st.projetos[id] = novoProjeto(acharModelo(kit.params.get('modelo'))); trocarProjeto(id); }
  else trocarProjeto(st.atual);
  void ultimoResultado;

  return () => { Object.values(executores).forEach((x) => x?.parar?.()); preview?.parar(); editor.destruir(); salvar(); };
}

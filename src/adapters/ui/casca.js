// Casca do aplicativo: menu lateral, barra superior, busca (Ctrl+K), menu da conta, navegação inferior (celular),
// tema e bloqueio por inatividade.
import { esc, ic, modal, toast, baixarArquivo, diaIso } from './dom.js';
import { avatar } from './porta.js';
import { nivel, sequencia } from '../../domain/gamification.js';

export const NAV = [
  ['', [['#/', 'inicio', 'Início'], ['#/plano', 'calendario', 'Meu plano']]],
  ['Estudar', [['#/areas', 'grade', 'Todas as áreas'], ['#/aulas', 'slides', 'Aulas'], ['#/questoes', 'questoes', 'Questões'], ['#/revisoes', 'cerebro', 'Revisões', 'revisoes'], ['#/flashcards', 'cartoes', 'Flashcards'], ['#/simulado', 'simulado', 'Simulados'], ['#/lab/redacao', 'redacao', 'Redação']]],
  ['Praticar', [['#/laboratorios', 'frasco', 'Laboratórios'], ['#/lab/contabil', 'calculadora', 'Contabilidade prática'], ['#/lab/code', 'codigo', 'Code Studio'], ['#/desktop', 'painel', 'Desktop virtual']]],
  ['Concurso', [['#/concursos/ufba-2026', 'predio', 'Edital UFBA 2026'], ['#/concursos/ufba-2026/matriz', 'grade', 'Matriz de cobertura'], ['#/concursos', 'globo', 'Outros concursos']]],
  ['Você', [['#/progresso', 'trofeu', 'Progresso'], ['#/conta', 'escudo', 'Conta e segurança'], ['#/sobre', 'info', 'Sobre e limites']]],
];
const INFERIOR = [['#/', 'inicio', 'Início'], ['#/areas', 'grade', 'Áreas'], ['#/aulas', 'slides', 'Aulas'], ['#/laboratorios', 'frasco', 'Labs'], ['#/progresso', 'trofeu', 'Você']];

const P = 'concurso-lab:';
export const prefs = {
  ler(k, padrao = null) { try { const v = localStorage.getItem(P + k); return v == null ? padrao : JSON.parse(v); } catch { return padrao; } },
  gravar(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch { /* modo privado */ } },
};

export function aplicarTema() {
  const t = prefs.ler('tema');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const f = prefs.ler('fonte');
  if (f) document.documentElement.dataset.fonte = f; else delete document.documentElement.dataset.fonte;
}
const temaEscuro = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);

export function montarCasca(raiz, { sessao, servico, contas, comandos = [], aoSair, aoBloquear, aoTrocarConta, contadores = () => ({}) }) {
  raiz.innerHTML = `<a class="pular" href="#app">Pular para o conteúdo</a>
  <div class="app ${prefs.ler('recolhida') ? 'recolhida' : ''}" id="appGrid">
    <nav class="lateral" id="lateral" aria-label="Navegação principal">
      <a class="marca" href="#/"><span class="logo">${ic('formatura')}</span><span>Concurso Lab<small>estudo aberto · versão 2.1</small></span></a>
      ${NAV.map(([grupo, itens]) => `${grupo ? `<div class="nav-grupo">${esc(grupo)}</div>` : ''}${itens.map(([h, i, t, cont]) => `<a class="nav-item" href="${h}" title="${esc(t)}">${ic(i)}<span>${esc(t)}</span>${cont ? `<b class="contador" data-contador="${cont}" hidden></b>` : ''}</a>`).join('')}`).join('')}
      <div class="lateral-rodape">
        <div class="alvo-card" id="alvoCard"></div>
        <button class="nav-item" type="button" id="recolher" style="border:0;background:none;width:100%">${ic('painel')}<span class="txt">Recolher menu</span></button>
      </div>
    </nav>
    <div class="principal">
      <header class="topo">
        <button class="btn fantasma icone" type="button" id="abrirMenu" aria-controls="lateral" aria-expanded="false" aria-label="Abrir menu" style="display:none">${ic('menu')}</button>
        <span class="titulo-pag" id="tituloPag"></span>
        <span class="espaco"></span>
        <button class="busca-btn" type="button" id="abrirBusca" aria-label="Buscar (Ctrl+K)">${ic('busca')}<span class="txt">Buscar aulas, labs, páginas…</span><kbd>Ctrl K</kbd></button>
        <a class="chip fogo" href="#/progresso" id="chipSeq" title="Dias seguidos de estudo">${ic('fogo')}<span>0</span></a>
        <a class="chip xp" href="#/progresso" id="chipXp" title="Nível e XP">${ic('estrela')}<span class="txt"></span></a>
        <button class="btn fantasma icone" type="button" id="tema" aria-label="Alternar tema claro/escuro">${ic(temaEscuro() ? 'sol' : 'lua')}</button>
        <button class="avatar-btn" type="button" id="abrirConta" aria-haspopup="menu" aria-label="Menu da conta">${avatar(sessao.conta)}</button>
      </header>
      <main class="pagina" id="app" tabindex="-1"></main>
      <footer class="rodape" id="rodape">Projeto educacional independente, sem vínculo com a UFBA, o Instituto Avalia ou fabricantes citados. Laboratórios usam dados fictícios; cada um informa o que é real e o que é simulado. Nomes de produtos são marcas de seus titulares.</footer>
    </div>
  </div>
  <nav class="nav-inferior" aria-label="Navegação rápida">${INFERIOR.map(([h, i, t]) => `<a href="${h}">${ic(i)}${esc(t)}</a>`).join('')}</nav>
  <div class="toasts" id="toasts" aria-live="polite"></div>`;

  const $ = (s) => raiz.querySelector(s);
  const app = $('#appGrid');
  const lateral = $('#lateral');
  const abrirMenu = $('#abrirMenu');
  const pequena = matchMedia('(max-width: 1000px)');
  const ajustarMenu = () => { abrirMenu.style.display = pequena.matches ? '' : 'none'; if (!pequena.matches) fecharGaveta(); };
  let veu = null;
  function fecharGaveta() { lateral.classList.remove('aberta'); abrirMenu.setAttribute('aria-expanded', 'false'); veu?.remove(); veu = null; }
  function abrirGaveta() {
    lateral.classList.add('aberta');
    abrirMenu.setAttribute('aria-expanded', 'true');
    veu = document.createElement('div');
    veu.className = 'veu';
    veu.onclick = fecharGaveta;
    document.body.append(veu);
    lateral.querySelector('a')?.focus();
  }
  pequena.addEventListener('change', ajustarMenu);
  ajustarMenu();
  abrirMenu.onclick = () => (lateral.classList.contains('aberta') ? fecharGaveta() : abrirGaveta());
  lateral.addEventListener('click', (e) => { if (e.target.closest('a') && pequena.matches) fecharGaveta(); });
  $('#recolher').onclick = () => { const r = !app.classList.contains('recolhida'); app.classList.toggle('recolhida', r); prefs.gravar('recolhida', r); };

  $('#tema').onclick = (e) => {
    const novo = temaEscuro() ? 'light' : 'dark';
    prefs.gravar('tema', novo);
    aplicarTema();
    e.currentTarget.innerHTML = ic(novo === 'dark' ? 'sol' : 'lua');
    dispatchEvent(new CustomEvent('tema-mudou', { detail: novo }));
  };

  // Indicadores da barra superior.
  function pintar(p = servico.progresso) {
    const n = nivel(p.xp);
    $('#chipXp .txt').textContent = `Nv ${n.numero} · ${p.xp} XP`;
    $('#chipSeq span').textContent = sequencia(p.dias);
    const c = contadores();
    raiz.querySelectorAll('[data-contador]').forEach((b) => { const v = c[b.dataset.contador] ?? 0; b.hidden = !v; b.textContent = v > 99 ? '99+' : v; });
    const alvo = p.alvo;
    $('#alvoCard').innerHTML = alvo ? `<div class="sutil mini">Meu cargo</div><a href="#/concursos/${esc(alvo.concurso)}/cargo/${encodeURIComponent(alvo.cargo)}" class="forte">${esc(alvo.cargo)} · ${esc(alvo.nome ?? 'UFBA 2026')}</a>` : '<div class="sutil mini">Nenhum cargo definido</div><a href="#/" class="forte">Escolher meu cargo</a>';
  }
  pintar();
  servico.ouvir((p, ev) => {
    pintar(p);
    if (ev.subiuNivel) toast(`Você subiu para o nível ${nivel(p.xp).numero} — ${nivel(p.xp).titulo}!`, { tipo: 'xp', ms: 6000 });
  });

  // Menu da conta.
  let menuAberto = null;
  const fecharMenuConta = () => { menuAberto?.remove(); menuAberto = null; };
  $('#abrirConta').onclick = (e) => {
    e.stopPropagation();
    if (menuAberto) return fecharMenuConta();
    const r = e.currentTarget.getBoundingClientRect();
    const m = document.createElement('div');
    m.className = 'menu-flutuante';
    m.setAttribute('role', 'menu');
    m.style.top = `${r.bottom + 8}px`;
    m.style.right = `${Math.max(8, innerWidth - r.right)}px`;
    m.style.position = 'fixed';
    const c = sessao.conta;
    m.innerHTML = `<div class="cab"><div class="linha nw">${avatar(c)}<div style="min-width:0"><div class="forte">${esc(c?.nome ?? 'Visitante')}</div><div class="mini sutil">${c ? `${ic('cadeado')} Cofre cifrado neste aparelho` : 'Progresso sem senha neste navegador'}</div></div></div></div>
      ${c ? '' : `<button class="item" role="menuitem" data-acao="criar">${ic('usuario')} Criar conta ou entrar</button>`}
      <a class="item" role="menuitem" href="#/conta">${ic('escudo')} Conta e segurança</a>
      <a class="item" role="menuitem" href="#/progresso">${ic('trofeu')} Meu progresso</a>
      <button class="item" role="menuitem" data-acao="backup">${ic('baixar')} Baixar backup ${c ? 'cifrado' : ''}</button>
      <hr>
      ${c ? `<button class="item" role="menuitem" data-acao="bloquear">${ic('cadeado')} Bloquear agora</button>` : ''}
      <button class="item" role="menuitem" data-acao="trocar">${ic('usuarios')} Trocar de conta</button>
      ${c ? `<button class="item perigo" role="menuitem" data-acao="sair">${ic('sair')} Sair</button>` : ''}`;
    document.body.append(m);
    menuAberto = m;
    m.querySelector('.item')?.focus();
    m.addEventListener('click', async (ev) => {
      const a = ev.target.closest('[data-acao]')?.dataset.acao;
      fecharMenuConta();
      if (a === 'backup') {
        const dados = await contas.exportar(sessao);
        baixarArquivo(`concurso-lab-${c ? 'backup-cifrado' : 'visitante'}-${diaIso()}.json`, JSON.stringify(dados));
        toast(c ? 'Backup cifrado baixado. Para abrir em outro aparelho: Importar backup + sua senha.' : 'Backup baixado.', { tipo: 'ok', ms: 6000 });
      }
      if (a === 'bloquear') aoBloquear();
      if (a === 'sair') aoSair();
      if (a === 'trocar' || a === 'criar') aoTrocarConta();
    });
  };
  const fora = (e) => { if (menuAberto && !menuAberto.contains(e.target)) fecharMenuConta(); };
  document.addEventListener('click', fora);

  // Busca global (paleta de comandos).
  let indice = null;
  async function abrirBusca() {
    indice ??= await Promise.all(comandos.map((f) => f())).then((ls) => ls.flat());
    const m = modal({ titulo: null, classe: 'paleta-cmd', larga: true, corpo: `<div style="position:relative">${ic('busca', 'lupa')}<input class="busca" type="search" placeholder="Buscar aulas, laboratórios, páginas e comandos…" aria-label="Buscar" autocomplete="off"></div><ul role="listbox"></ul>` });
    const inp = m.el.querySelector('input');
    const ul = m.el.querySelector('ul');
    let sel = 0;
    let vis = [];
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const desenhar = () => {
      const termos = norm(inp.value).split(/\s+/).filter(Boolean);
      vis = indice.filter((it) => termos.every((t) => it.busca.includes(t))).slice(0, 40);
      sel = Math.min(sel, Math.max(0, vis.length - 1));
      let grupo = '';
      ul.innerHTML = vis.length ? vis.map((it, i) => {
        const g = it.grupo !== grupo ? `<li class="grupo">${esc((grupo = it.grupo))}</li>` : '';
        return `${g}<li><a href="${esc(it.href ?? '#')}" data-i="${i}" role="option" aria-selected="${i === sel}">${ic(it.icone ?? 'seta')}<span>${esc(it.titulo)}${it.sub ? `<br><span class="mini sutil">${esc(it.sub)}</span>` : ''}</span><span class="tipo">${esc(it.tipo ?? '')}</span></a></li>`;
      }).join('') : '<li class="vazio" style="margin:10px">Nada encontrado.</li>';
    };
    const ir = (i) => {
      const it = vis[i];
      if (!it) return;
      m.fechar();
      if (it.acao) it.acao(); else location.hash = it.href.replace(/^#/, '');
    };
    inp.addEventListener('input', () => { sel = 0; desenhar(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(vis.length - 1, sel + 1); desenhar(); ul.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); desenhar(); ul.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Enter') { e.preventDefault(); ir(sel); }
    });
    ul.addEventListener('click', (e) => { const a = e.target.closest('[data-i]'); if (a) { e.preventDefault(); ir(Number(a.dataset.i)); } });
    desenhar();
    inp.focus();
  }
  $('#abrirBusca').onclick = abrirBusca;
  const atalhos = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrirBusca(); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable && !document.querySelector('dialog[open]')) { e.preventDefault(); abrirBusca(); }
    if (e.key === 'Escape') { fecharMenuConta(); if (lateral.classList.contains('aberta')) { fecharGaveta(); abrirMenu.focus(); } }
  };
  addEventListener('keydown', atalhos);

  // Bloqueio automático por inatividade (contas com senha).
  let ultimoUso = Date.now();
  const marcarUso = () => { ultimoUso = Date.now(); };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, marcarUso, { passive: true }));
  const vigia = setInterval(() => {
    const min = sessao.ler('config')?.bloqueioMin ?? 30;
    if (sessao.conta && min > 0 && Date.now() - ultimoUso > min * 60_000) aoBloquear();
  }, 20_000);

  // Tempo de estudo: minutos com a aba visível e uso recente.
  const tempo = setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - ultimoUso < 120_000) servico.registrarMinuto?.();
  }, 60_000);

  const main = $('#app');
  $('.pular').onclick = (e) => { e.preventDefault(); main.focus(); };

  return {
    main,
    pintar,
    aoNavegar(caminho, opcoes) {
      main.className = `pagina ${opcoes.cheia ? 'cheia' : ''}`;
      $('#rodape').hidden = !!opcoes.cheia;
      let melhor = null;
      raiz.querySelectorAll('.lateral a.nav-item, .nav-inferior a').forEach((a) => {
        const alvo = a.getAttribute('href').replace(/^#/, '');
        const casa = alvo === '/' ? caminho === '/' : caminho === alvo || caminho.startsWith(`${alvo}/`);
        a.removeAttribute('aria-current');
        if (casa && (!melhor || alvo.length >= melhor.alvo.length)) melhor = { a, alvo };
      });
      raiz.querySelectorAll('.lateral a.nav-item, .nav-inferior a').forEach((a) => { if (melhor && a.getAttribute('href') === `#${melhor.alvo}`) a.setAttribute('aria-current', 'page'); });
      if (!melhor && caminho.startsWith('/lab/')) raiz.querySelectorAll('a[href="#/laboratorios"]').forEach((a) => a.setAttribute('aria-current', 'page'));
      const atual = raiz.querySelector('.lateral a[aria-current="page"] span');
      $('#tituloPag').textContent = atual?.textContent ?? '';
      pintar();
    },
    definirTitulo(t) { $('#tituloPag').textContent = t; document.title = t ? `${t} · Concurso Lab` : 'Concurso Lab'; },
    desmontar() {
      clearInterval(vigia);
      clearInterval(tempo);
      removeEventListener('keydown', atalhos);
      document.removeEventListener('click', fora);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => removeEventListener(ev, marcarUso));
      fecharMenuConta();
      fecharGaveta();
    },
  };
}

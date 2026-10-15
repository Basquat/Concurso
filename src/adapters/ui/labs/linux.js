import { criarServidor, executar, salvarArquivo, listar } from '../../../domain/linux/shell.js';
import { MISSOES_LINUX } from '../../../domain/linux/missions.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const BOAS_VINDAS = 'Servidor didático srv-didatico (Ubuntu simulado). Você está logado como "aluno" (com sudo).\nDigite help. Experimente: fastfetch, sudo apt install sl, sl, distro fedora\n';

export default async function linux(el, { servico, labs }) {
  let st = labs.carregar('linux') ?? criarServidor();
  el.innerHTML = cabecalhoLab('linux', '<label class="campo">Distribuição<select data-distro><option value="ubuntu">Ubuntu 24.04</option><option value="fedora">Fedora 41</option><option value="arch">Arch Linux</option></select></label>') + `<div class="split">
      <div><div class="term" id="term" role="log" aria-label="Terminal"></div>
      <p class="pequeno muted">↑/↓ histórico · Tab completa nomes · Ctrl+L limpa · nano arquivo abre o editor</p></div>
      <aside class="card" id="missoes"></aside></div>`;
  const term = el.querySelector('#term');
  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'linux', missoes: MISSOES_LINUX, servico });
  const prompt = () => `${st.user}@${st.host}:${st.cwd.replace(/^\/home\/aluno/, '~')}$ `;

  const entrada = document.createElement('div');
  entrada.innerHTML = '<span class="prompt"></span><input aria-label="Comando" autocomplete="off" autocapitalize="off" spellcheck="false">';
  const input = entrada.querySelector('input');
  const escrever = (html) => { const d = document.createElement('div'); d.innerHTML = html; term.insertBefore(d, entrada); };
  const pintarPrompt = () => { entrada.querySelector('.prompt').textContent = prompt(); };
  const limparTela = () => { term.replaceChildren(entrada); };
  term.append(entrada);
  escrever(`<span class="sis">${esc(BOAS_VINDAS)}</span>`);
  pintarPrompt();
  let hIdx = st.historico.length;

  const salvarEVerificar = () => { labs.salvar('linux', st); painel.verificar((m) => m.check(st)); };

  function rodar(cmd) {
    escrever(`<span class="prompt">${esc(prompt())}</span><span class="cmd">${esc(cmd)}</span>`);
    const r = executar(st, cmd);
    if (r.limpar) limparTela();
    if (r.saida) escrever(esc(r.saida));
    hIdx = st.historico.length;
    pintarPrompt();
    salvarEVerificar();
    term.scrollTop = term.scrollHeight;
    if (r.editar) abrirEditor(r.editar);
  }

  function completar() {
    const v = input.value;
    const m = /(\S*)$/.exec(v);
    const palavra = m[1];
    const i = palavra.lastIndexOf('/');
    const dir = i >= 0 ? palavra.slice(0, i + 1) : '';
    const pre = palavra.slice(i + 1);
    const base = dir.startsWith('~') ? '/home/aluno' + dir.slice(1) : dir;
    const opcoes = listar(st, base || '.').filter((n) => n.startsWith(pre));
    if (opcoes.length === 1) input.value = v.slice(0, v.length - pre.length) + opcoes[0];
    else if (opcoes.length > 1) { escrever(`<span class="prompt">${esc(prompt())}</span>${esc(v)}`); escrever(esc(opcoes.join('  '))); }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const c = input.value; input.value = ''; rodar(c); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = st.historico[hIdx] ?? ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(st.historico.length, hIdx + 1); input.value = st.historico[hIdx] ?? ''; }
    else if (e.key === 'Tab') { e.preventDefault(); completar(); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); limparTela(); }
  });
  term.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });

  function abrirEditor({ caminho, conteudo, root }) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="card pilha" role="dialog" aria-label="Editor nano">
      <div class="linha entre"><strong class="mono">GNU nano (simulado) — ${esc(caminho)}${root ? ' [root]' : ''}</strong><span class="pequeno muted">Ctrl+O salva · Ctrl+X sai</span></div>
      <textarea class="mono" rows="18" spellcheck="false"></textarea>
      <div class="pequeno" id="msg"></div>
      <div class="linha"><button class="btn primario" data-s>Salvar (Ctrl+O)</button><button class="btn" data-x>Sair (Ctrl+X)</button></div></div>`;
    const ta = modal.querySelector('textarea');
    ta.value = conteudo;
    const msg = modal.querySelector('#msg');
    const salvar = () => {
      const erro = salvarArquivo(st, caminho, ta.value, root);
      msg.innerHTML = erro ? `<span class="erro">[ Erro ao gravar ${esc(erro)} ]${root ? '' : ' — abra com sudo nano'}</span>` : `<span class="ok">[ ${ta.value.split('\n').length} linhas gravadas ]</span>`;
      if (!erro) salvarEVerificar();
    };
    const sair = () => { modal.remove(); input.focus(); };
    modal.querySelector('[data-s]').onclick = salvar;
    modal.querySelector('[data-x]').onclick = sair;
    ta.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); salvar(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); sair(); }
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); }
    });
    document.body.append(modal);
    ta.focus();
  }

  const sel = el.querySelector('[data-distro]'); sel.value = st.distro ?? 'ubuntu';
  sel.addEventListener('change', () => { rodar('distro ' + sel.value); input.focus(); });
  confirmarReinicio(el, () => { labs.limpar('linux'); st = criarServidor(); hIdx = 0; limparTela(); escrever(`<span class="sis">${esc(BOAS_VINDAS)}</span>`); pintarPrompt(); });
  painel.verificar((m) => m.check(st));
  input.focus();
}

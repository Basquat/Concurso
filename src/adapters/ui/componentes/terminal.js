// Terminal simples (linha de comando com histórico ↑/↓) para os laboratórios de CLI.
import { esc } from '../dom.js';

export function terminal(el, { prompt = () => '$ ', aoComando, boasVindas = '', altura = 380 }) {
  el.innerHTML = `<div class="term-caixa"><div class="term" style="height:${altura}px" tabindex="0"><div class="hist"></div><div class="linha nw" style="gap:0"><span class="pr"></span><input class="cmd" spellcheck="false" autocomplete="off" aria-label="Comando" style="flex:1;background:transparent;border:0;color:inherit;font:inherit;outline:none;padding:0;min-height:0;box-shadow:none"></div></div></div>`;
  const term = el.querySelector('.term');
  const hist = el.querySelector('.hist');
  const inp = el.querySelector('.cmd');
  const pr = el.querySelector('.pr');
  const historico = [];
  let pos = 0;
  const escrever = (txt, cls = '') => { if (txt === '\f') { hist.innerHTML = ''; return; } if (txt) hist.insertAdjacentHTML('beforeend', `<div class="${cls}" style="white-space:pre-wrap">${esc(txt)}</div>`); term.scrollTop = term.scrollHeight; };
  const pintarPrompt = () => { pr.textContent = prompt(); };
  if (boasVindas) escrever(boasVindas, 'sutil');
  pintarPrompt();
  term.addEventListener('click', () => inp.focus());
  inp.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const c = inp.value;
      inp.value = '';
      escrever(`${prompt()}${c}`, 'info');
      if (c.trim()) { historico.push(c); pos = historico.length; }
      const r = await aoComando(c.trim());
      escrever(r);
      pintarPrompt();
    } else if (e.key === 'ArrowUp') { e.preventDefault(); pos = Math.max(0, pos - 1); inp.value = historico[pos] ?? ''; } else if (e.key === 'ArrowDown') { e.preventDefault(); pos = Math.min(historico.length, pos + 1); inp.value = historico[pos] ?? ''; } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); hist.innerHTML = ''; }
  });
  setTimeout(() => inp.focus(), 50);
  return { escrever, executar: async (c) => { escrever(`${prompt()}${c}`, 'info'); escrever(await aoComando(c)); pintarPrompt(); } };
}

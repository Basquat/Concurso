// Laboratório de Montagem de Servidor (UI)
import { criarServidor, ligarServidor, desligarServidor, instalarPacote, criarUsuario, configurarRede, statusServidor, instalarServico } from '../../../domain/lab-servidor/index.js';
import { MISSOES_SERVIDOR } from '../../../domain/lab-servidor/misssoes.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

export default async function labServidor(el, { labs, servico }) {
  let st = labs.carregar('servidor') ?? criarServidor();
  el.innerHTML = cabecalhoLab('servidor') + `<div class="split">
      <div><div class="term" id="term" role="log" aria-label="Terminal do servidor"></div></div>
      <aside class="card" id="missoes"></aside></div>`;
  const term = el.querySelector('#term');
  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'servidor', missoes: MISSOES_SERVIDOR, servico });
  const escrever = (html) => { const d = document.createElement('div'); d.innerHTML = html; term.append(d); };
  const prompt = () => `aluno@${st.host}:~$ `;

  const entrada = document.createElement('div');
  entrada.innerHTML = '<span class="prompt"></span><input aria-label="Comando" autocomplete="off" spellcheck="false">';
  const input = entrada.querySelector('input');
  const pintarPrompt = () => { entrada.querySelector('.prompt').textContent = prompt(); };
  const limparTela = () => { term.replaceChildren(entrada); };
  term.append(entrada);
  escrever(`<span class="sis">Bem-vindo ao srv-didatico (Ubuntu 22.04 simulado). Digite "help".</span>`);
  pintarPrompt();

  const salvar = () => { labs.salvar('servidor', st); painel.verificar((m) => m.check?.(st)); };

  function rodar(cmd) {
    escrever(`<span class="prompt">${esc(prompt())}</span><span class="cmd">${esc(cmd)}</span>`);
    const partes = cmd.trim().split(/\s+/);
    const acao = partes[0];
    let saida = '';
    let ok = true;
    switch (acao) {
      case 'help':
        saida = 'Comandos: ligar, desligar, status, instalar <pacote>, add-usuario <nome> <sudo>, config-rede <ip>/<mascara>, instalar-servico <servico>, reboot';
        break;
      case 'ligar': { const r = ligarServidor(st); saida = r.msg; ok = r.ok; break; }
      case 'desligar': { const r = desligarServidor(st); saida = r.msg; ok = r.ok; break; }
      case 'status': { st.statusVisto = true; const s = statusServidor(st); saida = JSON.stringify(s, null, 2); break; }
      case 'instalar': { const r = instalarPacote(st, partes[1]); saida = r.msg; ok = r.ok; break; }
      case 'add-usuario': { const r = criarUsuario(st, { nome: partes[1], tipo: partes[2] || 'humano', sudo: partes[3] === 'sudo' }); saida = r.msg; ok = r.ok; break; }
      case 'config-rede': { st.redeConfigurada = true; const r = configurarRede(st, { ip: partes[1].split('/')[0], mascara: partes[1].split('/')[1] || '24', gateway: partes[2] || '192.168.1.1', dns: partes[3] || '8.8.8.8' }); saida = r.msg; ok = r.ok; break; }
      case 'instalar-servico': { const r = instalarServico(st, partes[1]); saida = r.msg; ok = r.ok; break; }
      case 'reboot': st = criarServidor(); saida = 'Servidor reiniciado.'; break;
      default: saida = `${acao}: comando não encontrado. Digite help.`; ok = false;
    }
    if (saida) escrever(esc(saida));
    salvar();
    term.scrollTop = term.scrollHeight;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const c = input.value; input.value = ''; rodar(c); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); }
  });
  term.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });
  confirmarReinicio(el, () => { st = criarServidor(); labs.salvar('servidor', st); term.replaceChildren(entrada); escrever('<span class="sis">Bem-vindo ao srv-didatico. Digite "help".</span>'); pintarPrompt(); });
}
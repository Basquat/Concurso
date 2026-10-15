// Raiz de composição: liga os adaptadores (navegador) às portas da aplicação e inicia o roteador.
import { criarServicoEstudo } from './application/estudo.js';
import { repositorioProgresso, repositorioLab, preferencias } from './adapters/storage/local.js';
import { fonteEstatica } from './adapters/content/estatico.js';
import { motorSqlJs } from './adapters/sql/sqljs.js';
import { executorJs, executorPhp } from './adapters/code/executores.js';
import { iniciarRoteador } from './adapters/ui/router.js';
import { nivel, sequencia } from './domain/gamification.js';
import { $, esc, barra, toast } from './adapters/ui/dom.js';

const servico = criarServicoEstudo({ repositorio: repositorioProgresso() });
const ctx = {
  servico,
  conteudo: fonteEstatica(),
  labs: repositorioLab(),
  sql: motorSqlJs(),
  js: executorJs(),
  php: executorPhp(),
};

function pintarXp(p) {
  const n = nivel(p.xp);
  const seq = sequencia(p.dias);
  $('#xp').innerHTML = `<span title="${esc(n.titulo)}">Nível ${n.numero}</span>${barra(n.pct)}<span>${p.xp} XP</span>${seq ? `<span title="Dias seguidos de estudo">${seq} dia(s) seguidos</span>` : ''}`;
}
pintarXp(servico.progresso);
servico.ouvir((p, ev) => {
  pintarXp(p);
  if (ev.subiuNivel) toast(`Novo nível: ${nivel(p.xp).numero} (${nivel(p.xp).titulo}).`, 5000);
});

// Tema: segue o sistema até a pessoa escolher.
const tema = preferencias.ler('tema');
if (tema) document.documentElement.dataset.theme = tema;
$('#tema').addEventListener('click', () => {
  const escuro = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = escuro ? 'light' : 'dark';
  preferencias.gravar('tema', document.documentElement.dataset.theme);
});

// Menu lateral em telas pequenas.
const lateral = $('#lateral');
const botaoMenu = $('#botao-menu');
const menu = (abrir) => {
  lateral.classList.toggle('aberta', abrir);
  botaoMenu.setAttribute('aria-expanded', String(abrir));
  if (abrir) lateral.querySelector('a')?.focus();
};
botaoMenu.addEventListener('click', () => menu(!lateral.classList.contains('aberta')));
lateral.addEventListener('click', (e) => { if (e.target.closest('a')) menu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && lateral.classList.contains('aberta')) { menu(false); botaoMenu.focus(); } });
document.addEventListener('click', (e) => { if (lateral.classList.contains('aberta') && !lateral.contains(e.target) && e.target !== botaoMenu) menu(false); });

// O roteador usa o hash, então o link "pular" foca o conteúdo em vez de navegar.
$('#pular').addEventListener('click', (e) => { e.preventDefault(); $('#app').focus(); });

iniciarRoteador($('#app'), ctx);

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
  $('#xp').innerHTML = `<span title="Nível ${n.numero}: ${esc(n.titulo)}"><strong>Nv ${n.numero}</strong> <span class="titulo-nivel muted">${esc(n.titulo)}</span></span>${barra(n.pct)}<span>${p.xp} XP</span>${seq ? `<span title="Dias seguidos estudando">🔥${seq}</span>` : ''}`;
}
pintarXp(servico.progresso);
servico.ouvir((p, ev) => {
  pintarXp(p);
  if (ev.subiuNivel) toast(`🎉 Você subiu para o nível ${nivel(p.xp).numero}: ${nivel(p.xp).titulo}!`, 5000);
});

const tema = preferencias.ler('tema');
if (tema) document.documentElement.dataset.theme = tema;
$('#tema').addEventListener('click', () => {
  const escuro = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = escuro ? 'light' : 'dark';
  preferencias.gravar('tema', document.documentElement.dataset.theme);
});

iniciarRoteador($('#app'), ctx);

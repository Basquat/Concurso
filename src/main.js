// Raiz de composição: armazenamento → migração da 1.0 → conta (porta) → casca → roteador.
import { armazemPadrao } from './adapters/storage/idb.js';
import { criarGerenciador, migrarV1 } from './adapters/storage/cofre.js';
import { criarNuvem } from './adapters/storage/nuvem.js';
import { NUVEM_URL } from './config.js';
import { abrirPorta, telaBloqueio } from './adapters/ui/porta.js';
import { montarCasca, aplicarTema, NAV } from './adapters/ui/casca.js';
import { criarServicoEstudo } from './application/estudo.js';
import { fonteEstatica } from './adapters/content/estatico.js';
import { conteudoDoCargo } from './application/escopo.js';
import { cargoAlvo } from './adapters/ui/componentes/cargo.js';
import { motorSqlJs } from './adapters/sql/sqljs.js';
import { executorJs, executorPhp } from './adapters/code/executores.js';
import { iniciarRoteador } from './adapters/ui/router.js';
import { LABS } from './adapters/ui/labs/registro.js';
import { toast, esc } from './adapters/ui/dom.js';

aplicarTema();
const raiz = document.getElementById('raiz');
const conteudo = fonteEstatica();
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let contas;
let persistente = true;
let atual = null;

function abrirApp(sessao) {
  const servico = criarServicoEstudo({
    repositorio: { carregar: () => sessao.ler('progresso'), salvar: (p) => sessao.gravar('progresso', p) },
    revisoes: { carregar: () => sessao.ler('srs'), salvar: (s) => sessao.gravar('srs', s) },
  });
  // Estudo (aulas, questões, flashcards, simulados, plano) só enxerga o conteúdo do cargo desta conta;
  // telas do edital (matriz, cargo) usam o acervo completo.
  const estudo = conteudoDoCargo(conteudo, async () => {
    const a = servico.progresso.alvo;
    return a ? cargoAlvo(servico.progresso, await conteudo.concurso(a.concurso).catch(() => ({ id: null, cargos: [] }))) : null;
  });
  const ctx = {
    sessao,
    contas,
    servico,
    conteudo: estudo,
    acervo: conteudo,
    persistente,
    labs: {
      carregar: (lab) => sessao.ler(`lab:${lab}`),
      salvar: (lab, estado) => sessao.gravar(`lab:${lab}`, estado),
      limpar: (lab) => sessao.apagar(`lab:${lab}`),
    },
    sql: motorSqlJs(),
    js: executorJs(),
    php: executorPhp(),
  };

  const comandos = [
    () => NAV.flatMap(([grupo, itens]) => itens.map(([href, icone, titulo]) => ({ grupo: 'Páginas', tipo: grupo || 'página', titulo, href, icone }))),
    () => Object.entries(LABS).map(([id, l]) => ({ grupo: 'Laboratórios', tipo: 'laboratório', titulo: l.nome, sub: l.resumo, href: `#/lab/${id}`, icone: l.icone ?? 'frasco' })),
    () => estudo.indice().then((ix) => ix.aulas.map((a) => ({ grupo: 'Aulas', tipo: a.disciplina, titulo: a.titulo, sub: `${a.slides} slides`, href: `#/aulas/${a.id}`, icone: 'slides' }))).catch(() => []),
    () => [
      { grupo: 'Ações', tipo: 'ação', titulo: 'Alternar tema claro/escuro', icone: 'lua', acao: () => document.getElementById('tema')?.click() },
      { grupo: 'Ações', tipo: 'ação', titulo: 'Começar um simulado', icone: 'simulado', href: '#/simulado' },
      { grupo: 'Ações', tipo: 'ação', titulo: 'Revisar agora', icone: 'cerebro', href: '#/revisoes' },
      ...(sessao.conta ? [{ grupo: 'Ações', tipo: 'ação', titulo: 'Bloquear a conta agora', icone: 'cadeado', acao: () => bloquear() }] : []),
    ],
  ].map((f) => async () => (await f()).map((it) => ({ ...it, busca: norm(`${it.titulo} ${it.sub ?? ''} ${it.tipo ?? ''}`) })));

  const casca = montarCasca(raiz, {
    sessao, servico, contas, comandos,
    aoSair: () => trocar(true),
    aoBloquear: () => bloquear(),
    aoTrocarConta: () => trocar(true),
    contadores: () => ({ revisoes: servico.vencidas().length }),
  });
  ctx.casca = casca;
  ctx.acoes = { trocarConta: () => trocar(true), bloquear: () => bloquear(), sair: () => trocar(true) };
  const roteador = iniciarRoteador(casca.main, ctx, { aoNavegar: casca.aoNavegar });
  atual = { sessao, casca, roteador };
  if (!persistente) toast('Este navegador não permite salvar dados (janela anônima?). O progresso será perdido ao fechar a aba.', { tipo: 'erro', ms: 10000 });
  if (sessao.corrompidos) toast(`${sessao.corrompidos} registro(s) não puderam ser decifrados e foram ignorados.`, { tipo: 'erro', ms: 8000 });
}

async function fecharApp() {
  if (!atual) return;
  await atual.sessao.salvarAgora().catch(console.error);
  atual.roteador.sair();
  atual.casca.desmontar();
}

async function trocar(esquecer) {
  const { sessao } = atual;
  await fecharApp();
  if (esquecer) await contas.sair(sessao);
  atual = null;
  location.hash = '#/';
  abrirApp(await abrirPorta(raiz, contas));
}

async function bloquear() {
  const { sessao } = atual;
  if (!sessao.conta) return;
  const conta = sessao.conta;
  await fecharApp();
  await contas.sair(sessao);
  atual = null;
  const s = await telaBloqueio(raiz, contas, conta);
  abrirApp(s ?? (await abrirPorta(raiz, contas)));
}

// Grava pendências ao trocar de aba ou fechar.
let ultimaSync = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') atual?.sessao.salvarAgora().catch(console.error);
  // Ao voltar para a aba, puxa o que foi feito em outro aparelho (no máximo uma vez por minuto).
  else if (atual?.sessao.sincronizar && Date.now() - ultimaSync > 60_000) { ultimaSync = Date.now(); atual.sessao.sincronizar().catch(() => {}); }
});
addEventListener('pagehide', () => atual?.sessao.salvarAgora().catch(console.error));

async function iniciar() {
  try {
    const r = await armazemPadrao();
    persistente = r.persistente;
    await migrarV1({ armazem: r.armazem }).catch((e) => console.error('migração 1.0', e));
    contas = criarGerenciador({ armazem: r.armazem, nuvem: NUVEM_URL ? criarNuvem({ url: NUVEM_URL }) : null });
    const sessao = (await contas.retomar().catch((e) => { console.error(e); return null; })) ?? (await abrirPorta(raiz, contas));
    abrirApp(sessao);
  } catch (e) {
    console.error(e);
    raiz.innerHTML = `<div class="pagina estreita"><div class="aviso erro"><strong>Não foi possível iniciar o Concurso Lab.</strong><p class="mono pequeno">${esc(e.message)}</p><p class="mb0">Recarregue a página. Se usar janela anônima, permita o armazenamento do site.</p></div></div>`;
  }
}

iniciar();

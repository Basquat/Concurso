// Moldura padrão dos laboratórios: cabeçalho, guia lateral (missões, referência, teoria, sobre) e área de trabalho.
// Laboratórios da 2.0 recebem um "kit"; os da 1.0 (legado) rodam dentro de uma janela no estilo da ferramenta real.
import { LABS, SELO_REAL, NIVEL } from '../labs/registro.js';
import { esc, ic, toast, confirmar } from '../dom.js';
import { AREAS } from '../../../domain/areas.js';
import { markdown } from '../../../domain/markdown.js';
import { renderizarDiagramas } from '../cdn.js';

// Janela da 1.0 inspirada na ferramenta real (só visual).
const MOLDURA = {
  linux: ['Terminal — aluno@srv-didatico: ~', ['Arquivo', 'Editar', 'Ver', 'Pesquisar', 'Terminal', 'Ajuda']],
  servidor: ['Console do servidor — srv-didatico', ['Visão geral', 'Logs', 'Armazenamento', 'Rede', 'Contas', 'Serviços', 'Software', 'Terminal']],
  sql: ['DBeaver (simulado) — prefeitura.sqlite', ['Arquivo', 'Editar', 'Navegar', 'Pesquisar', 'Editor SQL', 'Banco de dados', 'Janela', 'Ajuda']],
  aws: ['Console de Gerenciamento da AWS (simulado) — us-east-1', ['Serviços', 'EC2', 'VPC', 'S3', 'IAM', 'RDS', 'CloudWatch', 'Faturamento']],
  redes: ['Packet Tracer (simulado) — topologia.pkt', ['Arquivo', 'Editar', 'Opções', 'Visualizar', 'Ferramentas', 'Extensões', 'Ajuda']],
  bi: ['Power BI Desktop (simulado) — vendas.pbix', ['Arquivo', 'Página Inicial', 'Inserir', 'Modelagem', 'Exibir', 'Otimizar', 'Ajuda']],
  planilha: ['Excel (simulado) — almoxarifado.xlsx', ['Arquivo', 'Página Inicial', 'Inserir', 'Layout da Página', 'Fórmulas', 'Dados', 'Revisão', 'Exibir']],
  contabil: ['Sistema Contábil (simulado) — Comercial Exemplo Ltda', ['Cadastros', 'Lançamentos', 'Livros', 'Demonstrações', 'Relatórios', 'Utilitários']],
  saude: ['Prontuário Eletrônico (simulado) — Enfermaria', ['Pacientes', 'Prescrição', 'Cálculos', 'Sinais vitais', 'Relatórios']],
  educacao: ['Ambiente Virtual de Aprendizagem (simulado)', ['Painel', 'Meus cursos', 'Planejamento', 'Avaliações', 'Notas']],
  scrum: ['Jira Software (simulado) — Projeto CONCURSO', ['Seus trabalhos', 'Projetos', 'Filtros', 'Painéis', 'Equipes', 'Aplicativos']],
  'system-design': ['Diagrama de arquitetura (simulado) — sistema.drawio', ['Arquivo', 'Editar', 'Exibir', 'Organizar', 'Extras', 'Ajuda']],
};

export default async function lab(el, ctx, { args: [id], params }) {
  const meta = LABS[id];
  if (!meta) { el.innerHTML = `<div class="pagina"><div class="vazio"><p>Laboratório não encontrado.</p><a class="btn" href="#/laboratorios">Ver todos</a></div></div>`; return; }
  ctx.casca?.definirTitulo(meta.nome);
  const area = AREAS[meta.area];
  const [tipoSelo, txtSelo] = SELO_REAL[meta.real] ?? SELO_REAL.simulado;
  el.innerHTML = `<div class="lab">
    <header class="lab-cab">
      <a class="btn fantasma icone" href="#/laboratorios" aria-label="Voltar aos laboratórios">${ic('esq')}</a>
      <span class="chip-area" style="--cor:${area?.cor ?? 'var(--prim)'}">${ic(meta.icone ?? 'frasco')}</span>
      <div style="min-width:0;flex:1"><h1>${esc(meta.nome)}</h1><p class="desc">${esc(meta.resumo)}</p></div>
      <div class="linha" id="labAcoes"></div>
      <button class="tag ${tipoSelo}" type="button" data-sobre title="O que é real e o que é simulado">${ic(meta.real === 'real' ? 'okCirculo' : 'info')} ${txtSelo}</button>
      <button class="btn fantasma icone" type="button" data-alternar-guia title="Mostrar ou ocultar o guia" aria-label="Mostrar ou ocultar o guia">${ic('painel')}</button>
    </header>
    <div class="lab-corpo" id="labCorpo">
      <aside class="guia" id="guia" aria-label="Guia do laboratório">
        <div class="abas" role="tablist">${[['missoes', 'Missões'], ['referencia', 'Referência'], ['teoria', 'Teoria'], ['sobre', 'Sobre']].map(([k, n], i) => `<button type="button" role="tab" data-guia="${k}" aria-selected="${i === 0}">${n}</button>`).join('')}</div>
        <div class="guia-corpo" id="guiaCorpo"></div>
      </aside>
      <section class="area-trabalho" id="trabalho"></section>
    </div></div>`;

  const corpo = el.querySelector('#labCorpo');
  const trabalho = el.querySelector('#trabalho');
  const guiaCorpo = el.querySelector('#guiaCorpo');
  const conteudoGuia = {
    missoes: '<p class="muted">Este laboratório é livre: explore à vontade.</p>',
    referencia: '<p class="muted">Sem referência rápida.</p>',
    teoria: '<p class="muted">Veja as aulas da área para a teoria.</p>',
    sobre: `<h3 class="mt0">${ic('info')} O que é real e o que é simulado</h3><p class="pequeno">${esc(meta.simulado)}</p><p class="mini sutil">Nível: ${NIVEL[meta.nivel] ?? '—'} · Área: ${esc(area?.nome ?? '')}</p>${meta.creditos ? `<p class="mini sutil">${meta.creditos}</p>` : ''}`,
  };
  let abaGuia = 'missoes';
  let painelMissoes = null;
  const mostrarGuia = (k) => {
    abaGuia = k;
    el.querySelectorAll('[data-guia]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.guia === k)));
    if (k === 'missoes' && painelMissoes) painelMissoes.desenhar();
    else guiaCorpo.innerHTML = conteudoGuia[k];
    renderizarDiagramas(guiaCorpo);
  };
  el.querySelectorAll('[data-guia]').forEach((b) => b.addEventListener('click', () => mostrarGuia(b.dataset.guia)));
  const guiaOculta = () => ctx.sessao.ler('config')?.[`guia:${id}`] === false;
  const aplicarGuia = (visivel) => corpo.classList.toggle('sem-guia', !visivel);
  el.querySelector('[data-alternar-guia]').onclick = () => {
    const visivel = corpo.classList.contains('sem-guia');
    aplicarGuia(visivel);
    ctx.sessao.gravar('config', { ...(ctx.sessao.ler('config') ?? {}), [`guia:${id}`]: visivel });
    dispatchEvent(new Event('resize'));
  };
  el.querySelector('[data-sobre]').onclick = () => { aplicarGuia(true); mostrarGuia('sobre'); };

  let limpar;
  const mod = await meta.carregar();

  if (meta.legado) {
    aplicarGuia(false);
    el.querySelector('[data-alternar-guia]').hidden = true;
    const [titulo, menu] = MOLDURA[id] ?? [meta.nome, []];
    trabalho.innerHTML = `<section class="janela tema-${esc(id)}" aria-label="${esc(titulo)}"><div class="janela-titulo"><span class="janela-botoes" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(titulo)}</span></div>
      <nav class="janela-menu" aria-label="Menu da ferramenta (ilustrativo)">${menu.map((m) => `<span>${esc(m)}</span>`).join('')}</nav><div class="janela-corpo" id="legado"></div></section>`;
    limpar = await mod.default(trabalho.querySelector('#legado'), ctx);
    return () => { if (typeof limpar === 'function') limpar(); };
  }

  // Kit entregue aos laboratórios da 2.0.
  const acoes = el.querySelector('#labAcoes');
  const kit = {
    id,
    meta,
    params,
    estado: {
      carregar: () => ctx.labs.carregar(id),
      salvar: (e) => ctx.labs.salvar(id, e),
      limpar: () => ctx.labs.limpar(id),
    },
    acoes(html) { acoes.insertAdjacentHTML('beforeend', html); return acoes; },
    aoReiniciar(fn, texto = 'Reiniciar o ambiente? O estado atual será descartado; missões concluídas e XP continuam.') {
      acoes.insertAdjacentHTML('beforeend', `<button class="btn fantasma peq" type="button" data-reiniciar title="Reiniciar ambiente">${ic('recarregar')} Reiniciar</button>`);
      acoes.querySelector('[data-reiniciar]').onclick = async () => { if (await confirmar(texto, { titulo: 'Reiniciar ambiente', sim: 'Reiniciar', perigo: true })) fn(); };
    },
    referencia(html) { conteudoGuia.referencia = `<div class="referencia">${html}</div>`; if (abaGuia === 'referencia') mostrarGuia('referencia'); },
    teoria(md) { conteudoGuia.teoria = `<div class="md pequeno">${markdown(md)}</div>`; if (abaGuia === 'teoria') mostrarGuia('teoria'); },
    sobre(html) { conteudoGuia.sobre += html; },
    semGuia() { aplicarGuia(false); },
    abrirGuia(aba = 'missoes') { aplicarGuia(true); mostrarGuia(aba); },
    // Missões: { id, titulo, descricao, xp, dica?, nivel?, checar(estado) }
    missoes(lista, { titulo = 'Missões' } = {}) {
      const feita = (m) => !!ctx.servico.progresso.missoes[`${id}/${m.id}`];
      painelMissoes = {
        desenhar() {
          if (abaGuia !== 'missoes') return;
          const abertas = new Set([...guiaCorpo.querySelectorAll('details[open]')].map((d) => d.dataset.id));
          const n = lista.filter(feita).length;
          const proxima = lista.find((m) => !feita(m));
          guiaCorpo.innerHTML = `<div class="linha entre mb1"><strong>${esc(titulo)}</strong><span class="pequeno muted">${n} de ${lista.length}</span></div>
            <div class="progresso fina mb2"><span style="width:${lista.length ? (n / lista.length) * 100 : 0}%"></span></div>
            <ul class="missoes">${lista.map((m, k) => `<li class="missao ${feita(m) ? 'feita' : ''} ${m === proxima ? 'atual' : ''}">
              <div class="titulo"><span>${feita(m) ? ic('okCirculo') : `<span class="sutil">${k + 1}.</span>`} ${esc(m.titulo)}</span><span class="estado ${feita(m) ? 'feito' : ''}">${feita(m) ? 'feita' : `+${m.xp} XP`}</span></div>
              ${m.nivel ? `<div class="nivel">${esc(NIVEL[m.nivel] ?? m.nivel)}</div>` : ''}
              <div class="desc">${markdownCurto(m.descricao)}</div>${m.dica ? `<details data-id="${esc(m.id)}" ${abertas.has(m.id) ? 'open' : ''}><summary>Dica</summary><div class="md">${markdownCurto(m.dica)}</div></details>` : ''}</li>`).join('')}</ul>`;
        },
      };
      painelMissoes.desenhar();
      return {
        verificar(estado) {
          let nova = false;
          for (const m of lista) {
            if (feita(m)) continue;
            let ok = false;
            try { ok = !!m.checar(estado); } catch { ok = false; }
            if (ok && ctx.servico.concluirMissao(id, m)) { nova = true; toast(`Missão concluída: ${m.titulo} (+${m.xp} XP)`, { tipo: 'xp' }); }
          }
          if (nova) painelMissoes.desenhar();
          return nova;
        },
        concluir(mid) {
          const m = lista.find((x) => x.id === mid);
          if (m && ctx.servico.concluirMissao(id, m)) { toast(`Missão concluída: ${m.titulo} (+${m.xp} XP)`, { tipo: 'xp' }); painelMissoes.desenhar(); }
        },
        redesenhar: () => painelMissoes.desenhar(),
      };
    },
  };
  if (guiaOculta()) aplicarGuia(false);
  mostrarGuia('missoes');
  limpar = await mod.default(trabalho, ctx, kit);
  return () => { if (typeof limpar === 'function') limpar(); };
}

const markdownCurto = (t) => markdown(String(t ?? '')).replace(/^<p>([\s\S]*)<\/p>$/, '$1');

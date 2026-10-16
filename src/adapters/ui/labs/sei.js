// SEI — Sistema Eletrônico de Informações (simulado): iniciar processo, incluir documentos, assinar, tramitar e concluir,
// como no dia a dia das unidades da UFBA. Numeração NUP: 23066.000000/2026-00.
import { esc, ic, toast, modal } from '../dom.js';

const UNIDADES = ['PROAD', 'PRODEP', 'STI', 'PROGRAD', 'SUPAD', 'GABINETE'];
const TIPOS_PROC = ['Pessoal: Férias', 'Pessoal: Licença Capacitação', 'Material: Aquisição de Bens', 'Contratação de Solução de TI', 'Acesso à Informação: Pedido (LAI)'];
const TIPOS_DOC = { 'Requerimento': 'Interno', 'Despacho': 'Interno', 'Ofício': 'Interno', 'Memorando': 'Interno', 'Nota Técnica': 'Interno', 'Documento externo (PDF)': 'Externo' };

const nup = (n) => { const base = `23066${String(n).padStart(6, '0')}2026`; let dv1 = 0; [...base].forEach((d, i) => { dv1 += Number(d) * (i + 2); }); dv1 = (11 - (dv1 % 11)) % 10; return `23066.${String(n).padStart(6, '0')}/2026-${dv1}${(dv1 * 7 + n) % 10}`; };

export default async function sei(el, ctx, kit) {
  const st = kit.estado.carregar() ?? { unidade: 'PRODEP', seq: 10421, processos: [], atual: null };
  const salvar = () => { kit.estado.salvar(st); missoes.verificar(st); };
  const missoes = kit.missoes([
    { id: 'iniciar', titulo: 'Inicie um processo', descricao: 'Clique em **Iniciar Processo** e escolha o tipo "Pessoal: Férias".', xp: 20, checar: (s) => s.processos.some((p) => p.tipo === 'Pessoal: Férias') },
    { id: 'documento', titulo: 'Inclua um requerimento', descricao: 'No processo, use **Incluir Documento** → Requerimento.', xp: 20, checar: (s) => s.processos.some((p) => p.docs.some((d) => d.tipo === 'Requerimento')) },
    { id: 'assinar', titulo: 'Assine o documento', descricao: 'Documento interno só vale depois de **assinado** (sua senha do SEI).', xp: 20, checar: (s) => s.processos.some((p) => p.docs.some((d) => d.assinado)) },
    { id: 'enviar', titulo: 'Tramite para outra unidade', descricao: 'Use **Enviar Processo** para a PROAD com despacho assinado.', xp: 30, checar: (s) => s.processos.some((p) => p.andamentos.some((a) => a.acao.startsWith('Enviado'))) },
    { id: 'concluir', titulo: 'Conclua um processo', descricao: 'Na unidade, **Concluir Processo** quando não houver mais providências.', xp: 20, checar: (s) => s.processos.some((p) => p.concluido) },
    { id: 'sigilo', titulo: 'Nível de acesso', descricao: 'Inicie um processo **Restrito** (informação pessoal, hipótese legal: art. 31 da LAI).', xp: 20, checar: (s) => s.processos.some((p) => p.acesso === 'Restrito') },
  ]);
  kit.teoria('**SEI** é o sistema de processo eletrônico do governo federal (PEN). Cada processo tem um **NUP** (Número Único de Protocolo) e documentos com **nível de acesso**: Público, Restrito (com hipótese legal) ou Sigiloso.\n\n> [!prova] Lei 9.784/1999\n> Atos devem ser escritos, com data, local e assinatura; o processo tramita entre unidades, que dão andamento em até 5 dias salvo prazo diverso.\n\nDocumento interno só produz efeito após **assinatura eletrônica**; documento externo é digitalizado/anexado.');
  kit.referencia('<dl><dt>Iniciar Processo</dt><dd>cria o NUP</dd><dt>Incluir Documento</dt><dd>internos são redigidos no SEI</dd><dt>Assinar</dt><dd>assinatura eletrônica (Decreto 10.543/2020)</dd><dt>Enviar Processo</dt><dd>tramita para outra unidade</dd><dt>Concluir</dt><dd>encerra na unidade</dd><dt>Bloco de assinatura</dt><dd>coleta assinaturas de outras pessoas</dd></dl>');

  const p = () => st.processos.find((x) => x.nup === st.atual);
  const render = () => {
    const proc = p();
    el.innerHTML = `<div class="janela"><div class="janela-titulo" style="background:#1d4e89;color:#fff">${ic('documento')} SEI! · UFBA <span class="espaco"></span> Unidade: <select id="uni" style="width:auto;min-height:26px;padding:2px 28px 2px 8px">${UNIDADES.map((u) => `<option ${u === st.unidade ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:220px 1fr;min-height:460px">
        <nav class="pilha p" style="padding:10px;border-right:1px solid var(--borda);background:var(--sup-2)"><button class="btn primario peq" data-iniciar>${ic('mais')} Iniciar Processo</button><div class="mini sutil mt1">Controle de processos</div>
          ${st.processos.filter((x) => x.unidade === st.unidade).map((x) => `<button class="arq ${x.nup === st.atual ? 'ativo' : ''}" data-abrir="${x.nup}">${ic(x.concluido ? 'okCirculo' : 'pasta')} <span class="mono" style="font-size:.75rem">${x.nup}</span></button>`).join('') || '<span class="mini sutil">Nenhum processo nesta unidade.</span>'}</nav>
        <section style="padding:14px">${proc ? `<div class="linha entre"><div><div class="mono forte">${proc.nup}</div><div class="pequeno">${esc(proc.tipo)} · <span class="tag ${proc.acesso === 'Público' ? '' : 'aviso'}">${proc.acesso}</span>${proc.concluido ? ' <span class="tag ok">concluído</span>' : ''}</div></div>
            <div class="linha">${proc.unidade === st.unidade && !proc.concluido ? `<button class="btn peq" data-doc>${ic('arquivoTexto')} Incluir Documento</button><button class="btn peq" data-enviar>${ic('enviar')} Enviar Processo</button><button class="btn peq" data-concluir>${ic('ok')} Concluir</button>` : '<span class="mini sutil">Processo em outra unidade ou concluído.</span>'}</div></div>
          <h4>Documentos</h4>${proc.docs.map((d, k) => `<div class="tarefa"><span class="chip-area">${ic('documento')}</span><span style="flex:1"><span class="tt">${esc(d.tipo)} ${d.numero}</span><br><span class="ds">${esc(d.texto.slice(0, 90))}</span></span>${d.assinado ? `<span class="tag ok">${ic('carimbo')} assinado</span>` : TIPOS_DOC[d.tipo] === 'Interno' ? `<button class="btn peq" data-assinar="${k}">Assinar</button>` : ''}</div>`).join('') || '<p class="muted pequeno">Sem documentos.</p>'}
          <h4>Andamento</h4><table class="tabela compacta"><tbody>${proc.andamentos.map((a) => `<tr><td class="nowrap">${a.quando}</td><td>${a.unidade}</td><td>${esc(a.acao)}</td></tr>`).join('')}</tbody></table>` : '<div class="vazio">Selecione ou inicie um processo.</div>'}</section></div></div>`;
    const andar = (proc2, acao) => proc2.andamentos.unshift({ quando: new Date().toLocaleString('pt-BR'), unidade: st.unidade, acao });
    el.querySelector('#uni').onchange = (e) => { st.unidade = e.target.value; st.atual = null; salvar(); render(); };
    el.querySelectorAll('[data-abrir]').forEach((b) => { b.onclick = () => { st.atual = b.dataset.abrir; salvar(); render(); }; });
    el.querySelector('[data-iniciar]').onclick = () => {
      const m = modal({ titulo: 'Iniciar Processo', corpo: `<form class="pilha" id="fi"><label class="campo">Tipo<select name="tipo">${TIPOS_PROC.map((t) => `<option>${t}</option>`).join('')}</select></label><label class="campo">Especificação<input name="esp" required maxlength="100"></label><label class="campo">Nível de acesso<select name="acesso"><option>Público</option><option>Restrito</option><option>Sigiloso</option></select></label></form>`, rodape: '<button class="btn primario" form="fi">Salvar</button>' });
      m.el.querySelector('form').onsubmit = (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const n = nup(++st.seq); const novo = { nup: n, tipo: f.tipo, esp: f.esp, acesso: f.acesso, unidade: st.unidade, docs: [], andamentos: [], concluido: false }; andar(novo, 'Processo gerado'); st.processos.unshift(novo); st.atual = n; m.fechar(); salvar(); render(); };
    };
    el.querySelector('[data-doc]')?.addEventListener('click', () => {
      const m = modal({ titulo: 'Incluir Documento', corpo: `<form class="pilha" id="fd"><label class="campo">Tipo<select name="tipo">${Object.keys(TIPOS_DOC).map((t) => `<option>${t}</option>`).join('')}</select></label><label class="campo">Texto<textarea name="texto" required rows="6">Senhor(a) Diretor(a),\n\n</textarea></label></form>`, rodape: '<button class="btn primario" form="fd">Salvar</button>' });
      m.el.querySelector('form').onsubmit = (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const proc2 = p(); proc2.docs.push({ tipo: f.tipo, texto: f.texto, numero: String(1000 + st.processos.reduce((s, x) => s + x.docs.length, 0)), assinado: TIPOS_DOC[f.tipo] === 'Externo' }); andar(proc2, `Documento ${f.tipo} incluído`); m.fechar(); salvar(); render(); };
    });
    el.querySelectorAll('[data-assinar]').forEach((b) => { b.onclick = () => { const proc2 = p(); proc2.docs[b.dataset.assinar].assinado = true; andar(proc2, `Assinado ${proc2.docs[b.dataset.assinar].tipo} por ${ctx.sessao.conta?.nome ?? 'Visitante'}`); toast('Documento assinado eletronicamente.', { tipo: 'ok' }); salvar(); render(); }; });
    el.querySelector('[data-enviar]')?.addEventListener('click', () => {
      const proc2 = p();
      if (!proc2.docs.some((d) => d.assinado)) return toast('Inclua e assine ao menos um documento antes de enviar.', { tipo: 'erro' });
      const m = modal({ titulo: 'Enviar Processo', corpo: `<form id="fe"><label class="campo">Unidade de destino<select name="u">${UNIDADES.filter((u) => u !== st.unidade).map((u) => `<option>${u}</option>`).join('')}</select></label></form>`, rodape: '<button class="btn primario" form="fe">Enviar</button>' });
      m.el.querySelector('form').onsubmit = (e) => { e.preventDefault(); const u = new FormData(e.target).get('u'); andar(proc2, `Enviado para ${u}`); proc2.unidade = u; m.fechar(); toast(`Processo enviado para ${u}. Troque a unidade para dar andamento.`); salvar(); render(); };
    });
    el.querySelector('[data-concluir]')?.addEventListener('click', () => { const proc2 = p(); proc2.concluido = true; andar(proc2, 'Conclusão do processo na unidade'); salvar(); render(); });
  };
  kit.aoReiniciar(() => { kit.estado.limpar(); location.reload(); });
  render();
}

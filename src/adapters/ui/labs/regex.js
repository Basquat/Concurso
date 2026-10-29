// Laboratório de expressões regulares: desafios corrigidos com o RegExp real do navegador e área de exploração livre.
import { esc, ic } from '../dom.js';
import { DESAFIOS, avaliar, ocorrencias } from '../../../domain/regex.js';

export default async function regex(el, ctx, kit) {
  const st = { atual: DESAFIOS[0].id, padroes: {}, flags: '', livre: 'Contato: ana.souza@ufba.br, (71) 3283-6000\nProcesso 23066.012345/2026-11 aberto em 20/12/2026\nERROR 500 no servidor 10.0.0.12', livreRe: '\\d{2}/\\d{2}/\\d{4}', ...(kit.estado.carregar() ?? {}) };
  const salvar = () => kit.estado.salvar(st);
  const missoes = kit.missoes(DESAFIOS.map((d) => ({ id: d.id, titulo: d.titulo, descricao: d.descricao, dica: d.dica, xp: 20, checar: (s) => avaliar(s.padroes[d.id] ?? '', s.flags, d).ok })));
  kit.referencia('<dl><dt>\\d \\w \\s</dt><dd>dígito, letra/dígito/_, espaço</dd><dt>. </dt><dd>qualquer caractere</dd><dt>[abc] [^abc]</dt><dd>conjunto / negação</dd><dt>* + ? {n,m}</dt><dd>repetições</dd><dt>^ $</dt><dd>início e fim</dd><dt>( ) |</dt><dd>grupo e alternativa</dd><dt>(?=…)</dt><dd>lookahead</dd><dt>\\. \\( \\/</dt><dd>escapar caracteres especiais</dd></dl>');
  kit.teoria('Expressões regulares descrevem **padrões de texto**. São usadas para validar formulários, buscar em logs (`grep -E`), extrair dados e fazer substituições em editores e linguagens. Aqui o motor é o **RegExp real do JavaScript**: o que funcionar aqui funciona em qualquer navegador.');
  kit.aoReiniciar(() => { kit.estado.limpar(); Object.assign(st, { padroes: {}, flags: '' }); desenhar(); });

  function desenhar() {
    const d = DESAFIOS.find((x) => x.id === st.atual) ?? DESAFIOS[0];
    const r = avaliar(st.padroes[d.id] ?? '', st.flags, d);
    el.innerHTML = `<div class="pilha" style="max-width:960px;margin:0 auto">
      <div class="filtros">${DESAFIOS.map((x) => `<button class="filtro" type="button" data-d="${x.id}" aria-pressed="${x.id === d.id}">${avaliar(st.padroes[x.id] ?? '', st.flags, x).ok ? ic('okCirculo') : ''} ${esc(x.titulo)}</button>`).join('')}</div>
      <section class="card pilha"><div><h2 class="mt0 mb0" style="font-size:1.1rem">${esc(d.titulo)}</h2><p class="muted mb0">${esc(d.descricao)}</p></div>
        <div class="linha nw"><span class="mono muted">/</span><input id="padrao" class="mono" style="flex:1" spellcheck="false" autocomplete="off" placeholder="sua expressão" value="${esc(st.padroes[d.id] ?? '')}"><span class="mono muted">/</span><input id="flags" class="mono" style="width:70px" placeholder="flags" value="${esc(st.flags)}" aria-label="Flags"></div>
        ${r.erro ? `<div class="aviso erro">${esc(r.erro)}</div>` : ''}
        <table class="tabela compacta"><thead><tr><th>Texto</th><th>Esperado</th><th>Resultado</th></tr></thead><tbody>${r.linhas.map((l) => `<tr><td class="mono">${esc(l.texto)}</td><td>${l.deve ? 'casar' : 'recusar'}</td><td>${l.casou === l.deve ? `<span class="ok forte">${ic('ok')} ok</span>` : `<span class="erro forte">${ic('x')} ${l.casou ? 'casou' : 'não casou'}</span>`}</td></tr>`).join('')}</tbody></table>
        ${r.ok ? '<div class="aviso ok">Todos os casos conferem!</div>' : ''}</section>
      <section class="card pilha"><h2 class="mt0 mb0" style="font-size:1.05rem">${ic('busca')} Exploração livre</h2>
        <input id="livreRe" class="mono" spellcheck="false" value="${esc(st.livreRe)}" aria-label="Expressão livre">
        <textarea id="livre" class="mono" rows="5" spellcheck="false" aria-label="Texto de teste">${esc(st.livre)}</textarea><div id="achados" class="pequeno"></div></section></div>`;
    el.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { st.atual = b.dataset.d; salvar(); desenhar(); }));
    const atualizar = () => { st.padroes[d.id] = el.querySelector('#padrao').value; st.flags = el.querySelector('#flags').value; salvar(); missoes.verificar(st); };
    el.querySelector('#padrao').addEventListener('change', () => { atualizar(); desenhar(); el.querySelector('#padrao').focus(); });
    el.querySelector('#flags').addEventListener('change', () => { atualizar(); desenhar(); });
    const livre = () => {
      st.livreRe = el.querySelector('#livreRe').value; st.livre = el.querySelector('#livre').value; salvar();
      let html;
      try {
        const oc = ocorrencias(st.livreRe, st.flags, st.livre);
        html = oc.length ? `${oc.length} ocorrência(s): ${oc.map((o) => `<code>${esc(o.texto)}</code>`).join(' ')}` : 'Nenhuma ocorrência.';
      } catch (e) { html = `<span class="erro">${esc(e.message)}</span>`; }
      el.querySelector('#achados').innerHTML = html;
    };
    el.querySelector('#livreRe').addEventListener('input', livre);
    el.querySelector('#livre').addEventListener('input', livre);
    livre();
  }
  desenhar();
  missoes.verificar(st);
}

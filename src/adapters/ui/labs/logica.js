// Laboratório de lógica: tabela-verdade de qualquer proposição e verificador de equivalências.
import { esc, ic } from '../dom.js';
import { tabela, equivalentes } from '../../../domain/logica.js';

const VF = (b) => `<span class="${b ? 'ok' : 'erro'} forte">${b ? 'V' : 'F'}</span>`;

export default async function logica(el, ctx, kit) {
  const st = kit.estado.carregar() ?? { expr: 'p -> q', e1: '~(p ^ q)', e2: '~p v ~q', feitos: {} };
  const salvar = () => kit.estado.salvar(st);
  const missoes = kit.missoes([
    { id: 'tabela', titulo: 'Primeira tabela-verdade', descricao: 'Gere a tabela de uma proposição com 2 variáveis.', xp: 20, checar: (s) => s.feitos.tabela2 },
    { id: 'taut', titulo: 'Encontre uma tautologia', descricao: 'Ex.: `p v ~p` ou `(p ^ q) -> p`.', xp: 30, checar: (s) => s.feitos.tautologia },
    { id: 'morgan', titulo: 'Leis de De Morgan', descricao: 'Prove que `~(p v q)` equivale a `~p ^ ~q`.', xp: 30, checar: (s) => s.feitos.morgan },
    { id: 'contra', titulo: 'Contrapositiva', descricao: 'Prove que `p -> q` equivale a `~q -> ~p`.', xp: 30, checar: (s) => s.feitos.contra },
    { id: 'tres', titulo: 'Três variáveis', descricao: 'Gere uma tabela com p, q e r (8 linhas).', xp: 30, checar: (s) => s.feitos.tres },
  ]);
  kit.referencia('<dl><dt>~ ¬</dt><dd>não</dd><dt>^ ∧ &</dt><dd>e</dd><dt>v ∨ |</dt><dd>ou</dd><dt>xor</dt><dd>ou exclusivo</dd><dt>-> →</dt><dd>se… então</dd><dt><-> ↔</dt><dd>se e somente se</dd></dl><p class="mini sutil">Precedência: ~ antes de ^, antes de v, antes de ->, antes de <->. Use parênteses.</p>');

  const render = () => {
    let tab = '';
    try {
      const t = tabela(st.expr);
      if (t.vars.length === 2) st.feitos.tabela2 = true;
      if (t.vars.length >= 3) st.feitos.tres = true;
      if (t.tipo === 'tautologia') st.feitos.tautologia = true;
      tab = `<div class="rolagem"><table class="tabela compacta"><thead><tr>${t.vars.map((v) => `<th>${v}</th>`).join('')}<th>${esc(st.expr)}</th></tr></thead><tbody>${t.linhas.map((l) => `<tr>${t.vars.map((v) => `<td>${VF(l.val[v])}</td>`).join('')}<td>${VF(l.r)}</td></tr>`).join('')}</tbody></table></div><p>Classificação: <strong>${t.tipo}</strong></p>`;
    } catch (e) { tab = `<div class="aviso erro">${esc(e.message)}</div>`; }
    let eq = '';
    try {
      const ok = equivalentes(st.e1, st.e2);
      const n = (s) => s.replace(/\s/g, '');
      if (ok && [[n('~(p v q)'), n('~p ^ ~q')], [n('~(p ^ q)'), n('~p v ~q')]].some(([a, b]) => (n(st.e1) === a && n(st.e2) === b) || (n(st.e1) === b && n(st.e2) === a))) st.feitos.morgan = true;
      if (ok && [n(st.e1), n(st.e2)].sort().join() === [n('p -> q'), n('~q -> ~p')].sort().join()) st.feitos.contra = true;
      eq = `<div class="aviso ${ok ? 'ok' : 'erro'}">${ok ? 'Equivalentes: mesma tabela-verdade.' : 'NÃO são equivalentes.'}</div>`;
    } catch (e) { eq = `<div class="aviso erro">${esc(e.message)}</div>`; }
    salvar();
    missoes.verificar(st);
    el.innerHTML = `<div class="dividido"><section class="card"><h3 class="mt0">${ic('grade')} Tabela-verdade</h3><input id="expr" class="mono" value="${esc(st.expr)}"><div class="mt2">${tab}</div></section>
      <section class="card"><h3 class="mt0">${ic('balanca')} Equivalência</h3><input id="e1" class="mono" value="${esc(st.e1)}"><p class="centro mb1 mt1">≡ ?</p><input id="e2" class="mono" value="${esc(st.e2)}"><div class="mt2">${eq}</div></section></div>`;
    for (const k of ['expr', 'e1', 'e2']) {
      const i = el.querySelector(`#${k}`);
      i.addEventListener('change', () => { st[k] = i.value; render(); });
    }
  };
  render();
}

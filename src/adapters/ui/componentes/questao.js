// Cartão de questão reutilizado em Questões, Revisões, Aulas e Simulados.
// modo 'pratica': corrige na hora e mostra o comentário; modo 'prova': só registra a escolha.
import { esc, ic } from '../dom.js';
import { markdown, inline } from '../../../domain/markdown.js';
import { AREAS } from '../../../domain/areas.js';

const LETRAS = 'ABCDEFGH';
const DIF = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' };

export function htmlQuestao(q, { numero, total, escolha = null, revelada = false, nome = `q-${q.id}` } = {}) {
  const area = AREAS[q.area];
  return `<article class="questao" data-id="${esc(q.id)}">
    <div class="linha entre mb2"><div class="linha" style="gap:8px">
      ${numero ? `<span class="tag prim">Questão ${numero}${total ? ` de ${total}` : ''}</span>` : ''}
      <span class="tag" style="color:${area?.cor ?? 'inherit'}">${esc(q.disciplina || area?.nome || q.area)}</span>
      ${q.assunto ? `<span class="tag">${esc(q.assunto)}</span>` : ''}
      <span class="tag">${DIF[q.dificuldade] ?? 'Média'}</span>
    </div><span class="mini sutil mono">${esc(q.id)}</span></div>
    <div class="enunciado md">${markdown(q.enunciado)}</div>
    <ul class="alternativas" role="radiogroup" aria-label="Alternativas">${q.alternativas.map((a, k) => {
      const estado = revelada ? (k === q.correta ? 'certa' : k === escolha ? 'errada' : '') : '';
      return `<li><label class="${estado}"><input type="radio" name="${esc(nome)}" value="${k}" ${k === escolha ? 'checked' : ''} ${revelada ? 'disabled' : ''}><span class="letra">${q.tipo === 'ce' ? a[0] : LETRAS[k]}</span><span>${inline(a)}</span></label></li>`;
    }).join('')}</ul>
    <div class="acoes-questao linha mt2"></div>
    ${revelada ? comentario(q, escolha) : ''}
  </article>`;
}

function comentario(q, escolha) {
  const ok = escolha === q.correta;
  return `<div class="explicacao">
    <div class="linha forte ${ok ? 'ok' : 'erro'}">${ic(ok ? 'okCirculo' : 'xCirculo')} ${escolha == null ? 'Não respondida' : ok ? 'Você acertou' : 'Você errou'} · gabarito: ${q.tipo === 'ce' ? q.alternativas[q.correta] : LETRAS[q.correta]}</div>
    ${q.explicacao ? `<div class="md mt1">${markdown(q.explicacao)}</div>` : ''}
    ${q.referencia ? `<p class="mini sutil mb0 mt1">${ic('livro')} ${esc(q.referencia)}</p>` : ''}
    ${q.aula ? `<p class="mini mb0 mt1"><a href="#/aulas/${esc(q.aula)}">${ic('slides')} Ver a aula deste assunto</a></p>` : ''}
  </div>`;
}

/**
 * Monta uma questão interativa no modo prática.
 * @returns {Promise<{ correta: boolean, escolha: number }>} resolve quando a pessoa responde.
 */
export function praticar(el, q, { servico, numero, total, proxima = 'Próxima', aoProxima }) {
  return new Promise((resolver) => {
    el.innerHTML = htmlQuestao(q, { numero, total });
    const acoes = el.querySelector('.acoes-questao');
    acoes.innerHTML = `<button class="btn primario" type="button" data-responder disabled>Responder</button><span class="mini sutil">Atalhos: teclas 1–5 escolhem, Enter responde.</span>`;
    const btn = acoes.querySelector('[data-responder]');
    let escolha = null;
    el.querySelectorAll('input[type=radio]').forEach((r) => r.addEventListener('change', () => { escolha = Number(r.value); btn.disabled = false; }));
    const responder = () => {
      if (escolha == null) return;
      const correta = servico.responder(q, escolha);
      el.innerHTML = htmlQuestao(q, { numero, total, escolha, revelada: true });
      const a = el.querySelector('.acoes-questao');
      if (aoProxima) {
        a.innerHTML = `<button class="btn primario" type="button" data-prox>${esc(proxima)} ${ic('seta')}</button>`;
        a.querySelector('[data-prox]').onclick = aoProxima;
        a.querySelector('[data-prox]').focus();
      }
      teclas.parar();
      resolver({ correta, escolha });
    };
    btn.onclick = responder;
    const teclas = atalhosQuestao(el, q, (k) => { const r = el.querySelectorAll('input[type=radio]')[k]; if (r) { r.checked = true; r.dispatchEvent(new Event('change')); } }, responder);
  });
}

export function atalhosQuestao(el, q, escolher, confirmar) {
  const f = (e) => {
    if (!el.isConnected) return parar();
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && document.activeElement.type !== 'radio') return;
    if (document.querySelector('dialog[open]')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= q.alternativas.length) { e.preventDefault(); escolher(n - 1); }
    const letra = 'abcdefgh'.indexOf(e.key.toLowerCase());
    if (e.key.length === 1 && letra >= 0 && letra < q.alternativas.length && !e.ctrlKey && !e.metaKey) { e.preventDefault(); escolher(letra); }
    if (e.key === 'Enter') { e.preventDefault(); confirmar(); }
  };
  const parar = () => removeEventListener('keydown', f);
  addEventListener('keydown', f);
  return { parar };
}

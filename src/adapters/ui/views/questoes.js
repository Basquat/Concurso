import { esc } from '../dom.js';
import { filtrar, embaralhar } from '../../../domain/quiz.js';

const LETRAS = 'ABCDE';

export const origemTag = (q) => (q.origem?.tipo === 'oficial'
  ? `<span class="tag ok">Oficial · ${esc(q.origem.banca)} · ${esc(q.origem.concurso)} ${esc(q.origem.ano)} · Q${esc(q.origem.numero)}</span>`
  : '<span class="tag" title="Questão escrita para esta plataforma; não pertence a nenhuma banca">Questão autoral</span>');

export default async function questoes(el, { servico, conteudo }, { params }) {
  const [todas, trilhas] = await Promise.all([conteudo.questoes(), conteudo.trilhas()]);
  const filtro = { area: params.get('area') || '', disciplina: params.get('disciplina') || '', somenteErros: params.get('erros') === '1' };
  let fila = [];
  let i = 0;

  const disciplinas = () => [...new Set(todas.filter((q) => !filtro.area || q.area === filtro.area).map((q) => q.disciplina))].sort();

  function montarFila() {
    fila = embaralhar(filtrar(todas, { ...filtro, respostas: servico.progresso.respostas }));
    i = 0;
  }

  function render() {
    el.innerHTML = `
      <h1>Questões</h1>
      <form class="linha card" id="filtros" style="margin-bottom:14px">
        <label class="campo">Área<select name="area"><option value="">Todas</option>${trilhas.map((t) => `<option value="${t.id}" ${t.id === filtro.area ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></label>
        <label class="campo">Disciplina<select name="disciplina"><option value="">Todas</option>${disciplinas().map((d) => `<option ${d === filtro.disciplina ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
        <label class="linha pequeno" style="align-self:end"><input type="checkbox" name="erros" ${filtro.somenteErros ? 'checked' : ''}> Só as que errei</label>
        <span class="muted pequeno" style="align-self:end">${fila.length} questão(ões)</span>
      </form>
      <div id="q"></div>`;
    el.querySelector('#filtros').addEventListener('change', (e) => {
      const f = new FormData(e.currentTarget);
      filtro.area = f.get('area');
      filtro.disciplina = e.target.name === 'area' ? '' : f.get('disciplina');
      filtro.somenteErros = f.get('erros') === 'on';
      montarFila();
      render();
    });
    mostrar();
  }

  function mostrar() {
    const box = el.querySelector('#q');
    if (!fila.length) {
      box.innerHTML = `<div class="callout">${filtro.somenteErros ? 'Nenhum erro pendente nesse filtro. 🎉' : 'Nenhuma questão nesse filtro.'}</div>`;
      return;
    }
    if (i >= fila.length) {
      box.innerHTML = `<div class="callout okc">Você passou por todas as ${fila.length} questões deste filtro. <button class="btn peq" id="denovo">Embaralhar e recomeçar</button></div>`;
      box.querySelector('#denovo').onclick = () => { montarFila(); render(); };
      return;
    }
    const q = fila[i];
    box.innerHTML = `<article class="card quiz">
      <div class="linha entre pequeno muted"><span>${i + 1} de ${fila.length} · ${esc(q.disciplina)} › ${esc(q.assunto)}</span>${origemTag(q)}</div>
      <p style="margin-top:10px;white-space:pre-line">${esc(q.enunciado)}</p>
      <div>${q.alternativas.map((a, k) => `<button class="alt" data-k="${k}"><b>${LETRAS[k]}</b>${esc(a)}</button>`).join('')}</div>
      <div id="fb"></div>
    </article>`;
    box.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => responder(q, Number(b.dataset.k))));
  }

  function responder(q, k) {
    const ok = servico.responder(q, k);
    const box = el.querySelector('#q');
    box.querySelectorAll('.alt').forEach((b) => {
      b.disabled = true;
      const kk = Number(b.dataset.k);
      if (kk === q.correta) b.classList.add('certa');
      else if (kk === k) b.classList.add('errada');
    });
    box.querySelector('#fb').innerHTML = `<div class="callout ${ok ? 'okc' : 'err'}" style="margin-top:10px">
      <strong>${ok ? 'Correto! +10 XP' : `Resposta: ${LETRAS[q.correta]}`}</strong>
      <p style="margin:6px 0 0">${esc(q.explicacao)}</p>
      ${q.referencia ? `<p class="pequeno muted" style="margin:6px 0 0">Base: ${esc(q.referencia)}</p>` : ''}
    </div>
    <div class="linha" style="margin-top:10px"><button class="btn primario" id="prox">Próxima →</button></div>`;
    const prox = box.querySelector('#prox');
    prox.onclick = () => { i++; mostrar(); };
    prox.focus();
  }

  montarFila();
  render();
}

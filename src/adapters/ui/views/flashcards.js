// Flashcards por aula: estudar cartões novos e vencidos de um baralho, com revisão espaçada.
import { esc, ic, cabecalho, diaIso, barra, pct } from '../dom.js';
import { AREAS } from '../../../domain/areas.js';
import { cartoesPorId, mostrarCartao } from './revisoes.js';

export default async function flashcards(el, { conteudo, servico, casca }) {
  casca?.definirTitulo('Flashcards');
  const { aulas } = await conteudo.indice();
  const baralhos = aulas.filter((a) => a.cartoes);

  const lista = () => {
    const srs = servico.revisoes;
    const hoje = diaIso();
    el.innerHTML = `${cabecalho({ sobre: 'Estudar', titulo: 'Flashcards', texto: 'Perguntas rápidas tiradas das aulas. Vire, avalie com honestidade e o sistema agenda a próxima revisão.' })}
      <div class="grid">${baralhos.map((a) => {
        const ids = Array.from({ length: a.cartoes }, (_, k) => `f:${a.id}:${k}`);
        const vistos = ids.filter((i) => srs[i]).length;
        const venc = ids.filter((i) => srs[i] && srs[i].v <= hoje).length;
        return `<button class="card cartao-lab interativo" type="button" data-baralho="${esc(a.id)}" style="text-align:left">
          <div class="linha entre"><span class="chip-area" style="--cor:${AREAS[a.area]?.cor}">${ic('cartoes')}</span>${venc ? `<span class="tag aviso">${venc} para hoje</span>` : vistos === ids.length ? `<span class="tag ok">${ic('ok')} em dia</span>` : `<span class="tag">${ids.length - vistos} novos</span>`}</div>
          <h3>${esc(a.titulo)}</h3><p>${esc(a.disciplina)}</p>${barra(pct(vistos, ids.length), 'fina')}<span class="mini sutil">${vistos} de ${ids.length} já estudados</span></button>`;
      }).join('') || `<div class="vazio">${ic('cartoes')}<p>Nenhum baralho ainda.</p></div>`}</div>`;
    el.querySelectorAll('[data-baralho]').forEach((b) => b.addEventListener('click', () => estudar(b.dataset.baralho)));
  };

  const estudar = async (aulaId) => {
    const a = baralhos.find((x) => x.id === aulaId);
    const ids = Array.from({ length: a.cartoes }, (_, k) => `f:${aulaId}:${k}`);
    const mapa = await cartoesPorId(conteudo, ids);
    const hoje = diaIso();
    const srs = servico.revisoes;
    const fila = [...ids.filter((i) => srs[i] && srs[i].v <= hoje), ...ids.filter((i) => !srs[i])];
    let k = 0;
    const prox = () => {
      if (k >= fila.length) {
        el.innerHTML = `${cabecalho({ voltar: ['#/flashcards', 'Flashcards'], titulo: a.titulo })}<div class="vazio">${ic('okCirculo')}<p>${fila.length ? 'Baralho estudado! Os cartões voltarão nas revisões.' : 'Nada pendente neste baralho hoje.'}</p><div class="linha" style="justify-content:center"><button class="btn" type="button" data-todos>Rever todos mesmo assim</button><button class="btn primario" type="button" data-lista>Outros baralhos</button></div></div>`;
        el.querySelector('[data-lista]').onclick = lista;
        el.querySelector('[data-todos]').onclick = () => { fila.splice(0, fila.length, ...ids); k = 0; prox(); };
        return;
      }
      el.innerHTML = `<div class="linha entre mb2"><button class="btn fantasma" type="button" data-sair>${ic('esq')} Baralhos</button><span class="pequeno muted">${k + 1} de ${fila.length}</span></div><div id="c"></div>`;
      el.querySelector('[data-sair]').onclick = lista;
      mostrarCartao(el.querySelector('#c'), mapa.get(fila[k]), { aoAvaliar: (v) => { servico.avaliarCartao(fila[k], v); k++; prox(); } });
    };
    prox();
  };
  lista();
}

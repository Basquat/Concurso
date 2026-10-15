import { esc, cabecalho } from '../dom.js';

export default async function aulas(el, { servico }) {
  const { aulas: lista } = await fetch('data/aulas.json').then((r) => r.json());
  const meu = servico.progresso.alvo?.cargo;
  let soMeu = !!meu;
  const render = () => {
    const vis = lista.filter((a) => !soMeu || a.cargos.includes(meu) || a.cargos.includes('todos'));
    el.innerHTML = `<div class="conteudo">${cabecalho({ sobre: 'Aulas', titulo: 'Slides e videoaulas', texto: 'Cada aula junta slides, vídeos do YouTube tocados aqui dentro, questões da disciplina e o laboratório para praticar.' })}
      ${meu ? `<label class="opcao" style="margin-bottom:12px"><input type="checkbox" ${soMeu ? 'checked' : ''} data-filtro> Só aulas do meu cargo (${esc(meu)})</label>` : ''}
      <div class="grid">${vis.map((a) => `<a class="card" href="#/aulas/${a.id}"><span class="tag">${esc(a.disciplina)}</span><h3 style="margin-top:8px">${esc(a.titulo)}</h3><p class="pequeno muted">${a.slides.length} slides${a.labs.length ? ` · prática: ${a.labs.join(', ')}` : ''}</p></a>`).join('')}</div></div>`;
    el.querySelector('[data-filtro]')?.addEventListener('change', (e) => { soMeu = e.target.checked; render(); });
  };
  render();
}

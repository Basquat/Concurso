import { cabecalho, ic } from '../dom.js';

export default async function pagina(el) {
  el.innerHTML = cabecalho({ sobre: 'Em construção', titulo: 'Chegando na 2.0' }) + `<div class="vazio">${ic('brilho')}<p>Esta área está sendo construída.</p></div>`;
}

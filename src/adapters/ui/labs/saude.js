import { gerarCalculo, conferirCalculo, MISSOES_SAUDE } from '../../../domain/saude/calculos.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const TIPOS = [
  ['gotas', 'Gotejamento — macrogotas', 'gotas/min = V(mL) ÷ (T(h) × 3)'],
  ['microgotas', 'Gotejamento — microgotas', 'microgotas/min = V(mL) ÷ T(h)'],
  ['dose', 'Volume a aspirar (regra de três)', 'mL = dose prescrita × mL da apresentação ÷ mg da apresentação'],
];
const fmt = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export default async function saude(el, { servico, labs }) {
  let st = labs.carregar('saude') ?? { acertos: {} };
  const atuais = {};
  el.innerHTML = cabecalhoLab('saude') + `<div class="callout aviso" style="margin-bottom:14px">Simulação educacional com valores fictícios. Na prática clínica siga o protocolo da instituição, a prescrição e a dupla checagem.</div>
    <div class="split"><div class="pilha">${TIPOS.map(([t, nome, formula]) => `<section class="card pilha" data-t="${t}">
      <div class="linha entre"><h3 style="margin:0">${esc(nome)}</h3><span class="tag" data-placar></span></div>
      <p class="pequeno muted" style="margin:0">Fórmula: <span class="mono">${esc(formula)}</span></p>
      <p data-enunc style="margin:0"></p>
      <div class="linha"><input data-resp inputmode="decimal" placeholder="Sua resposta" style="width:140px"><span data-un class="muted"></span><button class="btn primario" data-conf>Conferir</button><button class="btn" data-novo>Outro</button></div>
      <div data-fb></div></section>`).join('')}</div><aside class="card" id="missoes"></aside></div>`;
  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'saude', missoes: MISSOES_SAUDE, servico });

  const novo = (t) => {
    const sec = el.querySelector(`[data-t="${t}"]`);
    atuais[t] = gerarCalculo(t);
    sec.querySelector('[data-enunc]').textContent = atuais[t].enunciado;
    sec.querySelector('[data-un]').textContent = atuais[t].unidade;
    sec.querySelector('[data-resp]').value = '';
    sec.querySelector('[data-fb]').innerHTML = '';
    sec.querySelector('[data-placar]').textContent = `${st.acertos[t] ?? 0} acerto(s)`;
  };

  for (const [t] of TIPOS) {
    const sec = el.querySelector(`[data-t="${t}"]`);
    const conferir = () => {
      const ex = atuais[t];
      const ok = conferirCalculo(ex, sec.querySelector('[data-resp]').value);
      const exato = fmt(ex.resposta);
      const arred = t === 'dose' ? exato : String(Math.round(ex.resposta));
      sec.querySelector('[data-fb]').innerHTML = `<div class="callout ${ok ? 'okc' : 'err'} pequeno"><strong>${ok ? 'Correto!' : 'Ainda não.'}</strong> Resultado: ${esc(exato)} ${esc(ex.unidade)}${t === 'dose' ? '' : ` → arredonde para ${arred} (não existe fração de gota)`}.</div>`;
      if (ok) {
        st.acertos[t] = (st.acertos[t] ?? 0) + 1;
        labs.salvar('saude', st);
        painel.verificar((m) => m.check(st));
        setTimeout(() => novo(t), 1200);
      }
    };
    sec.querySelector('[data-conf]').onclick = conferir;
    sec.querySelector('[data-resp]').addEventListener('keydown', (e) => { if (e.key === 'Enter') conferir(); });
    sec.querySelector('[data-novo]').onclick = () => novo(t);
    novo(t);
  }
  confirmarReinicio(el, () => { labs.limpar('saude'); st = { acertos: {} }; TIPOS.forEach(([t]) => novo(t)); });
  painel.verificar((m) => m.check(st));
}

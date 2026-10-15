import { esc, barra, pct, cabecalho, diasAte } from '../dom.js';
import { nivel, sequencia } from '../../../domain/gamification.js';
import { mapear } from '../../../domain/cobertura.js';
import { LABS } from '../labs/registro.js';

export const cargoAlvo = (p, concurso) => (p.alvo?.concurso === concurso.id ? concurso.cargos.find((c) => c.codigo === p.alvo.cargo) ?? null : null);

export function seletorCargo(concurso, atual = '') {
  const grupo = (n, rot) => `<optgroup label="${rot}">${concurso.cargos.filter((c) => c.nivel === n).map((c) => `<option value="${esc(c.codigo)}" ${c.codigo === atual ? 'selected' : ''}>${esc(c.codigo)} – ${esc(c.nome)}</option>`).join('')}</optgroup>`;
  return `<select name="cargo" required><option value="">Selecione o cargo</option>${grupo('D', 'Nível médio (classe D)')}${grupo('E', 'Nível superior (classe E)')}</select>`;
}

export function labsDoCargo(concurso, cargo) {
  const labs = new Set();
  for (const pid of cargo.programas) for (const b of concurso.programas[pid].blocos) for (const it of b.itens) mapear(`${b.titulo ?? ''} ${it}`).labs.forEach((l) => labs.add(l));
  return [...labs];
}

function painelProva(concurso, cargo) {
  const dias = diasAte('20/12/2026');
  const obj = cargo.objetiva;
  const estrutura = obj ? `<div class="estrutura">${obj.map((d) => {
    const pontos = d.questoes * d.valor;
    return `<div class="barra-peso"><span>${esc(d.disciplina)}</span><span class="muted pequeno">${d.questoes} questões × ${d.valor} = ${pontos} pts</span>${barra(pct(pontos, 60))}</div>`;
  }).join('')}</div>` : '<p>Prova prática única (100 pontos). Veja o repertório no conteúdo do cargo.</p>';
  const labs = labsDoCargo(concurso, cargo);
  return `<section class="painel" aria-labelledby="titulo-prova">
    <div class="linha entre" style="align-items:flex-start">
      <div><span class="sobretitulo">Sua prova · ${esc(concurso.banca)}</span>
        <h2 id="titulo-prova" style="margin:0">${esc(cargo.codigo)} – ${esc(cargo.nome)}</h2>
        <p class="muted pequeno" style="margin:4px 0 0">UFBA 2026 · nível ${cargo.nivel === 'D' ? 'médio' : 'superior'} · ${esc(cargo.campus)} · ${cargo.vagas.listaUnica ? `${cargo.vagas.total} vaga(s), lista única` : `${cargo.vagas.total} vaga(s)`}</p></div>
      ${cargo.tabela === '10.8' ? '' : `<div style="text-align:right"><div class="contagem">${dias > 0 ? dias : 0}</div><div class="pequeno muted">dias até 20/12/2026</div></div>`}
    </div>
    <h3 style="margin-top:16px">Peso na prova objetiva</h3>
    ${estrutura}
    <p class="pequeno muted" style="margin-top:8px">Aprovação: 50% dos pontos da objetiva, sem zerar nenhuma área. Fases: ${cargo.fases.map((f) => ({ objetiva: 'objetiva', redacao: 'redação', titulos: 'títulos', oral: 'oral/prática', pratica: 'prática' }[f])).join(', ')}.</p>
    <div class="linha" style="margin-top:12px">
      <a class="botao" href="#/concursos/${concurso.id}/cargo/${encodeURIComponent(cargo.codigo)}">Conteúdo do cargo</a>
      <a class="botao sec" href="#/concursos/${concurso.id}/matriz?cargo=${encodeURIComponent(cargo.codigo)}">Matriz de cobertura</a>
      <button class="botao texto" type="button" data-trocar>Trocar cargo</button>
    </div>
    ${labs.length ? `<h3 style="margin-top:18px">Laboratórios ligados ao seu conteúdo</h3><ul class="lista">${labs.map((id) => `<li><a class="bloco" href="#/lab/${id}"><span class="titulo"><span class="sigla">${LABS[id].sigla}</span>${esc(LABS[id].nome)}</span><span class="meta">${esc(LABS[id].resumo)}</span></a></li>`).join('')}</ul>` : ''}
  </section>`;
}

export default async function inicio(el, { servico, conteudo }) {
  const [trilhas, questoes, ufba] = await Promise.all([conteudo.trilhas(), conteudo.questoes(), conteudo.concurso('ufba-2026')]);

  const render = (trocando = false) => {
    const p = servico.progresso;
    const n = nivel(p.xp);
    const resp = Object.values(p.respostas);
    const erros = resp.filter((r) => r.ultima === false).length;
    const cargo = trocando ? null : cargoAlvo(p, ufba);

    const escolher = `<section class="painel" aria-labelledby="titulo-cargo">
      <span class="sobretitulo">Concurso UFBA 2026 · Edital nº 007/2026</span>
      <h2 id="titulo-cargo" style="margin-top:0">Para qual cargo você vai prestar?</h2>
      <p class="muted">A trilha, o peso das disciplinas e a matriz de cobertura passam a seguir o conteúdo do seu cargo no edital.</p>
      <form class="linha" data-form-cargo>${seletorCargo(ufba, p.alvo?.cargo)}<button class="botao" type="submit">Definir meu cargo</button></form>
    </section>`;

    el.innerHTML = `<div class="conteudo">
      ${cabecalho({ sobre: 'Plano de estudo', titulo: 'Estude pelo edital, pratique como no trabalho', texto: 'Conteúdo programático oficial, questões comentadas, simulados e laboratórios que reproduzem ferramentas profissionais. Tudo roda no navegador, sem cadastro.' })}
      <dl class="numeros">
        <div><dt>Nível</dt><dd>${n.numero}</dd></div>
        <div><dt>XP</dt><dd>${p.xp}</dd></div>
        <div><dt>Questões feitas</dt><dd>${resp.length}</dd></div>
        <div><dt>Dias seguidos</dt><dd>${sequencia(p.dias)}</dd></div>
      </dl>
      ${cargo ? painelProva(ufba, cargo) : escolher}
      <div class="linha" style="margin:20px 0 0">
        <a class="botao sec" href="#/questoes">Praticar questões</a>
        <a class="botao sec" href="#/simulado">Fazer simulado</a>
        ${erros ? `<a class="botao sec" href="#/questoes?erros=1">Revisar ${erros} erro(s)</a>` : ''}
      </div>
      <h2>Trilhas por área</h2>
      <ul class="lista">${trilhas.map((t) => {
        const qs = questoes.filter((q) => q.area === t.id);
        const feitas = qs.filter((q) => p.respostas[q.id]).length;
        return `<li class="com-acao"><a class="bloco" href="#/trilhas/${t.id}"><span class="titulo"><span class="sigla">${esc(t.sigla)}</span>${esc(t.nome)}</span><span class="meta">${esc(t.descricao)}</span></a>
          <div style="min-width:160px"><div class="pequeno muted">${feitas} de ${qs.length} questões · ${t.labs.length} laboratório(s)</div>${barra(pct(feitas, qs.length))}</div></li>`;
      }).join('')}</ul>
    </div>`;

    el.querySelector('[data-form-cargo]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const cod = new FormData(e.currentTarget).get('cargo');
      if (cod) { servico.definirAlvo({ concurso: ufba.id, cargo: cod }); render(); }
    });
    el.querySelector('[data-trocar]')?.addEventListener('click', () => render(true));
  };
  render();
}

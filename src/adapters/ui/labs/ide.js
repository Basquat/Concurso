import { EXERCICIOS } from '../../../domain/code/exercicios.js';
import { analisarJava, analisarPhp, formatar } from '../../../domain/code/analise.js';
import { esc, toast } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const PALAVRAS = {
  javascript: 'break case catch class const continue default do else export extends false finally for function if import in let new null of return super switch this throw true try typeof undefined var while',
  java: 'abstract boolean break byte case catch char class continue default do double else enum extends false final finally float for if implements import int interface long new null package private protected public record return short static super switch this throw throws true try var void while',
  php: 'abstract array as break case catch class const continue default do echo else elseif extends false final fn for foreach function if implements interface match namespace new null private protected public readonly return static switch throw true try use while',
};
const NOME_LANG = { javascript: 'JavaScript', php: 'PHP', java: 'Java' };

function realcar(codigo, lang) {
  const kw = PALAVRAS[lang].split(' ').join('|');
  const re = new RegExp(`(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/${lang === 'php' ? '|#[^\\n]*' : ''})|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)|(\\$\\w+)|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${kw})\\b`, 'g');
  let out = '';
  let i = 0;
  for (const m of codigo.matchAll(re)) {
    out += esc(codigo.slice(i, m.index));
    const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'var' : m[4] ? 'num' : 'kw';
    out += `<span class="tk-${cls}">${esc(m[0])}</span>`;
    i = m.index + m[0].length;
  }
  return out + esc(codigo.slice(i)) + '\n ';
}

export default async function ide(el, { servico, labs, js, php }) {
  let st = labs.carregar('ide') ?? { atual: EXERCICIOS[0].id, arquivos: {}, historico: {} };
  const missoes = EXERCICIOS.map((e) => ({ id: e.id, titulo: `${NOME_LANG[e.lang]} · ${e.titulo}`, descricao: e.enunciado, xp: e.xp }));

  el.innerHTML = cabecalhoLab('ide') + `<div class="split"><div class="pilha">
      <div style="display:grid;grid-template-columns:minmax(150px,210px) minmax(0,1fr);gap:12px" id="ideGrid">
        <nav class="card pequeno" id="explorador" aria-label="Exercícios e arquivos" style="padding:10px"></nav>
        <div class="pilha" style="min-width:0">
          <div class="card" style="padding:10px" id="enunciado"></div>
          <div>
            <div class="abas" id="abasArq"></div>
            <div class="editor-sobreposto"><div class="numeros" id="nums">1</div><div class="area"><pre id="realce" aria-hidden="true"></pre><textarea id="codigo" wrap="off" spellcheck="false" aria-label="Editor de código" autocapitalize="off" autocomplete="off"></textarea></div></div>
          </div>
          <div class="linha">
            <button class="btn primario" id="rodar">▶ Executar e verificar</button>
            <button class="btn" id="formatar">Formatar</button>
            <button class="btn" id="original">Restaurar original</button>
            <input id="busca" placeholder="Buscar" style="width:120px"><input id="troca" placeholder="Substituir por" style="width:120px">
            <button class="btn peq" id="prox">Próximo</button><button class="btn peq" id="trocarTodos">Substituir todos</button>
          </div>
          <div class="abas" id="abasSaida"><button data-s="problemas" class="ativa">Problemas</button><button data-s="saida">Saída</button><button data-s="testes">Testes</button><button data-s="historico">Histórico</button></div>
          <div class="card" id="saida" style="border-top-left-radius:0"></div>
        </div>
      </div>
    </div><aside class="card" id="missoes"></aside></div>`;
  if (matchMedia('(max-width: 720px)').matches) el.querySelector('#ideGrid').style.gridTemplateColumns = 'minmax(0,1fr)';

  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'ide', missoes, servico });
  const ta = el.querySelector('#codigo');
  const pre = el.querySelector('#realce');
  const nums = el.querySelector('#nums');
  let abaSaida = 'problemas';
  let resultado = { saida: '', testes: null };
  let problemas = [];
  let arquivoAtual;
  const ex = () => EXERCICIOS.find((e) => e.id === st.atual) ?? EXERCICIOS[0];
  const arquivos = () => (st.arquivos[ex().id] ??= { ...ex().arquivos });
  const salvar = () => labs.salvar('ide', st);

  function explorador() {
    const grupos = ['javascript', 'php', 'java'];
    el.querySelector('#explorador').innerHTML = grupos.map((g) => `<div style="margin-bottom:8px"><div class="muted" style="font-weight:600">${NOME_LANG[g]}</div>${EXERCICIOS.filter((e) => e.lang === g).map((e) => {
      const feito = servico.progresso.missoes[`ide/${e.id}`];
      return `<div><a href="#" data-ex="${e.id}" style="${e.id === st.atual ? 'font-weight:700' : ''}">${feito ? '✅' : '📄'} ${esc(e.titulo)}</a>${e.id === st.atual ? Object.keys(arquivos()).map((f) => `<div class="mono" style="padding-left:16px">↳ ${esc(f)}</div>`).join('') : ''}</div>`;
    }).join('')}</div>`).join('');
    el.querySelectorAll('[data-ex]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); st.atual = a.dataset.ex; arquivoAtual = null; salvar(); abrir(); }));
  }

  function abrir() {
    const e = ex();
    arquivoAtual ??= Object.keys(arquivos())[0];
    const modo = { testes: 'Executado de verdade (Web Worker) e conferido por testes automáticos.', saida: 'Executado de verdade (PHP 8 em WebAssembly) e a saída é comparada com a esperada.', estatico: e.lang === 'java' ? 'Java não é compilado aqui: verificação estática do código (mensagens no formato do javac).' : 'Verificação estrutural do código (nada é executado nem acessa banco).' }[e.verificar.tipo];
    el.querySelector('#enunciado').innerHTML = `<div class="linha entre"><strong>${esc(e.titulo)}</strong><span class="tag">${NOME_LANG[e.lang]}</span></div><p style="margin:6px 0">${esc(e.enunciado)}</p><div class="pequeno muted">${esc(modo)}</div>`;
    el.querySelector('#abasArq').innerHTML = Object.keys(arquivos()).map((f) => `<button class="${f === arquivoAtual ? 'ativa' : ''}" data-arq="${esc(f)}">${esc(f)}</button>`).join('');
    ta.value = arquivos()[arquivoAtual];
    resultado = { saida: '', testes: null };
    atualizarEditor();
    explorador();
  }

  let tAnalise;
  function atualizarEditor() {
    pre.innerHTML = realcar(ta.value, ex().lang);
    nums.textContent = ta.value.split('\n').map((_, i) => i + 1).join('\n');
    sincronizarRolagem();
    clearTimeout(tAnalise);
    tAnalise = setTimeout(() => { analisar(); if (abaSaida === 'problemas') mostrarSaida(); }, 250);
  }
  function sincronizarRolagem() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; nums.scrollTop = ta.scrollTop; }

  function analisar() {
    const e = ex();
    if (e.lang === 'java') problemas = analisarJava(ta.value, arquivoAtual);
    else if (e.lang === 'php') problemas = analisarPhp(ta.value);
    else {
      try { new Function(ta.value); problemas = []; } catch (err) { problemas = [{ linha: '?', nivel: 'erro', msg: `${err.name}: ${err.message}` }]; }
    }
  }

  function mostrarSaida() {
    const box = el.querySelector('#saida');
    el.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('ativa', b.dataset.s === abaSaida));
    if (abaSaida === 'problemas') {
      const ic = { erro: '⛔', aviso: '⚠️', info: 'ℹ️' };
      box.innerHTML = problemas.length ? `<ul class="missoes">${problemas.map((p) => `<li class="pequeno">${ic[p.nivel]} <span class="mono">${esc(arquivoAtual)}:${p.linha}</span> — ${esc(p.msg)}</li>`).join('')}</ul>` : '<p class="muted pequeno">Nenhum problema detectado pela análise.</p>';
    } else if (abaSaida === 'saida') {
      box.innerHTML = `<div class="saida">${esc(resultado.saida || '(sem saída)')}${resultado.erro ? `\n\n✖ ${esc(resultado.erro)}` : ''}</div>`;
    } else if (abaSaida === 'testes') {
      box.innerHTML = resultado.testes ? `<ul class="missoes">${resultado.testes.map((t) => `<li class="${t.ok ? 'feita' : ''} pequeno">${t.ok ? '✅' : '❌'} ${esc(t.nome)}${t.erro ? ` <span class="erro">(${esc(t.erro)})</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted pequeno">Clique em "Executar e verificar".</p>';
    } else {
      const h = st.historico[ex().id] ?? [];
      box.innerHTML = h.length ? `<p class="pequeno muted">Versões salvas a cada execução (as 10 mais recentes).</p><ul class="missoes">${[...h].reverse().map((v, i) => `<li class="linha entre pequeno"><span>${esc(v.quando)} · ${v.codigo.split('\n').length} linhas · ${v.ok ? '✅ passou' : '❌ não passou'}</span><button class="btn peq" data-restaura="${h.length - 1 - i}">Restaurar</button></li>`).join('')}</ul>` : '<p class="muted pequeno">Nenhuma versão salva ainda.</p>';
      box.querySelectorAll('[data-restaura]').forEach((b) => b.addEventListener('click', () => { ta.value = h[Number(b.dataset.restaura)].codigo; guardar(); atualizarEditor(); toast('Versão restaurada.'); }));
    }
  }

  function guardar() { arquivos()[arquivoAtual] = ta.value; salvar(); }

  async function rodar() {
    const e = ex();
    guardar();
    analisar();
    const codigo = ta.value;
    const v = e.verificar;
    let ok = false;
    const btn = el.querySelector('#rodar');
    btn.disabled = true;
    try {
      if (e.lang === 'javascript') {
        resultado = await js.executar(codigo, { testes: v.testes });
        ok = !resultado.erro && resultado.testes.length > 0 && resultado.testes.every((t) => t.ok);
        abaSaida = 'testes';
      } else if (v.tipo === 'saida') {
        resultado = { saida: 'Baixando e iniciando o PHP 8 (WebAssembly, ~12 MB na primeira vez)…' };
        abaSaida = 'saida';
        mostrarSaida();
        const r = await php.executar(codigo);
        const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').trim();
        ok = norm(r.saida) === norm(v.esperado) && !r.erro;
        resultado = { ...r, testes: [{ nome: `Saída igual à esperada${ok ? '' : `:\n${v.esperado}`}`, ok }] };
      } else {
        const regras = v.regras.map(([re, msg]) => ({ nome: msg, ok: re.test(codigo) }));
        if (v.semErros) regras.unshift({ nome: 'Sem erros na análise estática', ok: !problemas.some((p) => p.nivel === 'erro') });
        if (v.semAvisos) regras.push({ nome: 'Sem avisos (ex.: String comparada com ==)', ok: !problemas.some((p) => p.nivel === 'aviso') });
        resultado = { saida: e.lang === 'java' ? '(Java não é executado no navegador nesta versão — veja os critérios em Testes.)' : '(verificação estrutural — nada foi executado)', testes: regras };
        ok = regras.every((r) => r.ok);
        abaSaida = 'testes';
      }
    } catch (err) {
      resultado = { saida: '', erro: `Falha ao executar: ${err.message}`, testes: [] };
      abaSaida = 'saida';
    } finally { btn.disabled = false; }
    const h = (st.historico[e.id] ??= []);
    h.push({ quando: new Date().toLocaleTimeString('pt-BR'), codigo, ok });
    if (h.length > 10) h.shift();
    salvar();
    mostrarSaida();
    painel.verificar((m) => m.id === e.id && ok);
    explorador();
  }

  ta.addEventListener('input', () => { guardar(); atualizarEditor(); });
  ta.addEventListener('scroll', sincronizarRolagem);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); guardar(); atualizarEditor(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); rodar(); }
  });
  el.querySelector('#abasArq').addEventListener('click', (e) => { const f = e.target.dataset.arq; if (f) { guardar(); arquivoAtual = f; abrir(); } });
  el.querySelector('#abasSaida').addEventListener('click', (e) => { if (e.target.dataset.s) { abaSaida = e.target.dataset.s; mostrarSaida(); } });
  el.querySelector('#rodar').onclick = rodar;
  el.querySelector('#formatar').onclick = () => { ta.value = formatar(ta.value, ex().lang); guardar(); atualizarEditor(); };
  el.querySelector('#original').onclick = () => { if (confirm('Descartar suas alterações neste exercício?')) { st.arquivos[ex().id] = { ...ex().arquivos }; salvar(); abrir(); } };
  el.querySelector('#prox').onclick = () => {
    const termo = el.querySelector('#busca').value;
    if (!termo) return;
    let i = ta.value.indexOf(termo, ta.selectionEnd);
    if (i < 0) i = ta.value.indexOf(termo);
    if (i < 0) return toast('Não encontrado.');
    ta.focus();
    ta.setSelectionRange(i, i + termo.length);
  };
  el.querySelector('#trocarTodos').onclick = () => {
    const termo = el.querySelector('#busca').value;
    if (!termo) return;
    const n = ta.value.split(termo).length - 1;
    ta.value = ta.value.split(termo).join(el.querySelector('#troca').value);
    guardar();
    atualizarEditor();
    toast(`${n} ocorrência(s) substituída(s).`);
  };
  confirmarReinicio(el, () => { labs.limpar('ide'); st = { atual: EXERCICIOS[0].id, arquivos: {}, historico: {} }; arquivoAtual = null; abrir(); });

  abrir();
}

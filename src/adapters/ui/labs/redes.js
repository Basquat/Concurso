import { gerarExercicio, conferirExercicio, parseCidr, topologiaInicial, ping, ipParaInt, MISSOES_REDE } from '../../../domain/network/ipv4.js';
import { esc } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const CAMPOS = [['rede', 'Endereço de rede'], ['broadcast', 'Broadcast'], ['mascara', 'Máscara'], ['primeiro', 'Primeiro host'], ['ultimo', 'Último host'], ['hosts', 'Nº de hosts']];

export default async function redes(el, { servico, labs }) {
  let st = labs.carregar('redes') ?? { topo: topologiaInicial(), acertosSubrede: 0 };
  let ex = gerarExercicio();

  el.innerHTML = cabecalhoLab('redes') + `<div class="split"><div class="pilha">
      <section class="card pilha">
        <div class="linha entre"><h3 style="margin:0">Exercício de sub-rede</h3><span class="tag" id="placar"></span></div>
        <p style="margin:0">Dado o endereço <strong class="mono" id="enunc"></strong>, calcule:</p>
        <form id="fex" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${CAMPOS.map(([k, n]) => `<label class="campo">${n}<input name="${k}" class="mono" autocomplete="off"></label>`).join('')}</form>
        <div class="linha"><button class="btn primario" id="conferir">Conferir</button><button class="btn" id="novo">Novo exercício</button></div>
        <div id="fbex"></div>
        <details><summary class="pequeno">Calculadora livre (para estudar o método)</summary>
          <div class="linha" style="margin-top:8px"><input id="calc" class="mono" placeholder="192.168.10.77/26"><button class="btn peq" id="bcalc">Calcular</button></div><div id="rcalc" class="pequeno mono" style="margin-top:6px"></div></details>
      </section>
      <section class="card pilha">
        <h3 style="margin:0">Diagnóstico de rede</h3>
        <div id="diagrama"></div>
        <div class="rolagem" style="max-height:none"><table class="tabela" id="hosts"></table></div>
        <div class="linha"><label class="campo">Origem<select id="po">${st.topo.hosts.map((h) => `<option>${esc(h.nome)}</option>`).join('')}</select></label>
          <label class="campo">Destino (IP ou nome)<input id="pd" class="mono" value="192.168.2.10"></label>
          <button class="btn primario" id="bping" style="align-self:end">ping</button></div>
        <div id="rping"></div>
      </section>
    </div><aside class="card" id="missoes"></aside></div>`;

  const painel = painelMissoes(el.querySelector('#missoes'), { lab: 'redes', missoes: MISSOES_REDE, servico });
  const salvar = () => { labs.salvar('redes', st); painel.verificar((m) => m.check(st)); };

  function novoExercicio() {
    ex = gerarExercicio();
    el.querySelector('#enunc').textContent = `${ex.ip}/${ex.prefixo}`;
    el.querySelector('#fex').reset();
    el.querySelector('#fbex').innerHTML = '';
    el.querySelector('#placar').textContent = `${st.acertosSubrede ?? 0} acerto(s)`;
  }

  el.querySelector('#conferir').onclick = () => {
    const r = conferirExercicio(ex, Object.fromEntries(new FormData(el.querySelector('#fex'))));
    const tudo = Object.values(r).every(Boolean);
    CAMPOS.forEach(([k]) => { el.querySelector(`#fex [name=${k}]`).style.borderColor = r[k] ? 'var(--ok)' : 'var(--err)'; });
    const a = ex.resposta;
    el.querySelector('#fbex').innerHTML = tudo
      ? '<div class="callout okc">Tudo certo! ✔</div>'
      : `<div class="callout err pequeno">Revise os campos em vermelho. Método: o bloco tem 2^(32−${a.prefixo}) = ${2 ** (32 - a.prefixo)} endereços; a rede é o múltiplo do bloco que contém o IP; o broadcast é o último endereço do bloco.
        <details><summary>Ver resposta</summary><span class="mono">rede ${a.rede} · broadcast ${a.broadcast} · máscara ${a.mascara} · hosts ${a.primeiro}–${a.ultimo} (${a.hosts})</span></details></div>`;
    if (tudo) { st.acertosSubrede = (st.acertosSubrede ?? 0) + 1; salvar(); setTimeout(novoExercicio, 900); }
  };
  el.querySelector('#novo').onclick = novoExercicio;
  el.querySelector('#bcalc').onclick = () => {
    const c = parseCidr(el.querySelector('#calc').value.trim());
    el.querySelector('#rcalc').innerHTML = c ? `rede ${c.rede}/${c.prefixo} · máscara ${c.mascara} · broadcast ${c.broadcast}<br>hosts ${c.primeiro} – ${c.ultimo} (${c.hosts} utilizáveis)` : '<span class="erro">Use o formato IP/prefixo, ex.: 10.0.0.1/22</span>';
  };

  function diagrama() {
    const lan = (nome, x) => st.topo.hosts.filter((h) => h.lan === nome).map((h, i) => `<g><rect x="${x}" y="${20 + i * 64}" width="150" height="50" rx="8" fill="var(--surface)" stroke="var(--border)"/><text x="${x + 10}" y="${40 + i * 64}" font-size="12" font-weight="700" fill="var(--text)">${esc(h.nome)}</text><text x="${x + 10}" y="${58 + i * 64}" font-size="11" fill="var(--muted)" font-family="monospace">${esc(h.ip)}/${h.prefixo}</text><line x1="${x === 20 ? 170 : x}" y1="${45 + i * 64}" x2="${x === 20 ? 250 : 470}" y2="95" stroke="var(--muted)"/></g>`).join('');
    const [a, b] = st.topo.roteador.interfaces;
    el.querySelector('#diagrama').innerHTML = `<svg viewBox="0 0 640 170" style="width:100%;max-width:640px">${lan('LAN-ADM', 20)}${lan('LAN-SRV', 470)}
      <rect x="250" y="70" width="220" height="50" rx="25" fill="var(--primary-soft)" stroke="var(--primary)"/><text x="360" y="92" text-anchor="middle" font-weight="700" font-size="13" fill="var(--text)">Roteador R1</text>
      <text x="360" y="110" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="monospace">${a.ip}/${a.prefixo} | ${b.ip}/${b.prefixo}</text>
      <text x="20" y="160" font-size="11" fill="var(--muted)">LAN-ADM 192.168.1.0/24</text><text x="470" y="160" font-size="11" fill="var(--muted)">LAN-SRV 192.168.2.0/24</text></svg>`;
  }

  function tabelaHosts() {
    el.querySelector('#hosts').innerHTML = `<thead><tr><th>Host</th><th>IP</th><th>Prefixo</th><th>Gateway</th><th>DNS</th></tr></thead><tbody>${st.topo.hosts.map((h, i) => `<tr data-i="${i}"><td>${esc(h.nome)}</td>
      <td><input data-k="ip" class="mono" value="${esc(h.ip)}" style="width:130px"></td>
      <td><input data-k="prefixo" type="number" min="8" max="30" value="${h.prefixo}" style="width:64px"></td>
      <td><input data-k="gateway" class="mono" value="${esc(h.gateway)}" style="width:130px"></td>
      <td><input data-k="dns" class="mono" value="${esc(h.dns)}" style="width:130px"></td></tr>`).join('')}</tbody>`;
  }
  el.querySelector('#hosts').addEventListener('change', (e) => {
    const i = Number(e.target.closest('tr').dataset.i);
    const k = e.target.dataset.k;
    const v = k === 'prefixo' ? Number(e.target.value) : e.target.value.trim();
    if (k !== 'prefixo' && ipParaInt(v) === null) { e.target.style.borderColor = 'var(--err)'; return; }
    e.target.style.borderColor = '';
    st.topo.hosts[i][k] = v;
    diagrama();
    salvar();
  });
  el.querySelector('#bping').onclick = () => {
    const r = ping(st.topo, el.querySelector('#po').value, el.querySelector('#pd').value.trim());
    el.querySelector('#rping').innerHTML = `<div class="callout ${r.ok ? 'okc' : 'err'}"><div class="mono pequeno">${r.resolucao ? `DNS: ${esc(r.resolucao)}<br>` : ''}${r.passos ? `Caminho: ${r.passos.map(esc).join(' → ')}<br>` : ''}</div>
      <strong>${r.ok ? '✔ Resposta recebida (ping OK)' : '✖ Falha'}</strong>${r.motivo ? `<p class="pequeno" style="margin:4px 0 0">${esc(r.motivo)}</p>` : ''}</div>`;
    salvar();
  };

  confirmarReinicio(el, () => { labs.limpar('redes'); st = { topo: topologiaInicial(), acertosSubrede: 0 }; tabelaHosts(); diagrama(); novoExercicio(); salvar(); });
  novoExercicio();
  tabelaHosts();
  diagrama();
  painel.verificar((m) => m.check(st));
}

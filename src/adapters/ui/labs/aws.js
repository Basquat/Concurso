import { TIPOS, INSTANCIAS, CLASSES_RDS, POLITICAS, novaArquitetura, adicionarNo, removerNo, conectar, conexaoValida, validar, estimarCusto, planoProvisionamento, simularFalhaAz, simularPico, gerarCloudFormation, MISSOES_AWS } from '../../../domain/cloud/architecture.js';
import { esc, toast } from '../dom.js';
import { cabecalhoLab, painelMissoes, confirmarReinicio } from './registro.js';

const CAMPOS = {
  cidr: { r: 'Bloco CIDR' }, dominio: { r: 'Domínio' }, metrica: { r: 'Métrica do alarme' },
  vpc: { r: 'VPC', ref: 'vpc' }, subnet: { r: 'Sub-rede', ref: 'subnet' }, sg: { r: 'Security Group', ref: 'sg' }, subnets: { r: 'Sub-redes', multi: 'subnet' },
  az: { r: 'Zona de disponibilidade', op: ['a', 'b', 'c'] }, tipo: { r: 'Tipo de instância', op: Object.keys(INSTANCIAS) }, classe: { r: 'Classe', op: Object.keys(CLASSES_RDS) },
  motor: { r: 'Motor', op: ['postgres', 'mysql'] }, politica: { r: 'Política gerenciada', op: POLITICAS },
  publica: { r: 'Sub-rede pública (rota para o IGW)' }, publico: { r: 'Público / voltado à internet' }, ipPublico: { r: 'IP público' }, multiAZ: { r: 'Multi-AZ (réplica standby)' },
  bloqueioPublico: { r: 'Block Public Access' }, versionamento: { r: 'Versionamento' },
  min: { r: 'Mínimo' }, desejado: { r: 'Desejado' }, max: { r: 'Máximo' }, memoria: { r: 'Memória (MB)' },
  regras: { r: 'Regras de entrada (uma por linha: PORTA ORIGEM)', area: true },
};

function exemploComProblemas() {
  const a = novaArquitetura();
  const add = (t, x, y, p = {}) => { const n = adicionarNo(a, t, x, y); Object.assign(n.props, p); return n; };
  const vpc = add('vpc', 20, 20);
  add('igw', 20, 120);
  const s1 = add('subnet', 200, 20, { vpc: vpc.id, az: 'a', publica: true, cidr: '10.0.1.0/24' });
  const s2 = add('subnet', 200, 130, { vpc: vpc.id, az: 'a', publica: true, cidr: '10.0.1.0/25' });
  const sg = add('sg', 20, 230, { vpc: vpc.id, regras: '80 0.0.0.0/0\n22 0.0.0.0/0\n5432 0.0.0.0/0' });
  const alb = add('alb', 400, 20, { subnets: [s1.id], sg: sg.id });
  const ec2 = add('ec2', 400, 160, { subnet: s1.id, sg: sg.id, ipPublico: true });
  const rds = add('rds', 400, 300, { subnets: [s2.id], sg: sg.id, publico: true });
  conectar(a, alb.id, ec2.id);
  conectar(a, ec2.id, rds.id);
  return a;
}

export default async function aws(el, { servico, labs }) {
  let arq = labs.carregar('aws') ?? novaArquitetura();
  let selId = null;
  let ligando = null;
  let caidos = new Set();
  let aba = 'val';

  el.innerHTML = cabecalhoLab('aws', '<button class="btn" id="exemplo">Exemplo com problemas</button>') + `<div class="split"><div class="pilha">
      <div class="card"><div class="paleta">${Object.entries(TIPOS).map(([t, d]) => `<button class="btn peq" data-add="${t}" style="border-left:4px solid ${d.cor}">+ ${esc(d.nome)}</button>`).join('')}</div>
        <div class="linha pequeno muted" style="margin-top:8px"><button class="btn peq" id="ligar">🔗 Conectar</button><span id="modo">Arraste os blocos. Para ligar, clique em "Conectar", depois na origem e no destino (ex.: Route 53 → ALB → Auto Scaling → RDS).</span></div></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:12px" id="area">
        <div class="canvas" id="canvas"><svg id="arestas"><defs><marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--muted)"/></marker></defs></svg></div>
        <div class="card" id="props" style="max-height:560px;overflow:auto"></div>
      </div>
      <div class="abas">${[['val', 'Validação'], ['custo', 'Custo estimado'], ['sim', 'Simulação'], ['iac', 'CloudFormation']].map(([k, n]) => `<button data-aba="${k}" class="${k === aba ? 'ativa' : ''}">${n}</button>`).join('')}</div>
      <div class="card" id="painel" style="border-top-left-radius:0"></div>
    </div><aside class="card" id="missoes"></aside></div>`;

  if (matchMedia('(max-width: 960px)').matches) el.querySelector('#area').style.gridTemplateColumns = 'minmax(0,1fr)';
  const painelM = painelMissoes(el.querySelector('#missoes'), { lab: 'aws', missoes: MISSOES_AWS, servico });
  const canvas = el.querySelector('#canvas');
  const svg = el.querySelector('#arestas');
  const by = () => Object.fromEntries(arq.nos.map((n) => [n.id, n]));

  const resumo = (n) => {
    const p = n.props;
    const b = by();
    switch (n.tipo) {
      case 'vpc': return p.cidr;
      case 'subnet': return `${p.cidr} · AZ ${p.az} · ${p.publica ? 'pública' : 'privada'}`;
      case 'igw': return p.vpc ? `→ ${p.vpc}` : 'sem VPC';
      case 'nat': return p.subnet || 'sem sub-rede';
      case 'alb': return `${p.publico ? 'internet' : 'interno'} · ${p.subnets.length} sub-rede(s)`;
      case 'asg': return `${p.min}/${p.desejado}/${p.max} × ${p.tipo}`;
      case 'ec2': return `${p.tipo}${p.subnet ? ` · AZ ${b[p.subnet]?.props.az ?? '?'}` : ''}`;
      case 'rds': return `${p.motor} ${p.classe}${p.multiAZ ? ' · Multi-AZ' : ''}`;
      case 'sg': return `${String(p.regras).split('\n').filter(Boolean).length} regra(s)`;
      case 'iam': return p.politica;
      case 's3': return p.bloqueioPublico ? 'privado' : 'PÚBLICO';
      default: return Object.values(p)[0] ?? '';
    }
  };

  function desenhar() {
    const v = validar(arq);
    const status = {};
    for (const x of v) if (status[x.no] !== 'erro') status[x.no] = x.nivel === 'erro' ? 'erro' : x.nivel === 'aviso' ? 'aviso' : status[x.no];
    canvas.querySelectorAll('.no-aws').forEach((n) => n.remove());
    for (const n of arq.nos) {
      const d = document.createElement('div');
      d.className = `no-aws ${n.id === selId ? 'sel' : ''} ${n.id === ligando ? 'ligando' : ''} ${status[n.id] ?? ''} ${caidos.has(n.id) ? 'caiu' : ''}`;
      d.dataset.id = n.id;
      d.style.left = `${n.x}px`;
      d.style.top = `${n.y}px`;
      d.style.borderTopColor = TIPOS[n.tipo].cor;
      d.style.borderTopWidth = '5px';
      d.innerHTML = `<div class="tipo">${esc(TIPOS[n.tipo].nome)}</div><div class="mono muted">${esc(n.id)}</div><div>${esc(resumo(n))}</div>`;
      canvas.append(d);
    }
    desenharArestas();
    propriedades();
    mostrarAba(v);
    painelM.verificar((m) => m.check(arq, v));
  }

  function desenharArestas() {
    const centro = (id) => {
      const d = canvas.querySelector(`[data-id="${id}"]`);
      return d ? [d.offsetLeft + d.offsetWidth / 2, d.offsetTop + d.offsetHeight / 2, d.offsetWidth / 2, d.offsetHeight / 2] : null;
    };
    svg.querySelectorAll('line').forEach((l) => l.remove());
    for (const e of arq.arestas) {
      const a = centro(e.de);
      const b = centro(e.para);
      if (!a || !b) continue;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const t = Math.min(b[2] / Math.abs(dx || 1e-9), b[3] / Math.abs(dy || 1e-9), 1);
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      Object.entries({ x1: a[0], y1: a[1], x2: b[0] - dx * t, y2: b[1] - dy * t, stroke: 'var(--muted)', 'stroke-width': 2, 'marker-end': 'url(#sa)' }).forEach(([k, v]) => l.setAttribute(k, v));
      svg.append(l);
    }
  }

  function propriedades() {
    const box = el.querySelector('#props');
    const n = by()[selId];
    if (!n) { box.innerHTML = '<p class="muted pequeno">Selecione um bloco para editar suas propriedades.</p><p class="pequeno"><strong>Conexões aceitas</strong><br>Route 53 → ALB/S3/EC2<br>ALB → Auto Scaling/EC2<br>EC2/ASG/Lambda → RDS/S3<br>IAM Role → EC2/ASG/Lambda<br>CloudWatch → ASG/EC2</p>'; return; }
    const nos = arq.nos;
    const campo = (k, v) => {
      const c = CAMPOS[k] ?? { r: k };
      if (c.ref) return `<label class="campo">${c.r}<select data-p="${k}"><option value="">—</option>${nos.filter((x) => x.tipo === c.ref).map((x) => `<option ${x.id === v ? 'selected' : ''}>${x.id}</option>`).join('')}</select></label>`;
      if (c.multi) return `<fieldset style="border:1px solid var(--border);border-radius:8px;padding:6px 8px"><legend class="pequeno muted">${c.r}</legend>${nos.filter((x) => x.tipo === c.multi).map((x) => `<label class="linha pequeno"><input type="checkbox" data-multi="${k}" value="${x.id}" ${v.includes(x.id) ? 'checked' : ''}> ${x.id} (AZ ${x.props.az}, ${x.props.publica ? 'pública' : 'privada'})</label>`).join('') || '<span class="pequeno muted">crie sub-redes primeiro</span>'}</fieldset>`;
      if (c.op) return `<label class="campo">${c.r}<select data-p="${k}">${c.op.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
      if (typeof v === 'boolean') return `<label class="linha pequeno"><input type="checkbox" data-p="${k}" ${v ? 'checked' : ''}> ${c.r}</label>`;
      if (typeof v === 'number') return `<label class="campo">${c.r}<input type="number" data-p="${k}" value="${v}"></label>`;
      if (c.area) return `<label class="campo">${c.r}<textarea data-p="${k}" class="mono" rows="4">${esc(v)}</textarea></label>`;
      return `<label class="campo">${c.r}<input data-p="${k}" value="${esc(v)}" class="mono"></label>`;
    };
    const ligs = arq.arestas.filter((e) => e.de === n.id || e.para === n.id);
    box.innerHTML = `<div class="linha entre"><strong>${esc(TIPOS[n.tipo].nome)}</strong><span class="mono pequeno">${n.id}</span></div>
      <div class="pilha" style="margin-top:8px">${Object.entries(n.props).map(([k, v]) => campo(k, v)).join('')}</div>
      ${ligs.length ? `<div class="pequeno" style="margin-top:10px"><strong>Conexões</strong>${ligs.map((e) => `<div class="linha entre">${e.de} → ${e.para}<button class="btn peq" data-desliga="${e.de}|${e.para}" aria-label="Remover conexão">✕</button></div>`).join('')}</div>` : ''}
      <button class="btn perigo peq" id="remover" style="margin-top:10px">Remover bloco</button>`;
    box.querySelectorAll('[data-p]').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.p;
      n.props[k] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? Number(inp.value) : inp.value;
      mudou();
    }));
    box.querySelectorAll('[data-multi]').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.multi;
      n.props[k] = inp.checked ? [...n.props[k], inp.value] : n.props[k].filter((x) => x !== inp.value);
      mudou();
    }));
    box.querySelectorAll('[data-desliga]').forEach((b) => b.addEventListener('click', () => {
      const [de, para] = b.dataset.desliga.split('|');
      arq.arestas = arq.arestas.filter((e) => !(e.de === de && e.para === para));
      mudou();
    }));
    box.querySelector('#remover').onclick = () => { removerNo(arq, n.id); selId = null; mudou(); };
  }

  function mostrarAba(v = validar(arq)) {
    const p = el.querySelector('#painel');
    if (aba === 'val') {
      const icon = { erro: '⛔', aviso: '⚠️', info: 'ℹ️' };
      p.innerHTML = !arq.nos.length ? '<p class="muted">Adicione blocos pela paleta ou carregue o exemplo com problemas.</p>'
        : v.length ? `<ul class="missoes">${v.map((x) => `<li><div><strong>${icon[x.nivel]} ${esc(x.no)}</strong> — ${esc(x.msg)}</div><div class="pequeno muted">Como corrigir: ${esc(x.correcao)}</div></li>`).join('')}</ul>`
          : '<div class="callout okc">✔ Nenhum problema encontrado.</div>';
    } else if (aba === 'custo') {
      const c = estimarCusto(arq);
      p.innerHTML = `<table class="tabela"><thead><tr><th>Recurso</th><th>Item</th><th class="num">US$/mês</th></tr></thead><tbody>${c.itens.map((i) => `<tr><td class="mono">${i.no}</td><td>${esc(i.desc)}</td><td class="num">${i.usd.toFixed(2)}</td></tr>`).join('')}<tr><td colspan="2"><strong>Total estimado</strong></td><td class="num"><strong>${c.total.toFixed(2)}</strong></td></tr></tbody></table>
        <p class="pequeno muted">Aproximação on-demand (us-east-1, 730 h/mês) só para comparar arquiteturas; não inclui tráfego, armazenamento extra, impostos nem descontos. VPC, sub-redes, IGW, SG e IAM não são cobrados. Valores reais: AWS Pricing Calculator.</p>`;
    } else if (aba === 'sim') {
      p.innerHTML = `<div class="linha"><button class="btn primario" id="prov">Provisionar (simulado)</button><button class="btn" data-az="a">Derrubar AZ a</button><button class="btn" data-az="b">Derrubar AZ b</button><button class="btn" id="pico">Pico de 350 req/s</button><button class="btn" id="restaura">Restaurar</button></div><div id="log" class="saida" style="margin-top:10px">Nenhuma simulação executada. Nada é criado na AWS.</div>`;
      const log = (linhas) => { p.querySelector('#log').textContent = linhas.join('\n'); };
      p.querySelector('#prov').onclick = async () => {
        if (v.some((x) => x.nivel === 'erro')) return log(['✖ Provisionamento abortado: corrija os erros da aba Validação (como faria o CloudFormation, que reverte a pilha).']);
        const ordem = planoProvisionamento(arq);
        const linhas = [];
        for (const id of ordem) {
          linhas.push(`CREATE_IN_PROGRESS  ${id}`);
          log(linhas);
          canvas.querySelector(`[data-id="${id}"]`)?.classList.add('prov');
          await new Promise((r) => setTimeout(r, 180));
          linhas[linhas.length - 1] = `CREATE_COMPLETE     ${id}`;
        }
        linhas.push('✔ Pilha criada (simulação).');
        log(linhas);
      };
      p.querySelectorAll('[data-az]').forEach((b) => b.addEventListener('click', () => {
        const az = b.dataset.az;
        const r = simularFalhaAz(arq, az);
        const b2 = by();
        caidos = new Set(arq.nos.filter((n) => n.props.az === az || (n.props.subnet && b2[n.props.subnet]?.props.az === az)).map((n) => n.id));
        desenhar();
        log([`Falha simulada da zona ${az}:`, ...r.log, r.ok ? '✔ O serviço continuou disponível.' : '✖ O serviço ficou indisponível.']);
      }));
      p.querySelector('#pico').onclick = () => { const r = simularPico(arq); log([...r.log, r.ok ? '✔ Pico atendido.' : '✖ Usuários recebem erros/lentidão: capacidade insuficiente.']); };
      p.querySelector('#restaura').onclick = () => { caidos = new Set(); desenhar(); };
    } else {
      const y = gerarCloudFormation(arq);
      p.innerHTML = `<div class="linha" style="margin-bottom:8px"><button class="btn peq" id="copiar">Copiar YAML</button></div><pre class="saida" style="max-height:360px">${esc(y)}</pre>`;
      p.querySelector('#copiar').onclick = () => navigator.clipboard?.writeText(y).then(() => toast('YAML copiado.'));
    }
  }

  function mudou() { labs.salvar('aws', arq); desenhar(); }

  el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const k = arq.nos.length;
    const n = adicionarNo(arq, b.dataset.add, 20 + (k % 4) * 170, 20 + (Math.floor(k / 4) % 6) * 90);
    selId = n.id;
    mudou();
  }));
  el.querySelector('#ligar').onclick = () => {
    ligando = ligando === null ? '' : null;
    el.querySelector('#ligar').classList.toggle('primario', ligando !== null);
    el.querySelector('#modo').textContent = ligando !== null ? 'Modo conexão: clique na ORIGEM e depois no DESTINO.' : 'Arraste os blocos. Clique em Conectar para ligar componentes.';
    desenhar();
  };
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; el.querySelectorAll('[data-aba]').forEach((x) => x.classList.toggle('ativa', x === b)); mostrarAba(); }));
  el.querySelector('#exemplo').onclick = () => { if (!arq.nos.length || confirm('Substituir a arquitetura atual pelo exemplo?')) { arq = exemploComProblemas(); selId = null; caidos = new Set(); mudou(); } };

  // arrastar e selecionar
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const d = e.target.closest('.no-aws');
    if (!d) { selId = null; desenhar(); return; }
    const id = d.dataset.id;
    if (ligando !== null) {
      if (!ligando) { ligando = id; desenhar(); return; }
      const b = by();
      if (conexaoValida(b[ligando], b[id])) { conectar(arq, ligando, id); toast(`Conectado: ${ligando} → ${id}`); } else toast(`Conexão ${TIPOS[b[ligando].tipo].nome} → ${TIPOS[b[id].tipo].nome} não é suportada.`);
      ligando = '';
      mudou();
      return;
    }
    const n = by()[id];
    drag = { n, d, dx: e.clientX - n.x, dy: e.clientY - n.y, moveu: false };
    d.setPointerCapture(e.pointerId);
    if (selId !== id) { selId = id; canvas.querySelectorAll('.no-aws').forEach((x) => x.classList.toggle('sel', x.dataset.id === id)); propriedades(); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.moveu = true;
    drag.n.x = Math.max(0, Math.min(canvas.clientWidth - 150, e.clientX - drag.dx));
    drag.n.y = Math.max(0, Math.min(canvas.clientHeight - 60, e.clientY - drag.dy));
    drag.d.style.left = `${drag.n.x}px`;
    drag.d.style.top = `${drag.n.y}px`;
    desenharArestas();
  });
  canvas.addEventListener('pointerup', () => { if (drag?.moveu) labs.salvar('aws', arq); drag = null; });

  confirmarReinicio(el, () => { labs.limpar('aws'); arq = novaArquitetura(); selId = null; caidos = new Set(); mudou(); });
  desenhar();
}

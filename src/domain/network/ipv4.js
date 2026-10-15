// IPv4: cálculo de sub-redes (CIDR, RFC 4632) e simulação de ping numa topologia com roteador.

export function ipParaInt(ip) {
  const p = String(ip).trim().split('.');
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || Number(x) > 255)) return null;
  return p.reduce((n, x) => n * 256 + Number(x), 0);
}

export const intParaIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.');

export const mascaraDe = (prefixo) => (prefixo === 0 ? 0 : (2 ** 32 - 2 ** (32 - prefixo)));

export function prefixoDeMascara(m) {
  const n = ipParaInt(m);
  if (n === null) return null;
  const bits = n.toString(2).padStart(32, '0');
  return /^1*0*$/.test(bits) ? bits.indexOf('0') === -1 ? 32 : bits.indexOf('0') : null;
}

export function infoCidr(ip, prefixo) {
  const n = ipParaInt(ip);
  if (n === null || !(prefixo >= 0 && prefixo <= 32)) return null;
  const tam = 2 ** (32 - prefixo);
  const rede = Math.floor(n / tam) * tam;
  const broadcast = rede + tam - 1;
  const hosts = prefixo >= 31 ? (prefixo === 32 ? 1 : 2) : tam - 2; // /31 ponto a ponto (RFC 3021)
  return {
    rede: intParaIp(rede), broadcast: intParaIp(broadcast), mascara: intParaIp(mascaraDe(prefixo)),
    primeiro: intParaIp(prefixo >= 31 ? rede : rede + 1), ultimo: intParaIp(prefixo >= 31 ? broadcast : broadcast - 1),
    hosts, prefixo, inicio: rede, fim: broadcast,
  };
}

export function parseCidr(s) {
  const [ip, p] = String(s).split('/');
  const prefixo = Number(p);
  return p !== undefined && Number.isInteger(prefixo) ? infoCidr(ip, prefixo) : null;
}

export const contem = (cidr, ip) => { const c = parseCidr(cidr); const n = ipParaInt(ip); return !!c && n !== null && n >= c.inicio && n <= c.fim; };
export const sobrepoe = (a, b) => { const x = parseCidr(a); const y = parseCidr(b); return !!x && !!y && x.inicio <= y.fim && y.inicio <= x.fim; };
export const dentro = (interno, externo) => { const i = parseCidr(interno); const e = parseCidr(externo); return !!i && !!e && i.inicio >= e.inicio && i.fim <= e.fim; };

export function mesmaRede(ipA, ipB, prefixo) {
  const a = ipParaInt(ipA); const b = ipParaInt(ipB);
  if (a === null || b === null) return false;
  const tam = 2 ** (32 - prefixo);
  return Math.floor(a / tam) === Math.floor(b / tam);
}

// Questão aleatória de sub-rede (gerador determinístico a partir de rng).
export function gerarExercicio(rng = Math.random) {
  const prefixo = 20 + Math.floor(rng() * 10); // /20 a /29
  const privadas = [[10, () => Math.floor(rng() * 256)], [172, () => 16 + Math.floor(rng() * 16)], [192, () => 168]];
  const [a, b] = privadas[Math.floor(rng() * privadas.length)];
  const ip = [a, b(), Math.floor(rng() * 256), 1 + Math.floor(rng() * 254)].join('.');
  return { ip, prefixo, resposta: infoCidr(ip, prefixo) };
}

export function conferirExercicio(ex, resp) {
  const r = ex.resposta;
  const campos = { rede: r.rede, broadcast: r.broadcast, mascara: r.mascara, primeiro: r.primeiro, ultimo: r.ultimo, hosts: String(r.hosts) };
  return Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, String(resp[k] ?? '').trim() === v]));
}

export const MISSOES_REDE = [
  { id: 'subredes', titulo: 'Calculista de sub-redes', xp: 40, descricao: 'Acerte 5 exercícios completos de sub-rede (rede, broadcast, máscara, faixa e hosts).', check: (s) => (s.acertosSubrede ?? 0) >= 5 },
  { id: 'gateway', titulo: 'Gateway errado', xp: 30, descricao: 'PC-Fin não acessa nada fora da própria rede. Corrija a configuração para PC-Fin pingar SRV-Web.', check: (s) => ping(s.topo, 'PC-Fin', '192.168.2.10').ok },
  { id: 'mascara', titulo: 'Resposta que não volta', xp: 40, descricao: 'PC-Adm envia ping ao SRV-Web, mas não recebe resposta. Descubra por quê e corrija.', check: (s) => ping(s.topo, 'PC-Adm', '192.168.2.10').ok },
  { id: 'dns', titulo: 'Nome não resolve', xp: 30, descricao: 'PC-Adm não consegue acessar intranet.local pelo nome. Corrija a configuração.', check: (s) => ping(s.topo, 'PC-Adm', 'intranet.local').ok },
];

// ---------- topologia: duas LANs ligadas por um roteador ----------

export function topologiaInicial() {
  return {
    roteador: { nome: 'R1', interfaces: [{ ip: '192.168.1.1', prefixo: 24, lan: 'LAN-ADM' }, { ip: '192.168.2.1', prefixo: 24, lan: 'LAN-SRV' }] },
    hosts: [
      { nome: 'PC-Adm', lan: 'LAN-ADM', ip: '192.168.1.10', prefixo: 24, gateway: '192.168.1.1', dns: '8.8.8.8' },
      { nome: 'PC-Fin', lan: 'LAN-ADM', ip: '192.168.1.20', prefixo: 24, gateway: '192.168.1.254', dns: '192.168.2.53' },
      { nome: 'SRV-Web', lan: 'LAN-SRV', ip: '192.168.2.10', prefixo: 16, gateway: '192.168.2.1', dns: '192.168.2.53' },
      { nome: 'SRV-DNS', lan: 'LAN-SRV', ip: '192.168.2.53', prefixo: 24, gateway: '192.168.2.1', dns: '127.0.0.1' },
    ],
    registrosDns: { 'intranet.local': '192.168.2.10' },
  };
}

function entregarNaLan(topo, lan, ip) {
  return topo.hosts.find((h) => h.lan === lan && h.ip === ip) ?? topo.roteador.interfaces.find((i) => i.lan === lan && i.ip === ip) ?? null;
}

// Caminho de ida de `origem` até o IP de destino. Retorna { ok, passos, motivo }.
function ida(topo, origem, ipDestino) {
  const passos = [origem.nome];
  if (ipParaInt(origem.ip) === null) return { ok: false, passos, motivo: `${origem.nome}: endereço IP inválido.` };
  if (origem.ip === ipDestino) return { ok: true, passos };
  if (mesmaRede(origem.ip, ipDestino, origem.prefixo)) {
    const d = entregarNaLan(topo, origem.lan, ipDestino);
    return d ? { ok: true, passos: [...passos, d.nome ?? 'R1'] } : { ok: false, passos, motivo: `${origem.nome} acredita que ${ipDestino} está na própria rede (/${origem.prefixo}) e faz ARP, mas ninguém na ${origem.lan} responde: Destination Host Unreachable.` };
  }
  if (!mesmaRede(origem.ip, origem.gateway, origem.prefixo)) return { ok: false, passos, motivo: `${origem.nome}: o gateway ${origem.gateway} não pertence à rede do host.` };
  const gw = topo.roteador.interfaces.find((i) => i.lan === origem.lan && i.ip === origem.gateway);
  if (!gw) return { ok: false, passos, motivo: `${origem.nome}: o gateway ${origem.gateway} não existe na ${origem.lan} (o roteador está em ${topo.roteador.interfaces.find((i) => i.lan === origem.lan)?.ip}).` };
  passos.push(`R1 (${gw.ip})`);
  const saida = topo.roteador.interfaces.find((i) => mesmaRede(i.ip, ipDestino, i.prefixo));
  if (!saida) return { ok: false, passos, motivo: `R1 não tem rota para ${ipDestino} (sem rota padrão neste laboratório).` };
  const d = entregarNaLan(topo, saida.lan, ipDestino);
  return d ? { ok: true, passos: [...passos, d.nome ?? 'R1'] } : { ok: false, passos, motivo: `R1 encaminha para ${saida.lan}, mas nenhum host responde em ${ipDestino}.` };
}

export function ping(topo, nomeOrigem, alvo) {
  const origem = topo.hosts.find((h) => h.nome === nomeOrigem);
  let ipDestino = alvo;
  let resolucao = null;
  if (ipParaInt(alvo) === null) {
    const dns = topo.hosts.find((h) => h.ip === origem.dns);
    const caminhoDns = dns ? ida(topo, origem, dns.ip) : { ok: false };
    const volta = dns && caminhoDns.ok ? ida(topo, dns, origem.ip) : { ok: false };
    if (!dns || !caminhoDns.ok || !volta.ok || dns.nome !== 'SRV-DNS') return { ok: false, motivo: `${origem.nome} não resolve "${alvo}": o servidor DNS configurado (${origem.dns}) ${dns ? 'não responde' : 'não existe nesta rede (sem acesso à internet)'}.` };
    ipDestino = topo.registrosDns[alvo];
    if (!ipDestino) return { ok: false, motivo: `DNS respondeu NXDOMAIN: "${alvo}" não existe.` };
    resolucao = `${alvo} → ${ipDestino}`;
  }
  const destino = topo.hosts.find((h) => h.ip === ipDestino) ?? topo.roteador.interfaces.find((i) => i.ip === ipDestino);
  const i = ida(topo, origem, ipDestino);
  if (!i.ok) return { ok: false, motivo: i.motivo, passos: i.passos, resolucao };
  if (!destino?.nome) return { ok: true, passos: i.passos, resolucao }; // interface do roteador responde
  const v = ida(topo, destino, origem.ip);
  if (!v.ok) return { ok: false, motivo: `O pedido chegou, mas a RESPOSTA não volta: ${v.motivo}`, passos: i.passos, resolucao };
  return { ok: true, passos: i.passos, resolucao };
}

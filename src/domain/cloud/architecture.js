// Laboratório de arquitetura AWS: modelo, validações, custo estimado e simulação de falhas.
// Nada aqui chama a AWS. Regras baseadas na documentação oficial (ex.: ALB exige ≥2 AZs;
// DB subnet group do RDS exige sub-redes em ≥2 AZs; um Internet Gateway por VPC).
import { parseCidr, dentro, sobrepoe } from '../network/ipv4.js';

export const TIPOS = {
  vpc: { nome: 'VPC', cor: '#8c4fff', props: { cidr: '10.0.0.0/16' } },
  subnet: { nome: 'Sub-rede', cor: '#7aa116', props: { vpc: '', az: 'a', publica: true, cidr: '10.0.1.0/24' } },
  igw: { nome: 'Internet Gateway', cor: '#8c4fff', props: { vpc: '' } },
  nat: { nome: 'NAT Gateway', cor: '#8c4fff', props: { subnet: '' } },
  route53: { nome: 'Route 53', cor: '#8c4fff', props: { dominio: 'app.exemplo.gov.br' } },
  alb: { nome: 'Load Balancer (ALB)', cor: '#8c4fff', props: { subnets: [], publico: true, sg: '' } },
  asg: { nome: 'Auto Scaling Group', cor: '#ed7100', props: { subnets: [], min: 2, desejado: 2, max: 4, tipo: 't3.micro', sg: '' } },
  ec2: { nome: 'EC2', cor: '#ed7100', props: { subnet: '', tipo: 't3.micro', sg: '', ipPublico: false } },
  lambda: { nome: 'Lambda', cor: '#ed7100', props: { memoria: 128 } },
  rds: { nome: 'RDS', cor: '#c925d1', props: { subnets: [], motor: 'postgres', classe: 'db.t3.micro', multiAZ: false, publico: false, sg: '' } },
  s3: { nome: 'S3', cor: '#7aa116', props: { bloqueioPublico: true, versionamento: false } },
  sg: { nome: 'Security Group', cor: '#dd344c', props: { vpc: '', regras: '443 0.0.0.0/0' } },
  iam: { nome: 'IAM Role', cor: '#dd344c', props: { politica: 'S3ReadOnly' } },
  cloudwatch: { nome: 'CloudWatch Alarm', cor: '#e7157b', props: { metrica: 'CPU média > 70% por 5 min' } },
};

export const INSTANCIAS = { 't3.micro': 0.0104, 't3.small': 0.0208, 't3.medium': 0.0416, 'm5.large': 0.096 };
export const CLASSES_RDS = { 'db.t3.micro': 0.018, 'db.t3.small': 0.036, 'db.m5.large': 0.178 };
export const POLITICAS = ['S3ReadOnly', 'S3FullAccess', 'CloudWatchLogs', 'AdministratorAccess'];
const HORAS = 730;
const PORTA_DB = { postgres: 5432, mysql: 3306 };

export function novaArquitetura() { return { nos: [], arestas: [], seq: {} }; }

export function adicionarNo(arq, tipo, x = 40, y = 40) {
  const n = (arq.seq[tipo] = (arq.seq[tipo] ?? 0) + 1);
  const no = { id: `${tipo}-${n}`, tipo, x, y, props: structuredClone(TIPOS[tipo].props) };
  arq.nos.push(no);
  return no;
}

export function removerNo(arq, id) {
  arq.nos = arq.nos.filter((n) => n.id !== id);
  arq.arestas = arq.arestas.filter((a) => a.de !== id && a.para !== id);
  for (const n of arq.nos) {
    for (const [k, v] of Object.entries(n.props)) {
      if (v === id) n.props[k] = '';
      if (Array.isArray(v)) n.props[k] = v.filter((x) => x !== id);
    }
  }
}

// Conexões que fazem sentido (de → para).
const CONEXOES = {
  route53: ['alb', 's3', 'ec2'], alb: ['asg', 'ec2'], asg: ['rds', 's3'], ec2: ['rds', 's3'], lambda: ['rds', 's3'],
  iam: ['ec2', 'asg', 'lambda'], cloudwatch: ['asg', 'ec2'],
};
export const conexaoValida = (de, para) => (CONEXOES[de.tipo] ?? []).includes(para.tipo);

export function conectar(arq, de, para) {
  if (de === para || arq.arestas.some((a) => a.de === de && a.para === para)) return false;
  arq.arestas.push({ de, para });
  return true;
}

const regrasSg = (sg) => String(sg?.props.regras ?? '').split('\n').map((l) => l.trim().split(/\s+/)).filter((p) => p[0])
  .map(([porta, origem = '0.0.0.0/0']) => ({ porta: Number(porta), origem }));

// ---------- validação ----------

export function validar(arq) {
  const out = [];
  const by = Object.fromEntries(arq.nos.map((n) => [n.id, n]));
  const de = (tipo) => arq.nos.filter((n) => n.tipo === tipo);
  const add = (nivel, no, msg, correcao, cat = 'arq') => out.push({ nivel, no, msg, correcao, cat });
  const subnetsDe = (n) => (n.props.subnets ?? (n.props.subnet ? [n.props.subnet] : [])).map((id) => by[id]).filter(Boolean);
  const azs = (subs) => new Set(subs.map((s) => s.props.az));
  const vpcDeSubnet = (s) => by[s?.props.vpc];
  const temNatNaVpc = (vpcId) => de('nat').some((n) => vpcDeSubnet(by[n.props.subnet])?.id === vpcId);
  const sgPermite = (sgId, porta, origemNo) => {
    const sg = by[sgId];
    if (!sg) return false;
    const vpc = by[sg.props.vpc];
    return regrasSg(sg).some((r) => r.porta === porta && (r.origem === '0.0.0.0/0' || r.origem === origemNo?.props.sg || (vpc && r.origem === vpc.props.cidr)));
  };

  for (const v of de('vpc')) {
    if (!parseCidr(v.props.cidr)) add('erro', v.id, `CIDR inválido: "${v.props.cidr}".`, 'Use o formato 10.0.0.0/16.');
    const igws = de('igw').filter((g) => g.props.vpc === v.id);
    if (igws.length > 1) add('erro', v.id, 'Mais de um Internet Gateway anexado à mesma VPC.', 'Uma VPC aceita apenas um IGW. Remova os extras.');
  }

  const subs = de('subnet');
  for (const s of subs) {
    const vpc = vpcDeSubnet(s);
    if (!vpc) { add('erro', s.id, 'Sub-rede sem VPC.', 'Escolha a VPC nas propriedades da sub-rede.'); continue; }
    if (!parseCidr(s.props.cidr)) add('erro', s.id, `CIDR inválido: "${s.props.cidr}".`, 'Ex.: 10.0.1.0/24.');
    else if (parseCidr(vpc.props.cidr) && !dentro(s.props.cidr, vpc.props.cidr)) add('erro', s.id, `O bloco ${s.props.cidr} está fora do CIDR da VPC (${vpc.props.cidr}).`, 'A sub-rede deve ser um pedaço do bloco da VPC.');
    for (const o of subs) {
      if (o.id > s.id && o.props.vpc === s.props.vpc && sobrepoe(o.props.cidr, s.props.cidr)) add('erro', s.id, `Blocos de ${s.id} e ${o.id} se sobrepõem.`, 'Cada sub-rede precisa de um intervalo exclusivo (ex.: 10.0.1.0/24 e 10.0.2.0/24).');
    }
    if (s.props.publica && !de('igw').some((g) => g.props.vpc === vpc.id)) add('erro', s.id, 'Sub-rede marcada como pública, mas a VPC não tem Internet Gateway.', 'Adicione um Internet Gateway e anexe-o à VPC (a rota 0.0.0.0/0 aponta para ele).');
  }

  for (const g of de('igw')) if (!by[g.props.vpc]) add('erro', g.id, 'Internet Gateway não anexado a nenhuma VPC.', 'Escolha a VPC nas propriedades.');

  for (const n of de('nat')) {
    const s = by[n.props.subnet];
    if (!s) add('erro', n.id, 'NAT Gateway sem sub-rede.', 'Coloque-o em uma sub-rede pública.');
    else if (!s.props.publica) add('erro', n.id, 'NAT Gateway em sub-rede privada não alcança a internet.', 'O NAT público deve ficar em sub-rede pública; as privadas o usam como rota de saída.');
  }

  for (const sg of de('sg')) {
    if (!by[sg.props.vpc]) add('erro', sg.id, 'Security Group sem VPC.', 'Todo SG pertence a uma VPC.');
    for (const r of regrasSg(sg)) {
      if (!Number.isInteger(r.porta) || r.porta < 1 || r.porta > 65535) add('erro', sg.id, `Regra com porta inválida.`, 'Formato por linha: PORTA ORIGEM — ex.: 443 0.0.0.0/0 ou 80 sg-1');
      else if (r.origem === '0.0.0.0/0' && [22, 3389].includes(r.porta)) add('aviso', sg.id, `Porta ${r.porta} (acesso administrativo) aberta para a internet inteira.`, 'Restrinja a origem a uma faixa conhecida ou use SSM Session Manager.', 'seg');
      else if (r.origem === '0.0.0.0/0' && [3306, 5432, 1433, 27017].includes(r.porta)) add('erro', sg.id, `Porta de banco de dados ${r.porta} exposta à internet.`, 'Permita apenas a partir do SG da aplicação (ex.: 5432 sg-2).', 'seg');
      else if (r.origem !== '0.0.0.0/0' && !by[r.origem] && !parseCidr(r.origem)) add('erro', sg.id, `Origem "${r.origem}" não existe.`, 'Use um CIDR ou o id de outro Security Group.');
    }
  }

  const exigeSg = (n) => { if (!by[n.props.sg]) add('erro', n.id, `${TIPOS[n.tipo].nome} sem Security Group.`, 'Selecione um SG nas propriedades.'); };

  for (const a of de('alb')) {
    exigeSg(a);
    const s = subnetsDe(a);
    if (azs(s).size < 2) add('erro', a.id, 'O Application Load Balancer exige sub-redes em pelo menos duas zonas de disponibilidade.', 'Marque duas sub-redes de AZs diferentes.');
    if (a.props.publico && s.some((x) => !x.props.publica)) add('erro', a.id, 'ALB voltado à internet precisa estar em sub-redes públicas.', 'Use sub-redes públicas para o ALB; deixe as instâncias nas privadas.');
    const alvos = arq.arestas.filter((e) => e.de === a.id).map((e) => by[e.para]);
    if (!alvos.length) add('aviso', a.id, 'Load balancer sem destinos (target group vazio).', 'Conecte o ALB a um Auto Scaling Group ou EC2.');
    for (const t of alvos) {
      if (by[t.props.sg] && !sgPermite(t.props.sg, 80, a)) add('erro', t.id, `O SG ${t.props.sg} não aceita tráfego do ALB na porta 80: health check falha e o ALB retorna 503.`, `Adicione a regra "80 ${a.props.sg || 'sg-do-alb'}" no ${t.props.sg}.`);
    }
    if (a.props.publico && by[a.props.sg] && !regrasSg(by[a.props.sg]).some((r) => [80, 443].includes(r.porta) && r.origem === '0.0.0.0/0')) add('erro', a.id, 'O SG do ALB público não aceita HTTP/HTTPS da internet.', `Adicione "443 0.0.0.0/0" (e/ou 80) no ${a.props.sg}.`);
  }

  const computacao = [...de('ec2'), ...de('asg')];
  for (const c of computacao) {
    exigeSg(c);
    const s = subnetsDe(c);
    if (!s.length) { add('erro', c.id, `${TIPOS[c.tipo].nome} sem sub-rede.`, 'Escolha a(s) sub-rede(s) nas propriedades.'); continue; }
    const privadas = s.filter((x) => !x.props.publica);
    if (privadas.length && !temNatNaVpc(vpcDeSubnet(privadas[0])?.id)) add('aviso', c.id, 'Instâncias em sub-rede privada sem NAT Gateway não baixam atualizações nem acessam APIs externas.', 'Adicione um NAT Gateway numa sub-rede pública da mesma VPC.');
    if (c.tipo === 'ec2' && c.props.ipPublico && privadas.length) add('aviso', c.id, 'IP público em sub-rede privada não tem efeito (não há rota para o IGW).', 'Desmarque o IP público ou mova a instância.');
    if (c.tipo === 'asg') {
      const { min, desejado, max } = c.props;
      if (!(min >= 1 && min <= desejado && desejado <= max)) add('erro', c.id, `Capacidade inconsistente: mínimo ${min}, desejado ${desejado}, máximo ${max}.`, 'Respeite 1 ≤ mínimo ≤ desejado ≤ máximo.');
      if (azs(s).size < 2) add('aviso', c.id, 'Auto Scaling em uma única AZ: uma falha da zona derruba todas as instâncias.', 'Distribua o grupo em sub-redes de duas AZs.');
      if (!arq.arestas.some((e) => e.para === c.id && by[e.de]?.tipo === 'cloudwatch')) add('aviso', c.id, 'Sem alarme do CloudWatch: o grupo não escala diante de picos.', 'Conecte um CloudWatch Alarm ao Auto Scaling Group.');
    }
  }

  for (const r of de('rds')) {
    exigeSg(r);
    const s = subnetsDe(r);
    if (azs(s).size < 2) add('erro', r.id, 'O DB subnet group do RDS exige sub-redes em pelo menos duas AZs (mesmo sem Multi-AZ).', 'Marque duas sub-redes privadas de AZs diferentes.');
    if (r.props.publico || s.some((x) => x.props.publica)) add('erro', r.id, 'Banco de dados exposto: acessível publicamente ou em sub-rede pública.', 'Use sub-redes privadas e desmarque "acesso público".', 'seg');
    const porta = PORTA_DB[r.props.motor];
    for (const e of arq.arestas.filter((x) => x.para === r.id)) {
      const origem = by[e.de];
      if (origem.tipo !== 'lambda' && by[r.props.sg] && !sgPermite(r.props.sg, porta, origem)) add('erro', r.id, `O SG ${r.props.sg} bloqueia ${origem.id} na porta ${porta} (${r.props.motor}).`, `Adicione "${porta} ${origem.props.sg || 'sg-da-aplicacao'}" no ${r.props.sg}.`);
    }
  }

  for (const s of de('s3')) if (!s.props.bloqueioPublico) add('aviso', s.id, 'Bucket com bloqueio de acesso público desativado.', 'Mantenha o Block Public Access; para sites, prefira CloudFront com OAC.', 'seg');

  for (const i of de('iam')) {
    if (i.props.politica === 'AdministratorAccess' && arq.arestas.some((e) => e.de === i.id)) add('aviso', i.id, 'Role com AdministratorAccess anexada a uma carga de trabalho.', 'Princípio do menor privilégio: conceda só o necessário (ex.: S3ReadOnly).', 'seg');
    if (!arq.arestas.some((e) => e.de === i.id)) add('aviso', i.id, 'Role não anexada a nenhum recurso.', 'Conecte a role a uma EC2, ASG ou Lambda.');
  }
  for (const l of de('lambda')) if (!arq.arestas.some((e) => e.para === l.id && by[e.de]?.tipo === 'iam')) add('erro', l.id, 'Toda função Lambda precisa de uma execution role (IAM).', 'Conecte uma IAM Role à função.');
  for (const c of [...computacao, ...de('lambda')]) {
    const usaS3 = arq.arestas.some((e) => e.de === c.id && by[e.para]?.tipo === 's3');
    const roles = arq.arestas.filter((e) => e.para === c.id && by[e.de]?.tipo === 'iam').map((e) => by[e.de].props.politica);
    if (usaS3 && !roles.some((p) => /S3|Administrator/.test(p))) add('erro', c.id, `${c.id} acessa o S3 sem permissão: a chamada retorna AccessDenied.`, 'Anexe uma IAM Role com política de S3 (não use chaves de acesso fixas no código).', 'seg');
  }

  for (const r of de('route53')) {
    for (const e of arq.arestas.filter((x) => x.de === r.id)) {
      const t = by[e.para];
      if (t.tipo === 'alb' && !t.props.publico) add('erro', r.id, 'Registro público apontando para um ALB interno.', 'Marque o ALB como voltado à internet.');
      if (t.tipo === 'ec2' && !t.props.ipPublico) add('erro', r.id, `${t.id} não tem IP público para o registro DNS.`, 'Prefira apontar para um ALB.');
    }
  }

  for (const e of arq.arestas) {
    const [a, b] = [by[e.de], by[e.para]];
    if (a && b && !conexaoValida(a, b)) add('aviso', a.id, `Conexão ${a.id} → ${b.id} não tem significado neste laboratório.`, 'Veja as conexões suportadas no painel de ajuda.');
  }
  return out;
}

// ---------- custo ----------

export function estimarCusto(arq) {
  const itens = [];
  const add = (no, desc, usd) => itens.push({ no, desc, usd: Math.round(usd * 100) / 100 });
  for (const n of arq.nos) {
    const p = n.props;
    if (n.tipo === 'ec2') { add(n.id, `${p.tipo} × ${HORAS} h`, INSTANCIAS[p.tipo] * HORAS); if (p.ipPublico) add(n.id, 'IPv4 público', 0.005 * HORAS); }
    if (n.tipo === 'asg') add(n.id, `${p.desejado} × ${p.tipo} (capacidade desejada)`, p.desejado * INSTANCIAS[p.tipo] * HORAS);
    if (n.tipo === 'alb') add(n.id, 'ALB (hora, sem LCU)', 0.0225 * HORAS);
    if (n.tipo === 'nat') add(n.id, 'NAT Gateway (hora + IPv4, sem tráfego)', (0.045 + 0.005) * HORAS);
    if (n.tipo === 'rds') add(n.id, `${p.classe}${p.multiAZ ? ' Multi-AZ (×2)' : ''} + 20 GB`, (CLASSES_RDS[p.classe] * HORAS + 20 * 0.115) * (p.multiAZ ? 2 : 1));
    if (n.tipo === 's3') add(n.id, '50 GB Standard (estimativa)', 50 * 0.023);
    if (n.tipo === 'route53') add(n.id, 'Zona hospedada', 0.5);
    if (n.tipo === 'cloudwatch') add(n.id, 'Alarme padrão', 0.1);
    if (n.tipo === 'lambda') add(n.id, '1 milhão de invocações (free tier)', 0);
  }
  return { itens, total: Math.round(itens.reduce((s, i) => s + i.usd, 0) * 100) / 100 };
}

// ---------- simulação ----------

const ORDEM = ['vpc', 'igw', 'subnet', 'sg', 'iam', 'nat', 's3', 'rds', 'lambda', 'ec2', 'asg', 'alb', 'cloudwatch', 'route53'];
export function planoProvisionamento(arq) {
  return [...arq.nos].sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo)).map((n) => n.id);
}

// O serviço web continua no ar se a AZ `az` cair?
export function simularFalhaAz(arq, az) {
  const by = Object.fromEntries(arq.nos.map((n) => [n.id, n]));
  const azDe = (id) => by[id]?.props.az;
  const vivas = (ids) => ids.filter((id) => by[id] && azDe(id) !== az);
  const log = [];
  const albs = arq.nos.filter((n) => n.tipo === 'alb');
  if (!albs.length) return { ok: false, log: ['Sem load balancer: não há ponto de entrada redundante.'] };
  let ok = true;
  for (const a of albs) {
    if (!vivas(a.props.subnets).length) { ok = false; log.push(`${a.id}: todas as sub-redes estavam na AZ ${az}.`); continue; }
    log.push(`${a.id}: continua atendendo pelas sub-redes restantes.`);
    const alvos = arq.arestas.filter((e) => e.de === a.id).map((e) => by[e.para]);
    const saudaveis = alvos.filter((t) => (t.tipo === 'asg' ? vivas(t.props.subnets).length > 0 : azDe(t.props.subnet) !== az));
    if (!saudaveis.length) { ok = false; log.push(`${a.id}: nenhum destino saudável (todos na AZ ${az}) → 503.`); }
    for (const t of saudaveis) {
      if (t.tipo === 'asg') log.push(`${t.id}: substitui as instâncias perdidas em ${vivas(t.props.subnets).map(azDe).join(', ')}.`);
      for (const e of arq.arestas.filter((x) => x.de === t.id && by[x.para]?.tipo === 'rds')) {
        const r = by[e.para];
        const primaria = azDe(r.props.subnets[0]);
        if (primaria !== az) log.push(`${r.id}: primária fora da AZ afetada.`);
        else if (r.props.multiAZ && vivas(r.props.subnets).length) log.push(`${r.id}: failover automático para a réplica standby (Multi-AZ), ~60–120 s.`);
        else { ok = false; log.push(`${r.id}: banco indisponível (single-AZ na zona ${az}). Seria preciso restaurar de backup.`); }
      }
    }
  }
  return { ok, log };
}

export function simularPico(arq, demanda = 350) {
  const log = [];
  let capacidade = 0;
  for (const n of arq.nos) {
    if (n.tipo === 'asg') {
      const alarme = arq.arestas.some((e) => e.para === n.id && arq.nos.find((x) => x.id === e.de)?.tipo === 'cloudwatch');
      const inst = alarme ? n.props.max : n.props.desejado;
      capacidade += inst * 100;
      log.push(alarme ? `${n.id}: alarme disparou, escalou de ${n.props.desejado} para ${inst} instâncias.` : `${n.id}: sem alarme, ficou em ${inst} instâncias.`);
    }
    if (n.tipo === 'ec2' && arq.arestas.some((e) => e.para === n.id && arq.nos.find((x) => x.id === e.de)?.tipo === 'alb')) { capacidade += 100; log.push(`${n.id}: instância fixa, 100 req/s.`); }
  }
  log.push(`Capacidade: ${capacidade} req/s · demanda do pico: ${demanda} req/s (cada instância ≈ 100 req/s neste modelo).`);
  return { ok: capacidade >= demanda, log };
}

// ---------- infraestrutura como código (esboço) ----------

const CFN = {
  vpc: 'AWS::EC2::VPC', subnet: 'AWS::EC2::Subnet', igw: 'AWS::EC2::InternetGateway', nat: 'AWS::EC2::NatGateway', route53: 'AWS::Route53::RecordSet',
  alb: 'AWS::ElasticLoadBalancingV2::LoadBalancer', asg: 'AWS::AutoScaling::AutoScalingGroup', ec2: 'AWS::EC2::Instance', lambda: 'AWS::Lambda::Function',
  rds: 'AWS::RDS::DBInstance', s3: 'AWS::S3::Bucket', sg: 'AWS::EC2::SecurityGroup', iam: 'AWS::IAM::Role', cloudwatch: 'AWS::CloudWatch::Alarm',
};
const logico = (id) => id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

export function gerarCloudFormation(arq) {
  const ref = (id) => `!Ref ${logico(id)}`;
  const lista = (ids) => `[${ids.map(ref).join(', ')}]`;
  const props = (n) => {
    const p = n.props;
    switch (n.tipo) {
      case 'vpc': return { CidrBlock: p.cidr };
      case 'subnet': return { VpcId: ref(p.vpc), CidrBlock: p.cidr, AvailabilityZone: `!Select [${'abc'.indexOf(p.az)}, !GetAZs '']`, MapPublicIpOnLaunch: p.publica };
      case 'nat': return { SubnetId: ref(p.subnet), AllocationId: '# Elastic IP' };
      case 'alb': return { Scheme: p.publico ? 'internet-facing' : 'internal', Subnets: lista(p.subnets), SecurityGroups: lista([p.sg].filter(Boolean)) };
      case 'asg': return { MinSize: p.min, DesiredCapacity: p.desejado, MaxSize: p.max, VPCZoneIdentifier: lista(p.subnets), '# InstanceType': p.tipo };
      case 'ec2': return { InstanceType: p.tipo, SubnetId: ref(p.subnet), SecurityGroupIds: lista([p.sg].filter(Boolean)) };
      case 'rds': return { Engine: p.motor, DBInstanceClass: p.classe, MultiAZ: p.multiAZ, PubliclyAccessible: p.publico, AllocatedStorage: 20 };
      case 's3': return { VersioningConfiguration: `{ Status: ${p.versionamento ? 'Enabled' : 'Suspended'} }`, PublicAccessBlockConfiguration: `{ BlockPublicAcls: ${p.bloqueioPublico} }` };
      case 'sg': return { VpcId: ref(p.vpc), SecurityGroupIngress: regrasSg(n).map((r) => `{ IpProtocol: tcp, FromPort: ${r.porta}, ToPort: ${r.porta}, ${r.origem.includes('/') ? `CidrIp: ${r.origem}` : `SourceSecurityGroupId: ${ref(r.origem)}`} }`).join(', ') || '[]' };
      case 'iam': return { ManagedPolicyArns: `[arn:aws:iam::aws:policy/${p.politica === 'S3ReadOnly' ? 'AmazonS3ReadOnlyAccess' : p.politica === 'S3FullAccess' ? 'AmazonS3FullAccess' : p.politica === 'CloudWatchLogs' ? 'CloudWatchLogsFullAccess' : 'AdministratorAccess'}]` };
      case 'lambda': return { MemorySize: p.memoria, Runtime: 'nodejs20.x' };
      case 'route53': return { Name: p.dominio, Type: 'A' };
      case 'cloudwatch': return { MetricName: 'CPUUtilization', Threshold: 70, ComparisonOperator: 'GreaterThanThreshold' };
      default: return {};
    }
  };
  let y = "# ESBOÇO DIDÁTICO gerado pelo laboratório — incompleto e NÃO validado pela AWS.\n# Não implante sem revisar (faltam rotas, launch template, credenciais etc.).\nAWSTemplateFormatVersion: '2010-09-09'\nResources:\n";
  for (const n of arq.nos) {
    y += `  ${logico(n.id)}:\n    Type: ${CFN[n.tipo]}\n    Properties:\n`;
    const p = props(n);
    y += Object.keys(p).length ? Object.entries(p).map(([k, v]) => `      ${k}: ${v}`).join('\n') + '\n' : '      {}\n';
  }
  return y;
}

// ---------- missões ----------

const tem = (arq, tipo) => arq.nos.some((n) => n.tipo === tipo);
const semErros = (v) => !v.some((x) => x.nivel === 'erro');

export const MISSOES_AWS = [
  {
    id: 'rede', titulo: 'Rede básica', xp: 30,
    descricao: 'Crie uma VPC com Internet Gateway e duas sub-redes públicas em AZs diferentes, sem erros.',
    check: (arq, v) => semErros(v) && tem(arq, 'igw') && new Set(arq.nos.filter((n) => n.tipo === 'subnet' && n.props.publica).map((n) => n.props.az)).size >= 2,
  },
  {
    id: 'web-ha', titulo: 'Aplicação web de alta disponibilidade', xp: 60,
    descricao: 'Route 53 → ALB público (2 AZs) → Auto Scaling em sub-redes privadas (2 AZs) → RDS Multi-AZ privado. Sem erros e resistindo à queda de qualquer AZ.',
    check: (arq, v) => semErros(v) && ['route53', 'alb', 'asg', 'rds'].every((t) => tem(arq, t)) && simularFalhaAz(arq, 'a').ok && simularFalhaAz(arq, 'b').ok,
  },
  {
    id: 'seguranca', titulo: 'Defesa em camadas', xp: 40,
    descricao: 'Tenha ALB, Auto Scaling e RDS sem nenhum erro nem aviso de segurança (SG encadeados, nada de SSH ou banco abertos para 0.0.0.0/0).',
    check: (arq, v) => semErros(v) && ['alb', 'asg', 'rds'].every((t) => tem(arq, t)) && !v.some((x) => x.cat === 'seg'),
  },
  {
    id: 'elasticidade', titulo: 'Aguentar o pico', xp: 40,
    descricao: 'Configure o Auto Scaling com alarme do CloudWatch para suportar um pico de 350 req/s.',
    check: (arq, v) => semErros(v) && simularPico(arq).ok && tem(arq, 'cloudwatch'),
  },
  {
    id: 'serverless', titulo: 'Serverless com menor privilégio', xp: 40,
    descricao: 'Uma Lambda que grava no S3, com IAM Role adequada (sem AdministratorAccess) e bucket privado.',
    check: (arq, v) => semErros(v) && tem(arq, 'lambda') && arq.arestas.some((e) => e.de.startsWith('lambda') && e.para.startsWith('s3')) && !v.some((x) => x.cat === 'seg'),
  },
  {
    id: 'custo', titulo: 'Alta disponibilidade econômica', xp: 50,
    descricao: 'Cumpra a missão de alta disponibilidade com custo estimado abaixo de US$ 120/mês.',
    check: (arq, v) => MISSOES_AWS[1].check(arq, v) && estimarCusto(arq).total < 120,
  },
];

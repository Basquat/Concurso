// Laboratório de Montagem de Servidor
// Simula a montagem e configuração de um servidor Linux didático.

export const SERVIDOR_INICIAL = {
  host: 'srv-didatico',
  so: 'Ubuntu 22.04 LTS',
  kernel: '5.15.0-72-generic',
  cpu: '4 vCPU',
  ram: '8 GB',
  disco: '100 GB SSD',
  rede: '192.168.1.10/24',
  servicos: [],
  usuarios: [
    { nome: 'aluno', tipo: 'humano', home: '/home/aluno', sudo: true },
    { nome: 'www', tipo: 'sistema', home: '/var/www', sudo: false },
    { nome: 'postgres', tipo: 'sistema', home: '/var/lib/postgresql', sudo: false },
  ],
  pacotes: ['curl', 'git', 'vim', 'nano', 'openssh-server', 'nginx', 'postgresql'],
  estado: 'desligado',
};

export function criarServidor() {
  return JSON.parse(JSON.stringify(SERVIDOR_INICIAL));
}

export function ligarServidor(s) {
  if (s.estado === 'ligado') return { ok: false, msg: 'Servidor já está ligado.' };
  s.estado = 'ligado';
  s.servicos = ['ssh', 'nginx'];
  return { ok: true, msg: 'Servidor ligado. Serviços iniciais: ssh, nginx.' };
}

export function desligarServidor(s) {
  if (s.estado === 'desligado') return { ok: false, msg: 'Servidor já está desligado.' };
  s.estado = 'desligado';
  s.servicos = [];
  return { ok: true, msg: 'Servidor desligado.' };
}

export function instalarPacote(s, pacote) {
  const disponiveis = ['curl', 'git', 'vim', 'nano', 'openssh-server', 'nginx', 'postgresql', 'docker', 'python3', 'nodejs', 'ufw', 'fail2ban'];
  if (!disponiveis.includes(pacote)) return { ok: false, msg: `Pacote "${pacote}" não encontrado no repositório.` };
  if (s.pacotes.includes(pacote)) return { ok: false, msg: `Pacote "${pacote}" já está instalado.` };
  s.pacotes.push(pacote);
  if (pacote === 'nginx') s.servicos.push('nginx');
  if (pacote === 'postgresql') s.servicos.push('postgresql');
  if (pacote === 'docker') s.servicos.push('docker');
  return { ok: true, msg: `Pacote ${pacote} instalado com sucesso.` };
}

export function criarUsuario(s, { nome, tipo, sudo }) {
  if (s.usuarios.some(u => u.nome === nome)) return { ok: false, msg: `Usuário "${nome}" já existe.` };
  s.usuarios.push({ nome, tipo, sudo: !!sudo, home: `/home/${nome}` });
  return { ok: true, msg: `Usuário ${nome} criado.` };
}

export function configurarRede(s, { ip, mascara, gateway, dns }) {
  s.rede = `${ip}/${mascara}`;
  return { ok: true, msg: `Rede configurada: ${ip}/${mascara} (gateway: ${gateway}, DNS: ${dns}).` };
}

export function statusServidor(s) {
  return {
    estado: s.estado,
    so: s.so,
    kernel: s.kernel,
    cpu: s.cpu,
    ram: s.ram,
    disco: s.disco,
    rede: s.rede,
    servicos: s.servicos,
    pacotes: s.pacotes,
    usuarios: s.usuarios,
  };
}

export function instalarServico(s, servico) {
  const mapeamento = { nginx: 'nginx', postgresql: 'postgresql', docker: 'docker', ssh: 'openssh-server' };
  const pacote = mapeamento[servico];
  if (!pacote) return { ok: false, msg: `Serviço "${servico}" desconhecido.` };
  if (!s.pacotes.includes(pacote)) {
    const inst = instalarPacote(s, pacote);
    if (!inst.ok) return inst;
  }
  if (!s.servicos.includes(servico)) s.servicos.push(servico);
  return { ok: true, msg: `Serviço ${servico} iniciado.` };
}
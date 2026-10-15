export const MISSOES_SERVIDOR = [
  { id: 'servidor-ligar', titulo: 'Ligar o servidor', xp: 50, descricao: 'Use o comando "ligar" no terminal.', dica: 'Use o comando "ligar" no terminal.' },
  { id: 'servidor-nginx', titulo: 'Instalar e iniciar nginx', xp: 75, descricao: 'Instale o pacote nginx e inicie o serviço.', dica: 'Use "instalar nginx" e depois "instalar-servico nginx".' },
  { id: 'servidor-pgsql', titulo: 'Instalar PostgreSQL', xp: 75, descricao: 'Instale o pacote postgresql.', dica: 'Use "instalar postgresql".' },
  { id: 'servidor-usuario', titulo: 'Criar um usuário com sudo', xp: 60, descricao: 'Crie um novo usuário.', dica: 'Use "add-usuario nome tipo sudo".' },
  { id: 'servidor-rede', titulo: 'Configurar a rede', xp: 80, descricao: 'Configure o IP e a máscara.', dica: 'Use "config-rede 192.168.1.10/24".' },
  { id: 'servidor-status', titulo: 'Consultar status do servidor', xp: 40, descricao: 'Exiba o status do servidor.', dica: 'Use "status" a qualquer momento.' },
];
const C = { 'servidor-ligar': (s) => s.estado === 'ligado', 'servidor-nginx': (s) => s.servicos.includes('nginx') && s.pacotes.includes('nginx'), 'servidor-pgsql': (s) => s.pacotes.includes('postgresql'), 'servidor-usuario': (s) => s.usuarios.some((u) => u.sudo && !['aluno'].includes(u.nome)), 'servidor-rede': (s) => s.rede !== '192.168.1.10/24' || s.redeConfigurada, 'servidor-status': (s) => !!s.statusVisto };
MISSOES_SERVIDOR.forEach((m) => { m.check = C[m.id]; });
